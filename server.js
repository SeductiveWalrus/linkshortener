//Imports
let express = require("express");
let fs = require("fs");
let redis = require("redis");
let bodyParser = require("body-parser");
let urlRegex = require("url-regex");
var datetime = require('node-datetime');
let http = require("http");
let https = require("https");

//Express
let app = express();

//File System
console.log("Fetching data...");
let links = JSON.parse(fs.readFileSync(__dirname + "/data/links.json"));
let bans = JSON.parse(fs.readFileSync(__dirname + "/data/bans.json"));
let adminKeys = JSON.parse(fs.readFileSync(__dirname + "/data/adminKeys.json"))["array"];
let certLocations = JSON.parse(fs.readFileSync(__dirname + "/data/certLocations.json"));
const httpsOptions = {
    key: fs.readFileSync(certLocations["privateKey"]),
    cert: fs.readFileSync(certLocations["cert"])
};
console.log("Done");

//Server
const PORT = process.env.PORT || 80;
const SECURE_PORT = process.env.PORT || 443;
let server = https.createServer(httpsOptions, app).listen(SECURE_PORT);
let server_unsecure = http.createServer(app).listen(PORT);

//Middleware 

app.use((req, res, next) =>{
    let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(bans[ip]){
        res.statusCode = 403;
        res.sendFile(__dirname + "/public/403.html");
    }else next();
});

let recentReq= {};
app.use((req, res, next) =>{
    let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(!recentReq[ip]) recentReq[ip] = 0;
    recentReq[ip]++;    
    setTimeout(() =>{
        recentReq[ip] = 0;
    }, 8000);
    if(recentReq[ip] >= 12){
        if(!bans[ip]){
            banUser(ip, "Request Spam");
            next(); 
        }
    }else next();
});

app.use((req, res, next) =>{
    if(req.secure) {
        next();
    }else{
        res.redirect('https://' + req.headers.host + req.url);
    }
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

//Routing
app.get("/", (req, res) =>{
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/shorten", (req, res) =>{
    res.sendFile(__dirname + "/public/shorten.html");
});

// Shortened Urls
app.get("/:name", (req, res, next) =>{
    if(links[req.params.name]){
        res.redirect(301, links[req.params.name]["url"]);
    }else next();
});

app.get("/admin", (req, res) =>{
    res.sendFile(__dirname + "/public/admin.html");
});

app.get("/links", (req, res) =>{
    res.sendFile(__dirname + "/public/viewlinks.html");
});

app.get("*", (req, res) =>{
    res.sendFile(__dirname + "/public/404.html");
});

app.post("/getlinks", (req, res) =>{
    let body = req.body;
    if(!body["key"] || !adminKeys.includes(body["key"])){
        res.status(409);
        res.send("Invalid Key");
        return;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(links));
});

app.post("/shorten", (req, res) =>{
    let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    let body = req.body;
    if(!body["url"]){
        res.statusCode = 409;
        res.send("Insufficient information");
        return;
    } 

    if(!isUrlValid(body["url"])){
        res.statusCode = 409;
        res.send("Invalid Link");  
        return;
    } 

    if(links[body["name"]]){
        res.statusCode = 409;
        res.send("This custom link is already in use"); 
        return;
    }   

    let longURL = body["url"];
    let name = body["name"];

    res.statusCode = 200;
    res.send(`https://${req.headers.host}/${shortenURL(name, longURL, ip)}`);
});

app.post("/admin/:action", (req, res) =>{
    let body = req.body;
    if(body){
        if(adminKeys.includes(body["key"])){
            let action = req.params.action;
            switch(action){
                case "banUser":
                res.send(banUser(body["param1"], body["param2"]));
                break;

                case "unbanUser":
                res.send(unbanUser(body["param1"]));
                break;

                case "deleteLink":
                res.send(deleteLink(body["param1"]));
                break;

                case "deleteCustomLink":
                res.send(deleteCustomLink(body["param1"]));
                break;

                case "wipeLinks":
                res.send(wipeLinks());
                break;

                default:
                res.send("Invalid action");
            }
            console.log(`${body["key"]} performed ${action}`);
        }else return res.send("Invalid key");
    }else return res.send("Insufficient information");
});

//Abstractions
function randomString(length){
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    let string = "";
    for(i = 0; i < length; i++){
        string += characters[Math.round(Math.random() * (characters.length - 1))];
    }
    return string;
}

function shortenURL(name, url, ip){
    if(name === "" || !name){
        name = randomString(4);
        if(links[name]) return shortenURL(url);
    }

    links[name] = {
        url: url,
        ip: ip,
        createdOn: currentDate()
    }

    updateLinksFile();
    return name;
}

function updateLinksFile(){
    fs.writeFile(__dirname + "/data/links.json", JSON.stringify(links, null, 2), err =>{
        if(err) throw err;
    });
}

function updateBansFile(){
    fs.writeFile(__dirname + "/data/bans.json", JSON.stringify(bans, null, 2), err =>{
        if(err) throw err;
    });
}

function isUrlValid(url){
    return urlRegex().test(url);
}

function currentDate(){
    let dt = datetime.create();
    return dt.format('Y-m-d H:M:S');
}

function banUser(ip, reason){
    if(!ip || !reason) return "Specify an ip and reason";
    if(bans[ip]) return `${ip} was already banned for "${bans[ip]["reason"]}"`;
    bans[ip] = {
        reason: reason,
        bannedOn: currentDate()
    };
    updateBansFile();
    console.log(`"${ip}" was banned for "${reason}"`);
    return `Banned ${ip} for "${reason}"`;
}

function unbanUser(ip){
    if(!ip) return "Specify an ip";
    if(!bans[ip]) return `"${ip}" is not banned`;
    delete bans[ip];
    updateBansFile();
    console.log(`"${ip}" was unbanned`);
    return `Unbanned "${ip}"`;
}

function deleteLink(id){
    if(!id || !links[id]) return "Specify a valid id";
    delete links[id];
    updateLinksFile();
    console.log(`Link "${id}" was deleted`)
    return `Deleted link "${id}"`;
}

function deleteCustomLink(name){
    if(!name || !customLinks[name]) return "Specify a valid name";
    delete customLinks[name];
    updateCustomLinksFile();
    console.log(`Custom link "${name}" was deleted`);
    return `Deleted custom link "${name}"`;
}

function wipeLinks(){
    links = {};
    customLinks = {};
    updateLinksFile();
    updateCustomLinksFile();
    console.log("All links wiped");
    return "All links wiped";
}
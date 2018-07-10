//Imports
let express = require("express");
let fs = require("fs");
let bodyParser = require("body-parser");
let urlRegex = require("url-regex");
let datetime = require('node-datetime');
let http = require("http");
let https = require("https");

//Express
let app = express();

//File System
let files = fs.readdirSync(__dirname + "/data");
console.log("Attempting to load " + files.length + " files");
let data = {};
for(i = 0; i < files.length; i++){
    if(!files[i].endsWith(".json")) continue;
    data[removeEndCharacters(files[i], 5)] = JSON.parse(fs.readFileSync(__dirname + "/data/" + files[i]));
    console.log(getWholePercent(i + 1, files.length) + "%");
}

const httpsOptions = {
    key: fs.readFileSync(data.certLocations["privateKey"]),
    cert: fs.readFileSync(data.certLocations["cert"])
};

//Server
const PORT = process.env.PORT || 80;
const SECURE_PORT = process.env.PORT || 443;
let server = https.createServer(httpsOptions, app).listen(SECURE_PORT);
let server_unsecure = http.createServer(app).listen(PORT);

//Middleware 
app.use((req, res, next) =>{
    let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(data.bans[ip]){
        res.statusCode = 403;
        res.sendFile(__dirname + "/public/403.html");
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
    if(data.links[req.params.name]){
        res.redirect(301, data.links[req.params.name]["url"]);
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
    if(!body["key"] || !data.adminKeys.includes(body["key"])){
        res.status(409);
        res.send("Invalid Key");
        return;
    }
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(data.links));
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

    if(data.links[body["name"]]){
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
        if(data.adminKeys.includes(body["key"])){
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
        if(data.links[name]) return shortenURL(url);
    }

    data.links[name] = {
        url: url,
        ip: ip,
        createdOn: currentDate()
    }

    updateLinksFile();
    return name;
}

function updateLinksFile(){
    fs.writeFile(__dirname + "/data/links.json", JSON.stringify(data.links, null, 2), err =>{
        if(err) throw err;
    });
}

function updateBansFile(){
    fs.writeFile(__dirname + "/data/bans.json", JSON.stringify(data.bans, null, 2), err =>{
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
    if(data.bans[ip]) return `${ip} was already banned for "${data.bans[ip]["reason"]}"`;
    data.bans[ip] = {
        reason: reason,
        bannedOn: currentDate()
    };
    updateBansFile();
    console.log(`"${ip}" was banned for "${reason}"`);
    return `Banned ${ip} for "${reason}"`;
}

function unbanUser(ip){
    if(!ip) return "Specify an ip";
    if(!data.bans[ip]) return `"${ip}" is not banned`;
    delete data.bans[ip];
    updateBansFile();
    console.log(`"${ip}" was unbanned`);
    return `Unbanned "${ip}"`;
}

function deleteLink(id){
    if(!id || !data.links[id]) return "Specify a valid id";
    delete data.links[id];
    updateLinksFile();
    console.log(`Link "${id}" was deleted`)
    return `Deleted link "${id}"`;
}

function wipeLinks(){
    data.links = {};
    updateLinksFile();
    console.log("All links wiped");
    return "All links wiped";
}

function removeEndCharacters(string, amount = 5){
    let stringArray = string.split("");
    stringArray.splice(stringArray.length - amount, stringArray.length - (stringArray.length - amount));
    return stringArray.join("");
}

function getWholePercent(percentFor,percentOf){
    return Math.floor(percentFor/percentOf*100);
}
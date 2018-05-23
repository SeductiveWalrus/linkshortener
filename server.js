//Express
let express = require("express");
let app = express();

//Server
const PORT = process.env.PORT || 80;
let server = app.listen(PORT, () =>{console.log(`Listening on port ${PORT}`);});

//File System
let fs = require("fs");
console.log("Fetching data...");
let links = JSON.parse(fs.readFileSync(__dirname + "/data/links.json"));
let bans = JSON.parse(fs.readFileSync(__dirname + "/data/bans.json"));
console.log("Done");

//Redis
let redis = require("redis");

//Middleware 
let bodyParser = require("body-parser");
app.use(bodyParser.text());
app.use(express.static("public"));

//Routing
app.get("/", (req, res) =>{
    res.redirect(301, "/shorten");
});

app.get("/shorten", (req, res) =>{
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/:id", (req, res, next) =>{
    if(links[req.params.id]){
        res.redirect(301, links[req.params.id]);
    }else next();
});

app.get("*", (req, res) =>{
    res.sendFile(__dirname + "/public/404.html");
})

app.post("/shorten", (req, res) =>{
    let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if(bans[ip]){
        res.send(`You have been banned for ${bans[ip]["reason"]}`);
        console.log(`Attempted access from banned: ${ip}`);
        return;
    }
    if(req.body == undefined || req.body == "" || req.body == null){
        res.send("No URL found");
        return;
    }
    if(typeof req.body === "string"){
        if(isUrlValid(req.body)){
            res.send("http://" + req.headers.host + "/" + shortenURL(req.body));
        }else res.send("Invalid Link");
    }else res.send("Invalid Link");
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

function shortenURL(url){
    let id = randomString(4);
    if(links[id]) return shortenURL(url);
    links[id] = url;
    updateLinksFile();
    return id; 
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
    let urlRegex = require("url-regex");
    return urlRegex().test(url);
}

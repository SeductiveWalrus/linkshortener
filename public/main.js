if(document.getElementById("urlForm")){
    let urlForm = document.getElementById("urlForm");
    urlForm.onsubmit = e =>{
    e.preventDefault();
    let urlInput = document.getElementById("url");
    let urlResult = document.getElementById("urlResult");
    let copyButton = document.getElementById("copyButton");
    copyButton.onclick = e =>{
        let textarea = document.createElement("textarea");
        textarea.id = "temp_element";
        textarea.style.height = 0;
        document.body.appendChild(textarea);
        textarea.value = urlResult.innerHTML;
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    }
    let longURL = urlInput.value;
    let request = new XMLHttpRequest();
    request.onreadystatechange = () =>{
        if(request.readyState == 4 && request.status == 200){
            document.getElementById("resultContainer").style.display = "initial";
            urlResult.innerHTML = request.response;
        }
    };
    request.open("POST", "/shorten");
    request.setRequestHeader("Content-Type", "text/plain");
    request.send(longURL);
    };
}

if(document.getElementById("customUrlForm")){
    let customUrlForm = document.getElementById("customUrlForm");
    customUrlForm.onsubmit = e =>{
    e.preventDefault();
    let urlInput = document.getElementById("url");
    let nameInput = document.getElementById("name");
    let urlResult = document.getElementById("urlResult");
    let copyButton = document.getElementById("copyButton");
    copyButton.onclick = e =>{
        let textarea = document.createElement("textarea");
        textarea.id = "temp_element";
        textarea.style.height = 0;
        document.body.appendChild(textarea);
        textarea.value = urlResult.innerHTML;
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
    }
    let URL = urlInput.value;
    let name = nameInput.value;
    let request = new XMLHttpRequest();
    request.onreadystatechange = () =>{
        if(request.readyState == 4 && request.status == 200){
            document.getElementById("resultContainer").style.display = "initial";
            urlResult.innerHTML = request.response;
        }
    };
    request.open("POST", "/custom");
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify({
        name: name,
        url: URL
    }));
    };
}

if(document.getElementById("adminForm")){
    let adminForm = document.getElementById("adminForm");
    adminForm.onsubmit = e =>{
        e.preventDefault();
        let request = new XMLHttpRequest();
        request.onreadystatechange = () =>{
            if(request.readyState == 4 && request.status == 200){
                document.getElementById("adminResult").innerHTML = request.response;
            }
        };
        request.open("POST", "/admin/" + document.getElementById("action").value);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify({
            key: document.getElementById("key").value,
            param1: document.getElementById("param1").value,
            param2: document.getElementById("param2").value
        }));
    }
}

if(document.getElementById("linksForm")){
    let linksForm = document.getElementById("linksForm");
    linksForm.onsubmit = e =>{
        e.preventDefault();
        let request = new XMLHttpRequest();
        request.onreadystatechange = () =>{
            if(request.readyState == 4 && request.status == 200){
                linksForm.style.display = "none";
                let table = document.getElementById("table");
                table.style.display = "initial";
                let links = JSON.parse(request.response);
                let keys = Object.keys(links);
                for(i = 0; i < keys.length; i++){
                    table.innerHTML += `<tr><td>${keys[i]}</td><td>${links[keys[i]]["createdOn"]}</td><td>${links[keys[i]]["ip"]}</td><td><a target="_blank" href="${links[keys[i]]["url"]}">${links[keys[i]]["url"]}</a></td></tr>`
                }
            }else if(request.status == 400){
                document.getElementById("miscResult").innerHTML = request.response;
            }
        };
        request.open("POST", "/getlinks");
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify({
           key: document.getElementById("key").value 
        }));
    };
}
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
        let data = {
            key: document.getElementById("key").value,
            param1: document.getElementById("param1").value,
            param2: document.getElementById("param2").value
        }
        request.send(JSON.stringify(data));
    }
}

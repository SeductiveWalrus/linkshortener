let urlForm = document.getElementById("urlForm");
let urlInput = document.getElementById("url");
let urlResult = document.getElementById("urlResult");
let copyButton = document.getElementById("copyButton");

urlForm.onsubmit = e =>{
    e.preventDefault();
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
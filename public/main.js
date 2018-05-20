let urlForm = document.getElementById("urlForm");
let urlInput = document.getElementById("url");
let urlResult = document.getElementById("urlResult");

urlForm.onsubmit = e =>{
    e.preventDefault();
    let longURL = urlInput.value;
    let request = new XMLHttpRequest();
        request.onreadystatechange = () =>{
        if(request.readyState == 4 && request.status == 200){
            urlResult.innerHTML = request.response;
        }
    };
    request.open("POST", "/shorten");
    request.setRequestHeader("Content-Type", "text/plain");
    request.send(longURL);
};
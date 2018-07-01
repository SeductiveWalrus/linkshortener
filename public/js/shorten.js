// Query elements
const NAME_INPUT = document.getElementById("nameinput");
const URL_INPUT = document.getElementById("urlinput");
const SUBMIT_BUTTON = document.getElementById("submitbutton")
const MODAL = {
    modal:document.getElementById("modal"),
    title:document.getElementById("modaltitle"),
    body:document.getElementById("modalbody"),
    footer:document.getElementById("modalfooter"),
    setVisible: (vis = false) =>{
        if(vis === true){
            MODAL.modal.style.display = "flex";
        }else if(vis === false){
            MODAL.modal.style.display = "none";
        }
    }
};
MODAL.modal.style.display = "none";

// Event handlers

document.body.onkeyup = e =>{
    // Enter key presses submit button
    e.preventDefault();
    if(e.keyCode === 13) SUBMIT_BUTTON.click();
};

SUBMIT_BUTTON.onclick = e =>{
    e.preventDefault();
    SUBMIT_BUTTON.className = "btn btn-info";
    SUBMIT_BUTTON.innerHTML = "Processing...";
    SUBMIT_BUTTON.disabled = true;
    let longUrl = URL_INPUT.value; 
    let name = NAME_INPUT.value;
    shortenUrl(name, longUrl);
    setTimeout(() =>{
        SUBMIT_BUTTON.className = "btn btn-primary";
        SUBMIT_BUTTON.innerHTML = "Submit URL";
        SUBMIT_BUTTON.disabled = false;
        NAME_INPUT.value = "";
        URL_INPUT.value = "";
    }, 300)
};

// Abstractions

function shortenUrl(linkName, url){
    let request = new XMLHttpRequest();
    request.onreadystatechange = () =>{
        if(request.readyState == 4) processResponse(request);
    }
    request.open("POST", "/shorten");
    request.setRequestHeader("Content-Type", "application/json")
    request.send(JSON.stringify({
        name:linkName,
        url:url 
    }));
}

function processResponse(request){
    switch(request.status){
        case 200:
        MODAL.title.innerHTML = "Success!";
        MODAL.body.innerHTML = "Congratulations on your shiny new link. Here it is: <span id='url'>" + request.response + "</span>";
        MODAL.footer.innerHTML = '<button type="button" class="btn btn-primary" id="copyurlbutton">Copy</button><button type="button" class="btn btn-secondary" id="modalclosebutton">Close</button>'
        break;

        case 403:
        MODAL.title.innerHTML = "403: Forbidden";
        MODAL.body.innerHTML = "Whatever you just tried to do, you don't have access. Perhaps you're banned. Here's the server response: " + request.response;
        MODAL.footer.innerHTML = '<button type="button" class="btn btn-primary" id="modalclosebutton">Ok</button>'
        break;

        case 409:
        MODAL.title.innerHTML = "409: Conflict";
        MODAL.body.innerHTML = "Something you did created server-side conflict. You might have a typo. Here's the response: " + request.response;
        MODAL.footer.innerHTML = '<button type="button" class="btn btn-primary" id="modalclosebutton">Ok</button>'
        break;

        default:
        MODAL.title.innerHTML = "Uh oh!";
        MODAL.body.innerHTML = "We ran into an unknown issue. Please report this response to SeductiveWalrus: " + request.response;
        MODAL.footer.innerHTML = '<button type="button" class="btn btn-primary" id="modalclosebutton">Ok</button>'
    }
    refreshConditionalHandlers();
    MODAL.setVisible(true);
}

function refreshConditionalHandlers(){
    if(document.getElementById("modalclosebutton")){
        document.getElementById("modalclosebutton").onclick = e =>{
            MODAL.setVisible(false);
        };
    }

    if(document.getElementById("copyurlbutton")){
        MODAL.copyUrlButton = document.getElementById("copyurlbutton");
        MODAL.copyUrlButton.onclick = e =>{
            let textarea = document.createElement("textarea");
            textarea.id = "temp_element";
            textarea.style.height = 0;
            document.body.appendChild(textarea);
            textarea.value = document.getElementById("url").innerHTML;
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);   
            MODAL.copyUrlButton.innerHTML = "Copied";
            MODAL.copyUrlButton.disabled = "true";
        };
    }
}
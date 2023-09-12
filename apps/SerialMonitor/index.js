const socket = io();

updateTimeStamps();

lineEnding = {
    "0": "",
    "1": "\n",
    "2": "\r",
    "3": "\r\n",
}

socket.on('serial::recive', (data, timestamp) => {
    var terminal = document.getElementById('terminal');
    var newLine = document.createElement("li");
    newLine.style = "font-family: monospace;"
    newLine.innerHTML = `<div class="timestamp" style="color: lightslategray; float: left;" hidden>${timestamp}${" ".repeat((12-timestamp.length))} -> </div>`;
    
    var newdata = document.createElement("div");
    newdata.textContent = data;
    newLine.appendChild(newdata);
    terminal.appendChild(newLine);

    if (document.getElementById("autoscroll").checked) {
        terminal.scrollTop = terminal.scrollHeight;
    }

    updateTimeStamps();
});

function updateTimeStamps() {
    document.querySelectorAll('.timestamp').forEach(function(item) {
        item.hidden = !document.getElementById("timestamps").checked;
    })
}

function sendData() {
    var data = document.getElementById('commandBox');
    socket.emit('serial::send', data.value+lineEnding[document.getElementById('lineEnding').value]);
    data.value = "";
}

function clearterm() {
    document.getElementById('terminal').innerHTML = "";
}

function resetterm() {
    socket.emit('serial::reset');
}

var input = document.getElementById("commandBox");
            
input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("sendButton").click();
    }
}); 
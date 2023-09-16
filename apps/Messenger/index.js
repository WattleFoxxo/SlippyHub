const socket = io();

var contacts = {};
var localAddress = "0.0.0.0";
var proxy = "/api/proxy?url=";

const renderer = new marked.Renderer();
renderer.html = (html) => html;

renderer.link = (href, title, text) => {
    const contentType = getContentTpeFromUrl(proxy+href); // TODO: fix the big slow :(

    var response = `<a href="${href}" title="${title}">${text}</a>`;
    if (contentType.includes('image')) {
        response += `\n<br>\n<img src="${href}" alt="${text}" title="${title}" style="margin-top: 10px;"/>`;
    } else if (contentType.includes('video')) {
        response += `\n<br>\n<video controls width="300px" style="margin-top: 10px;"><source src="${href}" type="${contentType}"></video>`;
    }

    return response;
}

marked.use({renderer});

socket.on('slippy::info', (object) => {
    localAddress = object.address;
});

socket.on('slippy::recive', (address, data, global) => {
    
    from = address;
    if (Object.keys(contacts).find(key => contacts[key] === sourceAddress) != undefined) {
        from = `${Object.keys(contacts).find(key => contacts[key] === sourceAddress)} (${sourceAddress})`;
    }
    
    prefix = "";
    prefix = `direct message from ${from}`;

    // if (address == localAddress) {
    // } else {
    //     prefix = `global message from ${from}`;
    // }

    addMessage(prefix, data);
});

function addMessage(prefix, msg) {
    var messageBox = document.getElementById('MessageBox');
    var messageItem = document.createElement("li");

    messageItem.classList = ["MessageItem"];
    const purify = DOMPurify(window);

    var time = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    var tag = `<p style="color: lightslategray;">${prefix} at ${time}</p>`
    messageItem.innerHTML = purify.sanitize(`<p style="color: lightslategray; margin: 0px;">${tag}</p><div class="MessageBox_MD">${marked.parse(msg)}</div><div class="MessageBox_RAW"><p>${msg}</p></div>`);
    messageBox.appendChild(messageItem);
    messageBox.scrollTop = messageBox.scrollHeight;
    updateMsg();
}

function sendMessage() {
    var addr = document.getElementById('Address');
    var msgBox = document.getElementById('Message');
    var msg = msgBox.value;

    // var addrRegx = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

    if (parseInt(addr.value) < 1 || parseInt(addr.value) > 255) { // !addrRegx.test(addr.value)
        console.log("invalid address");
        return;
    }

    if (addr.value == localAddress) {
        console.log("invalid address");
        return;
    }

    if (msg.length < 1 || msg.length > 200) {
        console.log("invalid message lenght");
        return;
    }

    socket.emit('slippy::send', addr.value, msg);

    to = addr.value;
    if (Object.keys(contacts).find(key => contacts[key] === addr.value) != undefined) {
        to = `${Object.keys(contacts).find(key => contacts[key] === addr.value)} (${addr.value})`;
    }

    prefix = "";
    if (addr.value == "255") {
        prefix = `global message to Everyone (255)`;
    } else {
        prefix = `direct message to ${to}`;
    }
    
    msgBox.value = "";

    addMessage(prefix, msg);
}

function updateMsg() {
    var messageMode = document.getElementById('MessageMode').value;

    if (messageMode == "raw") {
        document.querySelectorAll('.MessageBox_MD').forEach(function(item) {
            item.hidden = true;
        });

        document.querySelectorAll('.MessageBox_RAW').forEach(function(item) {
            item.hidden = false;
        });
    } else {
        document.querySelectorAll('.MessageBox_RAW').forEach(function(item) {
            item.hidden = true;
        });

        document.querySelectorAll('.MessageBox_MD').forEach(function(item) {
            item.hidden = false;
        });
    }
    
}


function selectContact() {
    var dropdown = document.getElementById("AddressDropdown");
    var addr = document.getElementById('Address');
    addr.value = dropdown.value;
    dropdown.value = "";
}

function loadSettings() {
    try {
        contacts = JSON.parse(Cookies.get('Contacts'));
    } catch {}

    var dropdown = document.getElementById("AddressDropdown");
    dropdown.innerHTML = `
    <option value="" disabled selected>Saved Contacts</option>
    <option value="255.255.255.255">Broadcast (255.255.255.255)</option>`

    var contactsTextarea = document.getElementById("ContactsTextarea");
    contactsTextarea.value = JSON.stringify(contacts).replaceAll(",", ",\n").replaceAll("{", "").replaceAll("}", "");

    Object.keys(contacts).forEach(function(name) {
        var option = document.createElement("option");
        option.text = `${name} (${contacts[name]})`;
        option.value = contacts[name];
        dropdown.add(option, -1);
    })
}

function editContacts() {
    var contactsTextarea = document.getElementById("ContactsTextarea");
    json = JSON.parse(`{\n${contactsTextarea.value}\n}`);
    Cookies.set('Contacts', JSON.stringify(json));
    loadSettings();
}

function cls() {
    document.getElementById('MessageBox').innerHTML = "";
}

var input = document.getElementById("Message");
            
input.addEventListener("keypress", function(event) {
    if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        const cursorPosition = input.selectionStart;
        const currentValue = input.value;
        const newValue =
            currentValue.substring(0, cursorPosition) +
            '\n' +
            currentValue.substring(input.selectionEnd);

            input.value = newValue;
            input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
    } else if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("Send").click();
    }
}); 

function getContentTpeFromUrl(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('HEAD', url, false);
    xhr.send();
  
    if (xhr.status === 200) {
        const contentType = xhr.getResponseHeader('content-type');
        return contentType;
    } else {
        console.error('Error:', xhr.status, xhr.statusText);
        return null;
    }
}
  
loadSettings();

const socket = io();

var contacts = {};
var localAddress = "0.0.0.0";

const renderer = new marked.Renderer();
renderer.html = (html) => html;

renderer.image = (href, title, text) => {
    if (href.endsWith('.mp4')) {
        return `<video controls><source src="${href}" type="video/mp4"></video>`;
    } else {
        return `<img src="${href}" alt="${text}" title="${title}" />`;
    }
};

marked.use({renderer})

socket.on('slippyInfo', (localAddr) => {
    localAddress = localAddr;
});

// Example: 111.0.20.6,55.16.16.21,22341,1,AT+PING,-111,-5.7500000000
socket.on('slippyRecive', (sourceAddress, destinationAddress, packetId, packetHops, data, rssi, snr) => {
    addMessage(sourceAddress, destinationAddress, data);
});

function addMessage(source, dest, msg) {
    var messageBox = document.getElementById('MessageBox');
    var messageItem = document.createElement("li");

    messageItem.classList = ["MessageItem"];
    var start = "";
    if (dest == localAddress) {
        start = "Direct message ";
    } else if (dest == "255.255.255.255") {
        start = "Message ";
    }

    const purify = DOMPurify(window);

    var time = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    var tag = `<p style="color: lightslategray;">${start}from ${source} at ${time}</p>`
    messageItem.innerHTML = purify.sanitize(`<p style="color: lightslategray; margin: 0px;">${tag}</p><div class="MessageBox_MD">${marked.parse(msg)}</div><div class="MessageBox_RAW"><p>${msg}</p></div>`);
    messageBox.appendChild(messageItem);
    messageBox.scrollTop = messageBox.scrollHeight;
    updateMsg();
}

function sendMessage() {
    var addr = document.getElementById('Address');
    var msg = document.getElementById('Message');
    var addrRegx = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

    if (!addrRegx.test(addr.value)) {
        console.log("invalid address");
        return;
    }

    if (msg.value.length < 1 || msg.value.length > 127) {
        console.log("invalid message lenght");
        return;
    }

    socket.emit('slippySend', addr.value, msg.value);
    addMessage(localAddress, addr.value, msg.value);
    msg.value = "";
}

function updateMsg() {
    var messageMode = document.getElementById('MessageMode').value;
    console.log(messageMode);
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
    // Cookies.set('Contacts', JSON.stringify({
    //     "AlexD": "192.168.0.512",
    //     "Woobi3": "48.8.7.32"
    // }), { path: "" });

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

loadSettings();
// 

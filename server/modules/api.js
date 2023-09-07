module.exports = function(config, app, io, port, parser) {
    /* api.js */
    var serialMonitorHistory = []
    var localAddress = "0.0.0.0"

    parser.on('data', (data) => {
        data;
        var currentTime = new Date();
        var timestamp = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}.${currentTime.getMilliseconds()}`
        io.emit('serialRecive', data, timestamp);
        var command = data.split("=");
        if (command[0] == "AT+MESSAGE") { // Example message: 111.0.20.6,55.16.16.21,22341,1,AT+PING,-111,-5.7500000000
            var param = command[1].split(",");
            io.emit('slippyRecive', param[0], param[1], param[2], param[3], param[4], timestamp);
        }

        if (data.startsWith("Ready, Your address is: ")) {
            localAddress = data.split("Ready, Your address is: ")[1];
        }
    });

    io.on('connection', (socket) => {
        socket.on('serialSend', (data) => {
            port.write(data);
        });

        socket.on('serialReset', () => {
            port.close();
            port.open();
        });
    
        socket.on('slippySend', (address, data) => {
            var addr = address.split(".");
            port.write(`AT+SEND=${addr[0]},${addr[1]},${addr[2]},${addr[3]},${data}\r\n`);
        });

        io.emit('slippyInfo', localAddress);
    });

    setTimeout(function() {
        port.close();
        port.open();
    }, 1000);
};
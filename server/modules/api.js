module.exports = function(config, app, io, port, parser) {
    /* api.js */
    var serialMonitorHistory = []
    var localAddress = "0.0.0.0"

    parser.on('data', (data) => {
        data;
        var currentTime = new Date();
        var timestamp = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}.${currentTime.getMilliseconds()}`
        io.emit('serialRecive', data, timestamp);

        if (data.startsWith("AT+MESSAGE=")) { // Example message: 111.0.20.6,55.16.16.21,22341,1,YWxleGQgbW9tZW50ICg2Myk=,-111,-5.7500000000
            var param = data.replace("AT+MESSAGE=", "").split(",");
            io.emit('slippyRecive', param[0], param[1], param[2], param[3], atob(param[4]), timestamp);
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
            setTimeout(function() {
                port.open();
            }, 1000);
        });
    
        socket.on('slippySend', (address, data) => {
            var addr = address.split(".");
            port.write(`AT+SENDBASE64=${addr[0]},${addr[1]},${addr[2]},${addr[3]},${btoa(data)}\r\n`);
        });

        io.emit('slippyInfo', localAddress);
    });

    setTimeout(function() {
        port.close();
        setTimeout(function() {
            port.open();
        }, 1000);
    }, 1000);
};

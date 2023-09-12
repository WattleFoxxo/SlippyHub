module.exports = function(config, app, io, port, parser, log4js) {
    /* api.js */

    var serialLogger = log4js.getLogger("serial");
    var slippyLogger = log4js.getLogger("slippy");

    var deviceInfo = {
        "address":"0.0.0.0",
        "temperature":"0",
        "uptime":"0"
    }

    parser.on('data', (data) => {
        data;
        var currentTime = new Date();
        var timestamp = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}.${currentTime.getMilliseconds()}`
        io.emit('serial::recive', data, timestamp);
        serialLogger.info(`[IN] ${data}`);

        if (data.startsWith("AT+MESSAGE=")) { // Example message: 111.0.20.6,55.16.16.21,22341,1,YWxleGQgbW9tZW50ICg2Myk=,-111,-5.7500000000
            slippyLogger.info(`[RECIVE] ${param[0]}, ${param[1]}, ${param[2]}, ${param[3]}, ${atob(param[4])}`);
            var param = data.replace("AT+MESSAGE=", "").split(",");
            io.emit('slippy::recive', param[0], param[1], param[2], param[3], atob(param[4]), timestamp);
        }

        if (data.startsWith("AT+INFO=")) {
            var param = data.replace("AT+INFO=", "").split(",");
            deviceInfo.address = param[0];
            deviceInfo.temperature = param[1];
            deviceInfo.uptime = param[2];
        }
    });

    io.on('connection', (socket) => {
        /* SERIAL */
        socket.on('serial::send', (data) => {
            serialLogger.info(`[OUT] ${data}`);
            port.write(data);
        });

        socket.on('serial::reset', () => {
            port.close();
            serialLogger.info("[RESETTING SERIAL]");
            setTimeout(function() {
                port.open();
            }, 1000);
        });
    
        /* SLIPPY */
        socket.on('slippy::send', (address, data) => {
            var addr = address.split(".");
            slippyLogger.info(`[SEND] ${address}, ${data}`);
            port.write(`AT+SENDBASE64=${addr[0]},${addr[1]},${addr[2]},${addr[3]},${btoa(data)}\r\n`);
        });

        socket.on('slippy::info', (callback) => {
            port.write("AT+INFO\r\n");
            setTimeout(function() {
                slippyLogger.info(`[GET INFO] ${deviceInfo}`);
                callback(deviceInfo);
            }, 1000);
        });
    });

    setTimeout(function() {
        port.close();
        setTimeout(function() {
            port.open();
        }, 1000);
    }, 1000);
};

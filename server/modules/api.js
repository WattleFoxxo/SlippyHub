module.exports = function(config, app, io, port, parser, log4js) {
    /* api.js */

    var serialLogger = log4js.getLogger("serial");
    var slippyLogger = log4js.getLogger("slippy");

    var deviceInfo = {
        "address":0,
        "network_version":0,
        "uptime":0
    }

    parser.on('data', (data) => {
        data;
        var currentTime = new Date();
        var timestamp = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}.${currentTime.getMilliseconds()}`
        io.emit('serial::recive', data, timestamp);
        serialLogger.info(`[serial::in] ${data}`);

        /* Example message: 
            -- Message --
            Address: 140
            Data: hello world
            JSON: "message":{"address":140,"data":"aGVsbG8gd29ybGQ="}
            -------------
        */

        if (data.startsWith("JSON: \"message\":")) {
            var jsonObject = JSON.parse(data.replace("JSON: \"message\":", ""))

            slippyLogger.info(`[slippy::in] ${JSON.stringify(jsonObject)}`);
            io.emit('slippy::recive', jsonObject.address, atob(jsonObject.data), timestamp, false);
        }

        if (data.startsWith("JSON: \"broadcast_message\":")) {
            var jsonObject = JSON.parse(data.replace("JSON: \"broadcast_message\":", ""))

            slippyLogger.info(`[slippy::in] ${JSON.stringify(jsonObject)}`);
            io.emit('slippy::recive', jsonObject.address, atob(jsonObject.data), timestamp, true);
        }

        /* Example info: 
            -- Info --
            Address: 69
            Device Version: 18
            Uptime: 20688
            JSON: "info":{"address":105,"network_version":1,"uptime":20692}
            ----------
        */

        if (data.startsWith("JSON: \"info\":")) {
            deviceInfo = JSON.parse(data.replace("JSON: \"info\":", ""));
        }
    });

    io.on('connection', (socket) => {
        /* SERIAL */
        socket.on('serial::send', (data) => {
            serialLogger.info(`[serial::out] ${data}`);
            port.write(data);
        });

        socket.on('serial::reset', () => {
            port.close();
            serialLogger.info("[serial::reset]");
            setTimeout(function() {
                port.open();
            }, 1000);
        });
    
        /* SLIPPY */
        socket.on('slippy::send', (address, data) => {
            var addr = address.split(".");
            slippyLogger.info(`[slippy::out] ${address}, ${data}`);
            port.write(`send64 ${address} ${btoa(data)}\n`);
        });

        socket.on('slippy::info', (callback) => {
            port.write("info\n");
            setTimeout(function() {
                slippyLogger.info(`[slippy::info] ${deviceInfo}`);
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

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const multer  = require('multer')
const bodyParser = require('body-parser');
// const log4js = require("log4js");
const axios = require('axios');

const config = require('./config.json');

require('mkdirp').sync('server/logs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = new SerialPort({
    path: config.device.serial_port,
    baudRate: config.device.serial_buad
});

const parser = port.pipe(new ReadlineParser({
    delimiter: '\n'
}));

// log4js.configure({
//     appenders: {
//         serial: { type: "file", filename: "server/logs/serial.log" },
//         slippy: { type: "file", filename: "server/logs/slippy.log" }
//     },
//     categories: { default: { appenders: ["serial", "slippy"], level: "trace" } },
// });

const api = require("./server/modules/api")(config, app, io, port, parser);

app.use(express.static('server/public'));
app.use("/apps", express.static('apps'));
app.use("/apps", express.static('server/apps'));

/* Apps service */

app.get('/api/installedapps', (req, res) => {
    var appList = {}
    fs.readdir("./apps/", (err, files) => {
        files.forEach(file => {
            try {
                appList[file] = JSON.parse(fs.readFileSync(path.join(__dirname, `./apps/${file}/app.json`), 'utf8'))
            } catch {
                console.error(`Error while loading apps. The app "${file}" is corrupt or broken!`)
            }
        });
        res.send(appList);
    });
})

/* Remote flash service */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'server/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, "firmware.hex");
    },
});
const upload = multer({ storage });

app.use(bodyParser.urlencoded({ extended: false }));
app.post('/api/uploadfirmware', upload.single('file'), (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.write('Flashing firmware...');

    var board = req.body.board;

    port.close();
    var process = childProcess.fork("./server/modules/flash.js", [req.body.board, config.device.serial_port]);

    process.on('exit', function (code) {
        port.open();
        if (code === 0) {
            res.write('Firmware flashed successfully!');
        } else {
            res.write('Firmware flashing failed!');
        }
        res.end();
    })
    
});

/* Proxy service */

app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    try {
        const response = await axios.get(targetUrl, { responseType: 'stream' });
        res.set('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

server.listen(config.webserver.port, () => {
    console.log(`listening on *:${config.webserver.port}`);
});

const express = require('express')
const config = require ('config')
const app = express()
const server = require('http').createServer(app)
const PORT = config.get('port')
app.use('/', require('./routes/routes'))

const {SerialPort} =  require("serialport")
const {UBXParser} = require('ubx-parser')
const parser = new UBXParser();
const port = new SerialPort({
    path: 'COM3',
    baudRate: 115200
})

async function start() {
    try {
        server.listen(PORT, () => console.log(`Server has been started on port ${PORT}...`))
        port.on("data", (buffer) => parser.parse(buffer));
        parser.on("data", (data) => console.log(data));
    } catch (e) {
        console.log('Server error ', e.message);
        process.exit(1);
    }
}
start();


// const serialport =  require("serialport")
// //import { SerialPort } from "serialport";
// //import { UBXParser } from "ubx-parser";
// serialport.SerialPort({ path: "/dev/ttyS1", baudRate: 115200 }, () => console.log("port opened"));
// const parser = new UBXParser();
//
// serialport.on("data", (buffer) => parser.parse(buffer));
// parser.on("data", (data) => console.log(data));
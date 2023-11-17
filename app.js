const express = require('express')
const config = require ('config')
const app = express()
const server = require('http').createServer(app)
const PORT = config.get('port')
app.use('/', require('./routes/routes'))

const {SerialPort} =  require("serialport")
const {UBXParser} = require('ubx-parser')
const parser = new UBXParser();

async function start() {
    try {
        const port = new SerialPort({
            path: config.get('serialPort'),
            baudRate: config.get('baudRate')
        })
        server.listen(PORT, () => console.log(`Server has been started on port ${PORT}...`))
        port.on("data", (buffer) => parser.parse(buffer));
        parser.on("data", (data) => {
            app.get('/', function (req,res){
                res.send("<html lang=\"en\"><body>"+data+"</body></html>");
            });
            console.log(data)
        })
    } catch (e) {
        console.log('Server error ', e.message);
        process.exit(1);
    }
}
start();

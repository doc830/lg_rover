const {Router} = require('express')
const {SerialPort} = require("serialport")
const  {ReadlineParser} = require('@serialport/parser-readline')
const router = Router()
let serialPort
router.get('/info', async (req, res) => {
    let port = "/dev/ttyUSB1"
    let timeout
    if (!checkPort()) {
        serialPort = new SerialPort({
            path: port,
            dataBits: 7,
            baudRate: 9600,
            stopBits: 1,
            parity: "even"
        })
    } else {
        res.json({
            "err": "001",
            "info": "COM port is unavailable"
        })
        res.end()
    }
    serialPort.on('open', ()=>{
        timeout = setTimeout(()=>{
            res.json({
                "err": "001",
                "info": "Visibility is unavailable"
            })
            serialPort.close()
            res.end()
        }, 5000)
    })
    let parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }))
    parser.on('data', async (data)=>{
        clearTimeout(timeout)
        let currentDate = new Date();
        let hours = currentDate.getHours();
        let minutes = currentDate.getMinutes();
        let seconds = currentDate.getSeconds();
        let formattedTime = `${hours}:${minutes}:${seconds}`
        data = data.split(' ')
        res.json({
            "err": "000",
            "visibility": data[5],
            "time": formattedTime
        })
        serialPort.close()
        res.end()
    })
    serialPort.on('error', (err) => {
        console.log(err)
        res.json({
            "err": "001",
            "info": "COM port is unavailable"
        })
        res.end()
    })
})

function checkPort() {
    if (serialPort) {
        return serialPort.isOpen
    }
}
module.exports = router
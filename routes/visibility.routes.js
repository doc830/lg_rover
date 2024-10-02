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
        res.json("Visibility is unavailable")
        res.end()
    }
    serialPort.on('open', ()=>{
        timeout = setTimeout(()=>{
            res.json("Visibility is unavailable")
            serialPort.close()
            res.end()
        }, 3000)
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
            "visibility": data[5],
            "time": formattedTime
        })
        serialPort.close()
        res.end()
    })
    serialPort.on('error', (err) => {
        console.log(err)
        res.status(500)
        res.end()
    })
})

function checkPort() {
    if (serialPort) {
        return serialPort.isOpen
    }
}
module.exports = router
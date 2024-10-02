const {Router} = require('express')
const {SerialPort} = require("serialport");
const router = Router()
router.get('/devices', (req, res) => {
    res.json({
        "answer": "ok"
    })
    res.end()
})
router.get('/raw_command', (req, res) => {
    let command
    command = req.query.c
    let port = "/dev/ttyS1"
    let received = Buffer.alloc(0)
    let serialPort = new SerialPort({
        path: port,
        dataBits: 8,
        baudRate: 115200,
        stopBits: 1,
        parity: "even"
    })
    serialPort.write(Buffer.from(command.toString(), 'hex'))
    let timeout = setTimeout(()=>{
        res.json("COM port is unavailable")
        serialPort.close()
        res.end()
    }, 1000)
    serialPort.on('data', (data)=> {
        clearTimeout(timeout)
        received = Buffer.concat([received,  Buffer.from(data, 'hex')])
        res.json({
            "COM message": received,
        })
        serialPort.close()
        res.end()
    })
    serialPort.on('error', (err) => {
        res.json(err)
        res.end()
    })
})
router.get('/battery', (req, res) => {
    let port = "/dev/ttyS1"
    let received = Buffer.alloc(0)
    let serialPort = new SerialPort({
        path: port,
        dataBits: 8,
        baudRate: 115200,
        stopBits: 1,
        parity: "even"
    })
    serialPort.write(Buffer.from('A60100', 'hex'))
    serialPort.on('data', (data)=> {
        received = Buffer.concat([received,  Buffer.from(data, 'hex')])
        let header = Buffer.from([received[0]]).readUInt8(0)
        let charge = Buffer.from([received[1]]).readUInt8(0)
        let param = Buffer.from([received[2]]).readUInt8(0)
        res.json({
            "header": header,
            "charge": charge,
            "param ": param
        })
        serialPort.close()
        res.end()
    })
    serialPort.on('error', (err) => {
        res.json(err)
        res.end()
    })
})

module.exports = router
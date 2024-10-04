const {Router} = require('express')
const {SerialPort} = require("serialport")
const router = Router()
const devices = require('../middleware/devices')
const {ReadlineParser} = require("@serialport/parser-readline");
const axios = require("axios");
const config = require("config");
router.get('/weather_on',  async (req, res) => {
    await devices.setWeather(true).then(()=>{
        res.json ({
            "err": "000",
            "info": "Погодная станция подключена!"
        })
        res.end()
    }).catch(err => {
        res.json ({
            "err": "001",
            "info": err.message
        })
        res.end()
    })
})
router.get('/weather_off', async (req, res) => {
    await devices.setWeather(false).then(()=>{
        res.json ({
            "err": "000",
            "info": "Погодная станция отключена!"
        })
        res.end()
    }).catch(err => {
        res.json ({
            "err": "001",
            "info": err.message
        })
        res.end()
    })
})
router.get('/visibility_on', async (req, res) => {
    await devices.setVisibility(true).then(()=>{
        res.json ({
            "err": "000",
            "info": "ДМДВ подключен!"
        })
        res.end()
    }).catch(err => {
        res.json ({
            "err": "001",
            "info": err.message
        })
        res.end()
        return
    })
    let parser = devices.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }))
    parser.on('data', async (data)=>{
        console.log(data)
        let currentDate = new Date();
        let hours = currentDate.getHours();
        let minutes = currentDate.getMinutes();
        let seconds = currentDate.getSeconds();
        let formattedTime = `${hours}:${minutes}:${seconds}`
        data = data.split(' ')
        await axios.post(config.get('gw') + "/api/rover/visibility", {
            "visibility": data[5],
            "time": formattedTime
        }).then(() => {}).catch(() => {
            console.error('Visibility POST request error:')
        })
    })
})
router.get('/visibility_off', async (req, res) => {
    await devices.setVisibility(false).then(()=>{
        res.json ({
            "err": "000",
            "info": "ДМДВ отключен!"
        })
        res.end()
    }).catch(err => {
        res.json ({
            "err": "001",
            "info": err.message
        })
        res.end()
    })
})
router.get('/battery', async (req, res) => {
    let received = Buffer.alloc(0)
    await devices.openPort({
            path: "/dev/ttyS1",
            dataBits: 8,
            baudRate: 115200,
            stopBits: 1,
            parity: "even"
    },2).then(async ()=>{
        await devices.sendMessage(Buffer.from('A60100', 'hex'), devices.serialPort2)
    }).catch(err => {
        res.json({
            "err": "001",
            "info": err.message
        })
        res.end()
    })
    devices.serialPort2.on('data', (data)=> {
        received = Buffer.concat([received,  Buffer.from(data, 'hex')])
        let header = Buffer.from([received[0]]).readUInt8(0)
        let charge = Buffer.from([received[1]]).readUInt8(0)
        let param = Buffer.from([received[2]]).readUInt8(0)
        res.json({
            "header": header,
            "charge": charge,
            "param ": param
        })
        devices.serialPort2.close()
        res.end()
    })
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
        res.json("COM port message error")
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
module.exports = router
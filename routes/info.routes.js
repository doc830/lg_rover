const {Router} = require('express')
const router = Router()
const devices = require('../middleware/devices')
const {ReadlineParser} = require("@serialport/parser-readline")
const axios = require("axios")
const config = require("config")
let v_data = {}
router.get('/weather_on',   (req, res) => {
     devices.setWeather(true).then(()=>{
        res.json ({
            "err": "000",
            "info": "Погодная станция подключена!"
        })
    }).catch(err => {
        res.json ({
            "err": "001",
            "info": err.message
        })
    })
})
router.get('/weather_off',  (req, res) => {
     devices.setWeather(false).then(()=>{
        res.json ({
            "err": "000",
            "info": "Погодная станция отключена!"
        })
    }).catch(err => {
        res.json ({
            "err": "001",
            "info": err.message
        })
    })
})
router.get('/visibility_on',  (req, res) => {
     devices.setVisibility(true).then(()=>{
        res.json ({
            "err": "000",
            "info": "ДМДВ подключен!"
        })
    }).catch(err => {
        res.json ({
            "err": "001",
            "info": err.message
        })
    })
    let parser = devices.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }))
    parser.on('data',  (data)=>{

        let currentDate = new Date();
        let hours = currentDate.getHours();
        let minutes = currentDate.getMinutes();
        let seconds = currentDate.getSeconds();
        let formattedTime = `${hours}:${minutes}:${seconds}`
        //data = data.split(' ')

        v_data = {
            "type": "visibility",
            "metric": data,
            "time": formattedTime
        }
        axios.post(config.get('gw') + "/api/rover/visibility", {
            "type": "visibility",
            "meters": data[4],
            "time": formattedTime
        }).then(() => {}).catch(() => {
            console.error('Visibility POST request error:')
        })
    })
})
router.get('/visibility', (req,res)=> {
    if (devices.visibility) {
        res.json(v_data)
    } else {
        res.json ({
            "err": "001",
            "info": "ДМДВ отключен!"
        })
    }
})
router.get('/visibility_off',  (req, res) => {
     devices.setVisibility(false).then(()=>{
        res.json ({
            "err": "00",
            "info": "ДМДВ отключен!"
        })
    }).catch(err => {
        res.json ({
            "err": "001",
            "info": err.message
        })
    })
})
router.get('/battery',  (req, res) => {
    let received = Buffer.alloc(0)
     devices.openPort({
            path: "/dev/ttyS1",
            dataBits: 8,
            baudRate: 115200,
            stopBits: 1,
            parity: "even"
    },2).then(()=>{
        devices.sendMessage(Buffer.from('A60100', 'hex'), devices.serialPort2).then(() => {
            devices.serialPort2.on('data', (data)=>{
                received = Buffer.concat([received, data])
                if (received.length === 3) {
                    received = {
                        "header": received.readUInt8(0),
                        "code": received.readUInt8(1),
                        "charge": ((received.readUInt8(2) & 0x7F)*42.519+9000)/1000
                    }
                    devices.closePort(2).then(()=>{
                        res.json(received)
                    }).catch(err => {
                        res.json({
                            "err": "001",
                            "info": err.message
                        })
                    })
                }
            })
        }).catch(err => {
            devices.serialPort2(2)
            res.json({
                "err": "001",
                "info": err.message
            })
        })
    }).catch(err => {
        res.json({
            "err": "001",
            "info": err.message
        })
    })
})
module.exports = router
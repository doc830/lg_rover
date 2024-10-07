const {Router} = require('express')
const devices = require("../middleware/devices")
const router = Router()
router.get('/data',  (req, res) => {
    let received = Buffer.alloc(0)
    if (!devices.weather) {
        res.json({
            "err": "001",
            "info": "Погодная станция не подключена"
        })
    } else {
        devices.sendMessage(Buffer.from('010300000031841E', 'hex'), devices.serialPort).then(()=>{
            devices.serialPort.on('data', (data)=> {
                received = Buffer.concat([received,  Buffer.from(data, 'hex')])
                if (received.length ===  103) {
                    console.log(received)
                    let wind_direction = received.readUInt16BE(5)
                    let wind_speed = received.readFloatBE(7)
                    let temperature = received.readFloatBE(11)
                    let humidity = received.readFloatBE(15)
                    let pressure = received.readFloatBE(19)
                    devices.serialPort.removeAllListeners()
                    res.json({
                        'wind_direction': wind_direction,
                        'wind_speed': wind_speed,
                        'temperature': temperature,
                        'humidity': humidity,
                        'pressure': pressure
                    })
                }
            })
        }).catch((err)=>{
            res.json({
                "err": "001",
                "info": err.message
            })
        })
    }
})
module.exports = router
const {Router} = require('express')
const devices = require("../middleware/devices")
const router = Router()
router.get('/data',  (req, res) => {
    if (!devices.weather) {
        res.json({
            "err": "001",
            "info": "Погодная станция не подключена"
        })
    } else {
        let received = Buffer.alloc(0)
        devices.sendMessage(Buffer.from('010300000031841E', 'hex'), devices.serialPort).then(()=>{
            devices.serialPort.on('data', (data)=> {
                received = Buffer.concat([received,  Buffer.from(data, 'hex')])
                if (received.length ===  103) {
                    console.log(received)
                    let wind_direction = Buffer.from([received[5],received[6]])
                    wind_direction = wind_direction.readUInt16BE(0)
                    let wind_speed = Buffer.from([received[9],received[10],received[7],received[8]])
                    wind_speed = wind_speed.readFloatBE(0)
                    let temperature = Buffer.from([received[13],received[14],received[11],received[12]])
                    temperature = temperature.readFloatBE(0)
                    let humidity = Buffer.from([received[17],received[18],received[15],received[16]])
                    humidity = humidity.readFloatBE(0)
                    let pressure = Buffer.from([received[21],received[22],received[19],received[20]])
                    pressure = pressure.readFloatBE(0)
                    devices.serialPort.removeAllListeners()
                    res.json({
                        'wind_direction': wind_direction,
                        'wind_speed': wind_speed,
                        'temperature': temperature,
                        'humidity': humidity,
                        'pressure': pressure
                    })
                    res.end()
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
const {Router} = require('express')
const {SerialPort} = require("serialport")
const router = Router()
let serialPortWeather
router.get('/info', async (req, res) => {
    if (!checkPort()) {
        res.status(200)
        serialPortWeather = new SerialPort({
            path: '/dev/ttyUSB1',
            dataBits: 8,
            baudRate: 9600,
            stopBits: 1,
            parity: "even"
        })
        serialPortWeather.write(Buffer.from('010300000031841E', 'hex'))
    } else {
        serialPortWeather.write(Buffer.from('010300000031841E', 'hex'))
    }
    serialPortWeather.on('error', (err) => {
        console.log(err)
        res.status(500)
    })
    serialPortWeather.on('data', async (data)=> {
        let received = Buffer.alloc(0)
        received = Buffer.concat([received,  Buffer.from(data, 'hex')])
        if (received.length ===  103) {
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
})
function checkPort() {
    if (serialPortWeather) {
        return serialPortWeather.isOpen
    }
}
module.exports = router

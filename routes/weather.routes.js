const {Router} = require('express')
const {SerialPort} = require("serialport")
const router = Router()
let serialPort
let test = false
router.get('/info', async (req, res) => {
    if (test) {
        await res.json({
            'wind_direction': '170',
            'wind_speed': '0.4622483551502228',
            'temperature': '23.620328903198242',
            'humidity': '35.122711181640625',
            'pressure': '1013.4943237304688'
        })
        res.end()
        return
    }
    let port = "/dev/ttyUSB1"
    let received = Buffer.alloc(0)
    if (!checkPort()) {
        serialPort = new SerialPort({
            path: port,
            dataBits: 8,
            baudRate: 9600,
            stopBits: 1,
            parity: "even",
            rtscts: true
        })
        port.set({
            rts: true
        })
        serialPort.write(Buffer.from('010300000031841E', 'hex'))
        port.set({
            rts: false
        })
    } else {
        port.set({
            rts: true
        })
        serialPort.write(Buffer.from('010300000031841E', 'hex'))
        port.set({
            rts: false
        })
    }
    // serialPort.on('data', (data)=> {
    //     received = Buffer.concat([received,  Buffer.from(data, 'hex')])
    //     if (received.length ===  103) {
    //         let wind_direction = Buffer.from([received[5],received[6]])
    //         wind_direction = wind_direction.readUInt16BE(0)
    //         let wind_speed = Buffer.from([received[9],received[10],received[7],received[8]])
    //         wind_speed = wind_speed.readFloatBE(0)
    //         let temperature = Buffer.from([received[13],received[14],received[11],received[12]])
    //         temperature = temperature.readFloatBE(0)
    //         let humidity = Buffer.from([received[17],received[18],received[15],received[16]])
    //         humidity = humidity.readFloatBE(0)
    //         let pressure = Buffer.from([received[21],received[22],received[19],received[20]])
    //         pressure = pressure.readFloatBE(0)
    //         console.log(wind_direction)
    //         console.log(wind_speed)
    //         console.log(temperature)
    //         console.log(humidity)
    //         console.log(pressure)
    //         res.json({
    //             'wind_direction': wind_direction,
    //             'wind_speed': wind_speed,
    //             'temperature': temperature,
    //             'humidity': humidity,
    //             'pressure': pressure
    //         })
    //         res.end()
    //     }
    // })
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
const {Router} = require('express')
const {SerialPort} = require("serialport")
const {ReadlineParser} = require('@serialport/parser-readline')
const router = Router()
const port = new SerialPort({
    path: '/dev/ttyUSB1',
    dataBits: 8,
    baudRate: 9600,
    stopBits: 1,
    parity: "even"
})
port.on('error', (err) => {
    console.log(err)
})
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))
router.get('/info', async (req, res) => {
    console.log("Got request")
    await sendData()
    parser.on('data', async (data)=> {
        console.log("try to parse")
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
function setTransmitMode() {
    port.set({
        rts: true,  // Включаем DE
        dtr: false  // Выключаем RE
    }, (err) => {
        if (err) {
            return console.log(err.message)
        } else {
            return console.log("Turned on transmit")
        }
    })
}
function setReceiveMode() {
    port.set({
        rts: false, // Выключаем DE
        dtr: true   // Включаем RE
    }, (err) => {
        if (err) {
            return console.log(err.message)
        } else {
            return console.log("Turned on Receive")
        }
    })
}
function sendData() {
    let data = hexStringToByteArray('010300000031841E')
    console.log(data)
    setTransmitMode()
    setTimeout(() => {
        console.log("Try to transmit via rs485")
        port.write(data, (err) => {
            if (err) {
                return console.log(err.message)
            }
            // Переключаемся обратно в режим приема после отправки данных
            setReceiveMode()
        })
    }, 10)  // Небольшая задержка перед отправкой данных
}
function hexStringToByteArray(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16))
    }
    return Buffer.from(bytes)
}
module.exports = router

const {Router} = require('express')
const crc = require('crc')
const devices = require("../middleware/devices")
const config = require("config")
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

                    let messageWithoutCRC = received.slice(0, -2)
                    let receivedCRC = received.readUInt16LE(received.length - 2)
                    const calculatedCRC = crc.crc16modbus(messageWithoutCRC)
                    if (calculatedCRC !== receivedCRC) {
                        console.error('CRC mismatch: Received:', receivedCRC, 'Calculated:', calculatedCRC);
                        res.status(400).json(
                            { error: 'Invalid CRC' });
                    }
                    devices.serialPort.removeAllListeners()
                    res.json({
                        'wind_direction': received.readUInt16BE(5),
                        'wind_speed': received.readFloatBE(7),
                        'temperature': received.readFloatBE(11),
                        'humidity': received.readFloatBE(15),
                        'pressure': received.readFloatBE(19),
                        roverID: config.get('roverID'),
                        "raw": received
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
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
                received = Buffer.concat([received,  Buffer.from(data)])
                if (received.length ===  103) {

                    let messageWithoutCRC = received.slice(0, -2)
                    let receivedCRC = received.readUInt16LE(received.length - 2)
                    const calculatedCRC = crc.crc16modbus(messageWithoutCRC)
                    if (calculatedCRC !== receivedCRC) {
                        res.json({
                            "err": "002",
                            "info": '\'CRC mismatch: Received:\', receivedCRC, \'Calculated:\', calculatedCRC'
                        })
                    } else {
                        devices.serialPort.removeAllListeners()
                        res.json({
                            'wind_direction': Buffer.from([received[5],received[6]]).readUInt16BE(0),
                            'wind_speed': Buffer.from([received[9],received[10],received[7],received[8]]).readFloatBE(0),
                            'temperature': Buffer.from([received[13],received[14],received[11],received[12]]).readFloatBE(0),
                            'humidity': Buffer.from([received[17],received[18],received[15],received[16]]).readFloatBE(0),
                            'pressure': Buffer.from([received[21],received[22],received[19],received[20]]).readFloatBE(0),
                            roverID: config.get('roverID'),
                            "raw": received
                        })
                    }
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
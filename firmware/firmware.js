const axios = require('axios')
const {UBXParser} = require('ubx-parser')
const {SerialPort} = require("serialport")
const {ReadlineParser} = require('@serialport/parser-readline')
const config = require("config")

function firmware() {
    let TIMESTAMP = 0
//open serial
    const serialPort = new SerialPort({
        path: config.get('serialPort'),
        baudRate: config.get('baudRate')
    })
//if error
    serialPort.on('error', () => {
        console.log("CANNOT OPEN SERIAL PORT " + config.get('serialPort') + " WITH BAUD RATE " + config.get('baudRate'))
        process.exit(1)
    })
//init UBX parser
    const ubxParser = new UBXParser
//catch UBX
    serialPort.on("data",  (buffer) => {
        TIMESTAMP = Date.now()
        ubxParser.parse(buffer)
    })
//send UBX
    ubxParser.on("data",  (data) => {
        let type = 'UBX-?'
        if (Object.keys(data).length === 25) {
            type = 'UBX-RELPOSNED'
        } else if (Object.keys(data).length === 44) {
            type = 'UBX-PVT'
        }
        data = {
            'type': type,
            ...data,
            r_timestamp: TIMESTAMP,
            roverID: config.get('roverID')
        }
         axios.post(config.get('gw') + "/api/rover/ubx", data)
            .then(() => {})
            .catch(() => {
                console.error('UBX POST request error for: ' + config.get('gw'))
            })
        axios.post(config.get('base') + "/api/rover/ubx", data)
            .then(() => {})
            .catch(() => {
                console.error('UBX POST request error for: ' + config.get('base'))
            })
    })
//catch NMEA
    const nmeaParser = serialPort.pipe(new ReadlineParser({delimiter: '\r\n'}), () => {
        TIMESTAMP = Date.now()
    })
//send NMEA
    nmeaParser.on("data", (msg) => {
        if (msg.match(/^\$GNGGA,+/m)) {
            msg = msg.split(',')
            let req = {
                type: 'NMEA',
                nTime: msg[1],
                lat: msg[2],
                NS: msg[3],
                lon: msg[4],
                EW: msg[5],
                r_timestamp: TIMESTAMP,
                roverID: config.get('roverID')
            }
             axios.post(config.get('gw') + "/api/rover/nmea", req)
                .then(() => {})
                .catch(() => {
                    console.error('NMEA POST request error for: ' + config.get('gw'))
                })
            axios.post(config.get('base') + "/api/rover/nmea", req)
                .then(() => {})
                .catch(() => {
                    console.error('NMEA POST request error for: ' + config.get('base'))
                })
        }
    })

}

module.exports = firmware
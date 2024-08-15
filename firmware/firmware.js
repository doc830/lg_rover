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
    serialPort.on("data", async (buffer) => {
        TIMESTAMP = Date.now()
        ubxParser.parse(buffer)
    })
//send UBX
    ubxParser.on("data", async (data) => {
        await axios.post(config.get('gw'), {
            type: 'UBX',
            itow: data["iTOW"],
            relPosN: data["relPosN"],
            relPosE: data["relPosE"],
            relPosD: data["relPosD"],
            relPosH: data["relPosHeading"],
            length: data["relPosLength"],
            isFix: data["diffFixOK"],
            diffSol: data["diffSoln"],
            carrSol: data["carrSoln"],
            r_timestamp: TIMESTAMP,
            roverID: config.get('roverID')
        })
            .then(() => {})
            .catch(() => {
            console.error('UBX POST request error:')})
    })
//catch NMEA
    const nmeaParser = serialPort.pipe(new ReadlineParser({delimiter: '\r\n'}), () => {
        TIMESTAMP = Date.now()
    })
//send NMEA
    nmeaParser.on("data", async (msg) => {
        if (msg.match(/^\$GNGGA,+/m)) {
            msg = msg.split(',')
            await axios.post(config.get('gw'), {
                type: 'NMEA',
                nTime: msg[1],
                lat: msg[2],
                NS: msg[3],
                lon: msg[4],
                EW: msg[5],
                r_timestamp: TIMESTAMP,
                roverID: config.get('roverID')
            })
                .then(() => {})
                .catch(() => {
                    console.error('UBX POST request error:')})
        }
    })
}
module.exports = firmware
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
    const serialPortWeather = new SerialPort({
        path: '/dev/ttyUSB0',
        dataBits: 8,
        baudRate: 9600,
        stopBits: 1,
        parity: "even"
    })
//if error
    serialPort.on('error', () => {
        console.log("CANNOT OPEN SERIAL PORT " + config.get('serialPort') + " WITH BAUD RATE " + config.get('baudRate'))
        process.exit(1)
    })
    serialPortWeather.on('error', (err) => {
        console.log(err)
    })
//init UBX parser
    const ubxParser = new UBXParser
//catch UBX
    serialPort.on("data",  (buffer) => {
        TIMESTAMP = Date.now()
        ubxParser.parse(buffer)
    })
//send UBX
    ubxParser.on("data", async (data) => {
        await axios.post(config.get('gw') + "/api/rover/ubx", {
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
                console.error('UBX POST request error:')
            })
    })
//catch NMEA
    const nmeaParser = serialPort.pipe(new ReadlineParser({delimiter: '\r\n'}), () => {
        TIMESTAMP = Date.now()
    })
//send NMEA
    nmeaParser.on("data", async (msg) => {
        if (msg.match(/^\$GNGGA,+/m)) {
            msg = msg.split(',')
            await axios.post(config.get('gw') + "/api/rover/nmea", {
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
                    console.error('NMEA POST request error:')
                })
        }
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
            await axios.post(config.get('gw') + "/api/rover/nmea", {
                wind_direction: wind_direction,
                wind_speed: wind_speed,
                temperature: temperature,
                humidity: humidity,
                pressure: pressure
            })
                .then(() => {})
                .catch(() => {
                    console.error('Weather POST request error:')
                })
        }
    })
    setInterval(()=> {
        serialPortWeather.write(Buffer.from('010300000031841E', 'hex'))
    }, 1000)
}
module.exports = firmware
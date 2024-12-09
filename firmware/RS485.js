const {SerialPort} = require('serialport')
const config = require("config")
const crc = require('crc')
const axios = require("axios");
const {ReadlineParser} = require("@serialport/parser-readline")
const serialPortConfigVisibility = {
    path: "/dev/ttyUSB1",
    dataBits: 7,
    baudRate: 9600,
    stopBits: 1,
    parity: "even"
}
const serialPortConfigWeather = {
    path: "/dev/ttyUSB1",
    dataBits: 8,
    baudRate: 9600,
    stopBits: 1,
    parity: "even"
}
const weather_command = Buffer.from('010300000031841E', 'hex')

function weatherService() {
    let openedPort
    openPort (serialPortConfigWeather).then((port)=> {
        openedPort =  port
        async function messaging() {
            try {
                await sendMessage(openedPort, weather_command)
                const weather = await listenPort(openedPort)
                console.log(weather)
                postData(weather, "/api/rover/weather")
                setTimeout(messaging, 1000)
            } catch (err) {
                console.log(err)
                try {
                    console.log('Closing weather port')
                    await closePort(openedPort)
                    openedPort.removeAllListeners()
                    visibilityService()
                } catch (err) {
                    console.log(err)
                }
            }
        }
        messaging()
    }).catch(err=>{
        console.log(err)
    })

}
function visibilityService() {
    openPort(serialPortConfigVisibility).then((port)=>{
        console.log('Listening visibility data')
        let timeout = setTimeout(()=>{
            console.log('No visibility data, closing port')
            closePort(port).then(()=>{
                port.removeAllListeners()
                weatherService()
            }).catch((err)=>{
                console.log(err)
            })
        }, 10000)
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }))
        parser.on('data', (data)=> {
            data = data.split(' ')
            if (data[0] !== "\x01PW") {
                console.error('Invalid visibility data')
                return
            }
            timeout.refresh()
            let status = data[2].charAt(data[2].length-1)
            if (status !== "0") {
                status = "Measurement in process"
            } else {
                status = "Measured"
            }
            let avg_vis_1_min = Number(data[4])
            let avg_vis_10_min = Number(data[6])
            if (!Number.isInteger(avg_vis_1_min)) {
                avg_vis_1_min = null
            }
            if (!Number.isInteger(avg_vis_10_min)) {
                avg_vis_10_min = null
            }
            let v_data = {
                type: "visibility",
                status: status,
                avg_vis_1_min: avg_vis_1_min,
                avg_vis_10_min: avg_vis_10_min,
                time: Date.now(),
                roverID: config.get('roverID')
            }
            console.log(v_data)
            postData(v_data, "/api/rover/visibility")
        })

    }).catch((err)=>{
        console.log(err)
    })
}

function listenPort(port) {
    let received = Buffer.alloc(0)
    return new Promise((resolve, reject)=> {
        console.log('Listening weather')
        port.removeAllListeners()

        let timeout = setTimeout(() => {
            port.removeAllListeners()
            reject (new Error ('Weather station does not respond'))
        }, 2000)

        port.on('data', (data)=> {
            received = Buffer.concat([received, Buffer.from(data)])
            if (received.length === 103) {
                clearTimeout(timeout)
                port.removeAllListeners()
                if (!CRC(received)) {
                    received = recoverMessage(received)
                }
                let wind_direction = Buffer.from([received[5], received[6]]).readUInt16BE(0)
                if (!(wind_direction >= 0 && wind_direction <= 360)) {
                    console.log('invalid')
                    reject(new Error('Invalid weather data'))
                }
                resolve({
                    type: "weather",
                    wind_direction: Buffer.from([received[5], received[6]]).readUInt16BE(0),
                    wind_speed: Buffer.from([received[9], received[10], received[7], received[8]]).readFloatBE(0),
                    temperature: Buffer.from([received[13], received[14], received[11], received[12]]).readFloatBE(0),
                    humidity: Buffer.from([received[17], received[18], received[15], received[16]]).readFloatBE(0),
                    pressure: Buffer.from([received[21], received[22], received[19], received[20]]).readFloatBE(0),
                    CRC: CRC(received),
                    roverID: config.get('roverID'),
                })
            }
        })
    })
}
function sendMessage(port, message) {
    return new Promise((resolve, reject) => {
        port.write(message, err => {
            if (err) {
                reject (new Error(err.message))
            }
            port.drain((err) =>{
                console.log('Sent command via RS485')
                if (err) {
                    reject (new Error(err.message))
                }
            })
            resolve()
        })
    })
}
function openPort (config) {
    return new Promise((resolve, reject)=> {
        let port = new SerialPort(config, (err) => {
            if (err) {
                reject (err)
            }
            resolve (port)
        })
    })
}
function closePort(port) {
    return new Promise((resolve, reject)=> {
        port.close((err)=>{
            if (err) {
                reject (err)
            }
            resolve()
        })
    })
}
function CRC (message) {
    let messageWithoutCRC = message.slice(0, -2)
    let receivedCRC = message.readUInt16LE(message.length - 2)
    let calculatedCRC = crc.crc16modbus(messageWithoutCRC)
    return calculatedCRC === receivedCRC
}
function recoverMessage(message) {
    return message.slice(1)
}

function postData (data, url) {
    axios.post(config.get('gw') + url, data).then(() => {}).catch(() => {
        //console.error('Visibility POST request error for: ' + config.get('gw'))
    })
    axios.post(config.get('base') + url, data).then(() => {}).catch(() => {
        //console.error('Visibility POST request error for: ' + config.get('base'))
    })
}
module.exports = weatherService
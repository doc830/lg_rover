const {SerialPort} = require('serialport')
const config = require("config")
const crc = require('crc')

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
const message = '010300000031841E'
function rs485() {
    connectDevice().then((result)=>{
        if (result.device === 'weather') {
            weatherService(result.port)
        } else if (result.device === 'visibility') {
            visibilityService(result.port)
        } else {
            console.log('Error in RS485')
        }
    }).catch((err)=>{
        console.log(err)
        rs485()
    })
}
function connectDevice() {
    return new Promise((resolve, reject) => {
        let openedPort
        const timeout = setTimeout(() => {
            console.log('Timeout: No visibility data')
            closePort(openedPort).then(()=>{
                openPort(serialPortConfigWeather).then((port)=>{
                    openedPort = port

                }).catch((err) => {
                    reject (err)
                })
            }).catch((err)=> {
                reject (err)
            })
        }, 5000)
        openPort(serialPortConfigVisibility).then((port)=>{
            console.log(port)
            openedPort = port
            port.on('data', ()=> {
                clearTimeout(timeout)
                resolve({
                    device: 'visibility',
                    port
                })
            })
        }).catch((err)=>{
            reject(err)
        })

        // const timeout = setTimeout(() => {
        //     closePort(port).then(()=>{
        //         port = new SerialPort(serialPortConfigWeather, ()=>{
        //             sendMessage().then(()=>{
        //                 listenPort(port).then(()=>{
        //                     resolve ({
        //                         device: 'weather',
        //                         port
        //                     })
        //                 }).catch((err)=>{
        //                     closePort(port).then(()=>{
        //                         return  reject (err)
        //                     }).catch((err) => {
        //                         return reject (err)
        //                     })
        //                 })
        //             }).catch((err)=>{
        //                 reject (err)
        //             })
        //         })
        //     }).catch((err)=> {
        //         reject(err)
        //     })
        // }, 5000)

    })
}
function weatherService(port) {
    sendMessage().then(()=>{
        listenPort(port).then((result)=>{
            console.log(result)
        }).catch((err)=>{
            console.log(err)
            rs485()
        })
    }).catch((err)=>{
        console.log(err)
        rs485()
    })
}
function visibilityService(port) {
    let timeout = setTimeout(()=>{
        port.closePort().then(()=>{
            rs485()
        }).catch((err)=> {
            console.log(err)
        })
    }, 5000)
    port.on('data', (data)=>{
        clearTimeout(timeout)
        console.log(data)
    })
    port.on('error', () => {
        port.closePort().then(()=>{
            rs485()
        }).catch((err)=> {
            console.log(err)
        })
    })
}
function listenPort(port) {
    let received = Buffer.alloc(0)
    return new Promise((resolve, reject)=> {

        let timeout = setTimeout(() => {
            port.removeAllListeners()
           return reject (new Error ('Weather station does not respond'))
        }, 1000)

        port.on('data', (data) => {
            clearTimeout(timeout)
            received = Buffer.concat([received,  Buffer.from(data)])
            if (received.length ===  103) {
                if (!CRC(received)) {
                    received = recoverMessage(received)
                }
                port.removeAllListeners()
                return resolve ({
                    wind_direction: Buffer.from([received[5],received[6]]).readUInt16BE(0),
                    wind_speed: Buffer.from([received[9],received[10],received[7],received[8]]).readFloatBE(0),
                    temperature: Buffer.from([received[13],received[14],received[11],received[12]]).readFloatBE(0),
                    humidity: Buffer.from([received[17],received[18],received[15],received[16]]).readFloatBE(0),
                    pressure: Buffer.from([received[21],received[22],received[19],received[20]]).readFloatBE(0),
                    CRC: CRC(received),
                    roverID: config.get('roverID'),
                })
            } else {
                return reject (new Error('No valid data via RS485'))
            }
        })
    })
}
function sendMessage(port) {
    return new Promise((resolve, reject) => {
        port.write(message, err => {
            if (err) {
                return reject (new Error(err.message))
            }
            port.drain((err) =>{
                if (err) {
                    return reject (new Error(err.message))
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
                return reject (err)
            }
            return resolve (port)
        })
    })
}
function closePort(port) {
    return new Promise((resolve, reject)=> {
        port.close((err)=>{
            if (err) {
                return reject (err)
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
module.exports = rs485
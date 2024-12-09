const {SerialPort} = require("serialport")
class Devices {
    constructor() {
        this.serialPort = ""
    }
    sendMessage(port, message) {
        return new Promise((resolve, reject) => {
            port.write(message, err => {
                if (err) {
                    reject (new Error(err.message))
                }
                port.drain((err) =>{
                    if (err) {
                        reject (new Error(err.message))
                    }
                })
                resolve()
            })
        })
    }
    openPort (config) {
        return new Promise((resolve, reject)=> {
            let port = new SerialPort(config, (err) => {
                if (err) {
                    reject (err)
                }
                resolve (port)
            })
        })
    }
    closePort(port) {
        return new Promise((resolve, reject)=> {
            port.close((err)=>{
                if (err) {
                    reject (err)
                }
                resolve()
            })
        })
    }
}
const devices = new Devices()
module.exports = devices
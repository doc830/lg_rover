const {SerialPort} = require("serialport");
class Devices {
    constructor() {
        this.weather = false
        this.visibility = false
        this.serialPort = ""
        this.serialPort2 = ""
    }
    setVisibility () {
        this.visibility = true
    }
    async setWeather (status) {
        return new Promise(async (resolve, reject) => {
            switch (status) {
                case false:
                    this.serialPort.close()
                    this.weather = false
                    return resolve("Погодная станция отключена")
                case status&&this.visibility:
                    return  reject (new Error("Подключен ДМДВ!"))
                case this.weather&&status:
                    return  reject (new Error("Погодная станция уже подключена!"))
                case true:
                    await this.openPort({
                        path: "/dev/ttyUSB1",
                        dataBits: 8,
                        baudRate: 9600,
                        stopBits: 1,
                        parity: "even"
                    }).then(() => {
                        this.weather = status
                        return resolve ()
                    }).catch((err) => {
                        return  reject (err)
                    })
                    return
                default:
                    return reject(new Error('Undefined argument'))
            }
        })
    }
    openPort (config) {
        return new Promise((resolve, reject)=> {
            this.serialPort = new SerialPort(config, (err) => {
                if (err) {
                    return reject (err)
                }
                resolve ()
            })
        })
    }
    async sendMessage (message) {
        await new Promise((resolve, reject) => {
            this.serialPort.write(message, err => {
                if (err) {
                    return reject (new Error(err.message))
                }
                this.serialPort.drain((err) =>{
                    if (err) {
                        return reject (new Error(err.message))
                    }
                })
                resolve()
            })
        })
    }
    getVisibilityStatus () {
        return this.visibility
    }
    getWeatherStatus () {
        return this.weather
    }

}
const devices = new Devices()
module.exports = devices
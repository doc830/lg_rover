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
                case !status:
                    this.serialPort.close()
                    return resolve("Погодная станция отключена")
                case this.visibility:
                    return  reject (new Error("Подключен ДМДВ!"))
                case this.weather&&status:
                    return  reject (new Error("Погодная станция уже подключена!"))
                case !this.weather&&status:
                    await this.openPort({
                        path: "/dev/ttyUSB1",
                        dataBits: 8,
                        baudRate: 9600,
                        stopBits: 1,
                        parity: "even"
                    }).then(() => {
                        this.weather = status
                        return resolve (true)
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
                resolve (true)
            })
        })
    }
    async sendMessage (message, port) {
        await new Promise((resolve, reject) => {
            switch (port) {
                case 1:
                    this.serialPort.write(message, err => {
                        if (err) {
                            return reject (new Error(err.message))
                        }
                        resolve()
                    })
                    return
                case 2:
                    this.serialPort2.write(message, err => {
                        if (err) {
                            return reject (new Error(err.message))
                        }
                        resolve()
                    })
                    return
                default:
                    return reject (new Error("Unavailable port"))
            }

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
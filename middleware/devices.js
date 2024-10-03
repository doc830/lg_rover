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
                    return resolve("Погодная станция отключена")
                case status&&this.visibility:
                    return  reject (new Error("Подключен ДМДВ!"))
                case this.weather&&status:
                    return  reject (new Error("Погодная станция уже подключена!"))
                case true:
                    const port = await this.openPort({
                        path: "/dev/ttyUSB1",
                        dataBits: 8,
                        baudRate: 9600,
                        stopBits: 1,
                        parity: "even"
                    }).then(() => {
                        this.weather = status
                        return resolve (port)
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
            const port = new SerialPort(config, (err) => {
                if (err) {
                    return reject (err)
                }
                port.on('open', ()=>{
                    port.write(Buffer.from('010300000031841E', 'hex'))
                })
                resolve (port)
            })
        })
    }
    async sendMessage (message, port) {
        await new Promise((resolve, reject) => {
            port.write(message, err => {
                if (err) {
                    return reject (new Error(err.message))
                }
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
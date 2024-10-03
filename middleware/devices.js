const {SerialPort} = require("serialport");
class Devices {
    constructor() {
        this.weather = false
        this.visibility = true
        this.serialPort = ""
    }
    setVisibility () {
        this.visibility = true
    }
    async setWeather (status) {
        return new Promise(async (resolve, reject) => {
            if (this.visibility) {
                return  reject (new Error("Подключен ДМДВ!"))
            }
            await this.openPort(8).then(() => {
                this.weather = status
                return resolve (true)
            }).catch((err) => {
                return  reject (err)
            })
        })
    }
    getVisibilityStatus () {
        return this.visibility
    }
    getWeatherStatus () {
        return this.weather
    }
    openPort (dataBits) {
        return new Promise((resolve, reject)=> {
            this.serialPort = new SerialPort({
                path: "/dev/ttyUSB1",
                dataBits: dataBits,
                baudRate: 9600,
                stopBits: 1,
                parity: "even"
            }, (err) => {
                if (err) {
                    return reject (err)
                }
                resolve (true)
            })
        })
    }
}
const devices = new Devices()
module.exports = devices
const {SerialPort} = require("serialport");
class Devices {
    constructor() {
        this.weather = false
        this.visibility = false
        this.serialPort = ""
    }
    setVisibility () {
        this.visibility = true
    }
    async setWeather (status) {
        this.weather = status
        if (status) {
           await this.openPort(8).then(() => {
               return true
            }).catch((err) => {

               return new Error(err.message)
           })
        }
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
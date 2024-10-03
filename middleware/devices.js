const {SerialPort} = require("serialport");
class Devices {
    constructor() {
        this.weather = false
        this.visibility = false
        this.serialPort = ""
        this.serialPort2 = ""
    }
    setVisibility (status) {
        return new Promise(async (resolve, reject) => {
            switch (status) {
                case this.visibility&&!status:
                    this.serialPort.close()
                    this.visibility=false
                    return resolve("ДМДВ отключен")
                case this.weather&&status:
                    return  reject (new Error("Подключена погодная станция!"))
                case this.visibility&&status:
                    return  reject (new Error("ДМДВ уже подключен!"))
                case !this.visibility??status:
                    await this.openPort({
                        path: "/dev/ttyUSB1",
                        dataBits: 8,
                        baudRate: 9600,
                        stopBits: 1,
                        parity: "even"
                    }).then(() => {
                        this.weather = true
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
    async setWeather (status) {
        return new Promise(async (resolve, reject) => {
            if (this.visibility===true&&status===true){
                return  reject (new Error("Подключен ДМДВ!"))
            }
            if (this.weather===false&&status===false){
                return resolve("Погодная станция уже отключена")
            }
            if (this.weather===true&&status===false){
                this.serialPort.close()
                this.weather=false
                return resolve("Погодная станция отключена")
            }
            if (this.weather===true&&status===true){
                return  reject (new Error("Погодная станция уже подключена!"))
            }
            if (this.weather===false&&status===true){
                await this.openPort({
                    path: "/dev/ttyUSB1",
                    dataBits: 8,
                    baudRate: 9600,
                    stopBits: 1,
                    parity: "even"
                }).then(() => {
                    this.weather = true
                    return resolve ()
                }).catch((err) => {
                    return  reject (err)
                })
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
    async sendMessage (message, port) {
        await new Promise((resolve, reject) => {
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

}
const devices = new Devices()
module.exports = devices
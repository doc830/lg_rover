const {SerialPort} = require("serialport");
class Devices {
    constructor() {
        this.weather = false
        this.visibility = false
        this.serialPort = ""
        this.serialPort2 = ""
    }
     setVisibility (status) {
        return new Promise( (resolve, reject) => {
            if (this.weather===true){
                return  reject (new Error("Подключена погодная станция!"))
            }
            if (this.visibility===false&&status===false){
                return reject(new Error("ДМДВ уже отключен!"))
            }
            if (this.visibility===true&&status===false){
                this.serialPort.close()
                this.visibility=false
                return resolve()
            }
            if (this.visibility===true&&status===true){
                return  reject (new Error("ДМДВ уже подключен!"))
            }
            if (this.weather===false&&status===true){
                 this.openPort({
                    path: "/dev/ttyUSB1",
                    dataBits: 7,
                    baudRate: 9600,
                    stopBits: 1,
                    parity: "even"
                }, 1).then(() => {
                    this.visibility = true
                    return resolve ()
                }).catch((err) => {
                    return  reject (err)
                })
            }
        })
    }
     setWeather (status) {
        return new Promise( (resolve, reject) => {
            if (this.visibility===true){
                return  reject (new Error("Подключен ДМДВ!"))
            }
            if (this.weather===false&&status===false){
                return reject(new Error("Погодная станция уже отключена!"))
            }
            if (this.weather===true&&status===false){
                this.serialPort.close()
                this.weather=false
                return resolve()
            }
            if (this.weather===true&&status===true){
                return  reject (new Error("Погодная станция уже подключена!"))
            }
            if (this.weather===false&&status===true){
                this.openPort({
                    path: "/dev/ttyUSB1",
                    dataBits: 8,
                    baudRate: 9600,
                    stopBits: 1,
                    parity: "even"
                }, 1).then(() => {
                    this.weather = true
                    return resolve ()
                }).catch((err) => {
                    return  reject (err)
                })
            }
        })
    }
     sendMessage (message, port) {
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
    openPort (config, port) {
        switch (port) {
            case 1:
                return new Promise((resolve, reject)=> {
                    this.serialPort = new SerialPort(config, (err) => {
                        if (err) {
                            return reject (err)
                        }
                        resolve ()
                    })
                })
            case 2:
                return new Promise((resolve, reject)=> {
                    this.serialPort2 = new SerialPort(config, (err) => {
                        if (err) {
                            return reject (err)
                        }
                        resolve ()
                    })
                })
        }
    }
    closePort (port) {
        switch (port) {
            case 1:
                return new Promise((resolve, reject)=> {
                    this.serialPort.close((err)=>{
                        if (err) {
                            return reject (err)
                        }
                        resolve()
                    })
                })
            case 2:
                return new Promise((resolve, reject)=> {
                    this.serialPort2.close((err)=>{
                        if (err) {
                            return reject (err)
                        }
                        resolve()
                    })
                })
        }
    }
}
const devices = new Devices()
module.exports = devices
const {Router} = require('express')
const router = Router()
const firmware = require('../middleware/devices')
router.get('/battery',  (req, res) => {
    let received = Buffer.alloc(0)
     firmware.openPort({
            path: "/dev/ttyS1",
            dataBits: 8,
            baudRate: 115200,
            stopBits: 1,
            parity: "even"
    }).then((port)=>{
        firmware.sendMessage(port, Buffer.from('A60100', 'hex')).then(() => {
            port.on('data', (data)=>{
                received = Buffer.concat([received, data])
                if (received.length === 3) {
                    received = {
                        "header": received.readUInt8(0),
                        "code": received.readUInt8(1),
                        "charge": ((received.readUInt8(2) >> 1)*0.042519+9).toFixed(2)
                    }
                    firmware.closePort(port).then(()=>{
                        res.json(received)
                    }).catch(err => {
                        res.json({
                            "err": "001",
                            "info": err.message
                        })
                    })
                }
            })
        }).catch(err => {
            res.json({
                "err": "001",
                "info": err.message
            })
        })
    }).catch(err => {
        res.json({
            "err": "001",
            "info": err.message
        })
    })
})
router.get('/restart_navi',  (req, res) => {
    let received = Buffer.alloc(0)
    firmware.openPort({
        path: "/dev/ttyS1",
        dataBits: 8,
        baudRate: 115200,
        stopBits: 1,
        parity: "even"
    }).then((port)=>{
        firmware.sendMessage(port, Buffer.from('A6DAFF', 'hex')).then(() => {
            port.on('data', (data)=>{
                received = Buffer.concat([received, data])
                if (received.length === 3) {
                    received = {
                        "header": received.readUInt8(0),
                        "code": received.readUInt8(1),
                        "charge": received.readUInt8(2)
                    }
                    firmware.closePort(port).then(()=>{
                        res.json(received)
                    }).catch(err => {
                        res.json({
                            "err": "001",
                            "info": err.message
                        })
                    })
                }
            })
        }).catch(err => {
            res.json({
                "err": "001",
                "info": err.message
            })
        })
    }).catch(err => {
        res.json({
            "err": "001",
            "info": err.message
        })
    })
})
router.get('/device_off',  (req, res) => {
    firmware.openPort({
        path: "/dev/ttyS1",
        dataBits: 8,
        baudRate: 115200,
        stopBits: 1,
        parity: "even"
    }).then((port)=>{
        firmware.sendMessage( port, Buffer.from('A6AD00', 'hex')).then(() => {
            res.json("Device off")
        }).catch(err => {
            res.json({
                "err": "001",
                "info": err.message
            })
        })
    }).catch(err => {
        res.json({
            "err": "001",
            "info": err.message
        })
    })
})
module.exports = router
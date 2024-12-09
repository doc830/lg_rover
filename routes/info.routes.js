const {Router} = require('express')
const router = Router()
const devices = require('../middleware/devices')
router.get('/battery',  (req, res) => {
    let received = Buffer.alloc(0)
     devices.openPort({
            path: "/dev/ttyS1",
            dataBits: 8,
            baudRate: 115200,
            stopBits: 1,
            parity: "even"
    }).then((port)=>{
        devices.sendMessage(Buffer.from('A60100', 'hex'), port).then(() => {
            port.on('data', (data)=>{
                received = Buffer.concat([received, data])
                if (received.length === 3) {
                    received = {
                        "header": received.readUInt8(0),
                        "code": received.readUInt8(1),
                        "charge": ((received.readUInt8(2) >> 1)*0.042519+9).toFixed(2)
                    }
                    port.closePort().then(()=>{
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
router.get('/batch_number',  (req, res) => {
    let received = Buffer.alloc(0)
    devices.openPort({
        path: "/dev/ttyS1",
        dataBits: 8,
        baudRate: 115200,
        stopBits: 1,
        parity: "even"
    }).then((port)=>{
        devices.sendMessage(Buffer.from('A60700', 'hex'), port).then(() => {
            port.on('data', (data)=>{
                received = Buffer.concat([received, data])
                if (received.length === 3) {
                    received = {
                        "header": received.readUInt8(0),
                        "code": received.readUInt8(1),
                        "batch_number": received.readUInt8(2)
                    }
                    port.closePort().then(()=>{
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
router.get('/serial_number',  (req, res) => {
    let received = Buffer.alloc(0)
    devices.openPort({
        path: "/dev/ttyS1",
        dataBits: 8,
        baudRate: 115200,
        stopBits: 1,
        parity: "even"
    }).then((port)=>{
        devices.sendMessage(Buffer.from('A60800', 'hex'), port).then(() => {
            port.on('data', (data)=>{
                received = Buffer.concat([received, data])
                if (received.length === 3) {
                    received = {
                        "header": received.readUInt8(0),
                        "code": received.readUInt8(1),
                        "serial_number": received.readUInt8(2)
                    }
                    devices.closePort(port).then(()=>{
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
    devices.openPort({
        path: "/dev/ttyS1",
        dataBits: 8,
        baudRate: 115200,
        stopBits: 1,
        parity: "even"
    }).then((port)=>{
        devices.sendMessage(Buffer.from('A6AD00', 'hex'), port).then(() => {
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
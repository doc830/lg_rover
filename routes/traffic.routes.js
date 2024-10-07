const {Router} = require('express')
const devices = require("../middleware/devices");
const router = Router()
let portAvailable = true
router.get('/white', (req, res) => {
    if (!portAvailable) {
        console.log('Порт занят:', portAvailable)
        return res.json({
            "err": "001",
            "info": "COM порт занят!"
        })
    }
    portAvailable = false
    turn("A604FF").then((received)=>{
        if (received.param === 255) {
            turn("A60301").then((received)=>{
                res.json(received)
            }).catch((err)=>{
                res.json({
                    "err": "001",
                    "info": err.message
                })
            })
        }
    }).catch((err)=>{
        res.json({
            "err": "002",
            "info": err.message
        })
    }).finally(() => {
        devices.closePort(2).then(()=>{
            portAvailable = true
        }).catch(err => {
            res.json({
                "err": "003",
                "info": err.message
            })
        })
    })
})
router.get('/blue', (req, res) => {
    if (!portAvailable) {
        console.log('Порт занят:', portAvailable)
        return res.json({
            "err": "001",
            "info": "COM порт занят!"
        })
    }
    portAvailable = false
    turn("A604FF").then((received)=>{
        if (received.param === 255) {
            turn("A60302").then((received)=>{
                res.json(received)
            }).catch((err)=>{
                res.json({
                    "err": "001",
                    "info": err.message
                })
            })
        }
    }).catch((err)=>{
        res.json({
            "err": "002",
            "info": err.message
        })
    }).finally(() => {
        devices.closePort(2).then(()=>{
            portAvailable = true
        }).catch(err => {
            res.json({
                "err": "003",
                "info": err.message
            })
        })
    })
})
router.get('/green', (req, res) => {
    if (!portAvailable) {
        console.log('Порт занят:', portAvailable)
        return res.json({
            "err": "001",
            "info": "COM порт занят!"
        })
    }
    portAvailable = false
    turn("A604FF").then((received)=>{
        if (received.param === 255) {
            turn("A60303").then((received)=>{
                res.json(received)
            }).catch((err)=>{
                res.json({
                    "err": "001",
                    "info": err.message
                })
            })
        }
    }).catch((err)=>{
        res.json({
            "err": "002",
            "info": err.message
        })
    }).finally(() => {
        devices.closePort(2).then(()=>{
            portAvailable = true
        }).catch(err => {
            res.json({
                "err": "003",
                "info": err.message
            })
        })
    })
})
router.get('/yellow', (req, res) => {
    if (!portAvailable) {
        console.log('Порт занят:', portAvailable)
        return res.json({
            "err": "001",
            "info": "COM порт занят!"
        })
    }
    portAvailable = false
    turn("A604FF").then((received)=>{
        if (received.param === 255) {
            turn("A60304").then((received)=>{
                res.json(received)
            }).catch((err)=>{
                res.json({
                    "err": "001",
                    "info": err.message
                })
            })
        }
    }).catch((err)=>{
        res.json({
            "err": "002",
            "info": err.message
        })
    }).finally(() => {
        devices.closePort(2).then(()=>{
            portAvailable = true
        }).catch(err => {
            res.json({
                "err": "003",
                "info": err.message
            })
        })
    })
})
router.get('/red', (req, res) => {
    if (!portAvailable) {
        console.log('Порт занят:', portAvailable)
        return res.json({
            "err": "001",
            "info": "COM порт занят!"
        })
    }
    portAvailable = false
    turn("A604FF").then((received)=>{
        if (received.param === 255) {
            turn("A60305").then((received)=>{
                res.json(received)
            }).catch((err)=>{
                res.json({
                    "err": "001",
                    "info": err.message
                })
            })
        }
    }).catch((err)=>{
        res.json({
            "err": "002",
            "info": err.message
        })
    }).finally(() => {
        devices.closePort(2).then(()=>{
            portAvailable = true
        }).catch(err => {
            res.json({
                "err": "003",
                "info": err.message
            })
        })
    })
})
function turn(command) {
    let received = Buffer.alloc(0)
    return new Promise( (resolve, reject) => {
         devices.openPort({
            path: "/dev/ttyS1",
            dataBits: 8,
            baudRate: 115200,
            stopBits: 1,
            parity: "even"
        },2).then(()=>{
             devices.sendMessage(Buffer.from(command, 'hex'), devices.serialPort2).then(()=>{
                 devices.serialPort2.on('data', (data)=>{
                     received = Buffer.concat([received, Buffer.from(data, 'hex')])
                     if (received.length === 3) {
                         received = {
                             "header": Buffer.from([received[0]]).readUInt8(0),
                             "code": Buffer.from([received[1]]).readUInt8(0),
                             "param": Buffer.from([received[2]]).readUInt8(0)
                         }
                         devices.closePort(2).then(()=>{
                             resolve(received)
                         }).catch(err => {
                             reject (new Error(err))
                         })
                     }
                 })
             }).catch(err => {
                 reject (new Error(err))
             })
        }).catch(err => {
            reject (new Error(err))
        })
    })
}
module.exports = router
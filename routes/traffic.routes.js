const {Router} = require('express')
const devices = require("../middleware/devices");
const router = Router()
let portAvailable = true
router.get('/white', (req, res) => {
    response(res, "A60301")
})
router.get('/blue', (req, res) => {
    response(res, "A60302")
})
router.get('/green', (req, res) => {
    response(res, "A60303")
})
router.get('/yellow', (req, res) => {
    response(res, "A60304")
})
router.get('/red', (req, res) => {
    response(res, "A60305")
})
router.get('/off', (req, res) => {
    response(res, "A604FF")
})
function response(res, command) {
    if (!portAvailable) {
        return res.json({
            "err": "001",
            "info": "COM порт занят!"
        })
    }
    portAvailable = false
    turn("A604FF").then((received)=>{
        if (received.param === 255) {
            return turn(command)
        } else {
            throw new Error("Ошибка низкоуровневой системы устройства")
        }
    }).then((received)=>{
        res.json(received)
    }).catch((err)=>{
        res.json({
            "err": "001",
            "info": err.message
        })
    }).finally(() => {
        portAvailable = true
    })
}
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
                     received = Buffer.concat([received, data])
                     if (received.length === 3) {
                         received = {
                             "header": received.readUInt8(0),
                             "code": received.readUInt8(1),
                             "param": received.readUInt8(2)
                         }
                         devices.closePort(2).then(()=>{
                             resolve(received)
                         }).catch(err => {
                             reject (new Error(err))
                         })
                     }
                 })
             }).catch(err => {
                 devices.serialPort2(2)
                 reject (new Error(err))
             })
        }).catch(err => {
            reject (new Error(err))
        })
    })
}
module.exports = router
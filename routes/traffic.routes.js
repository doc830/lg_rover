const {Router} = require('express')
const firmware = require("../firmware/RS485")
const router = Router()
let portAvailable = true
router.get('/red', (req, res) => {
    response(res, ["A60305"])
})
router.get('/yellow', (req, res) => {
    response(res, ["A60304"])
})
router.get('/green', (req, res) => {
    response(res, "A60303")
})
router.get('/white', (req, res) => {
    response(res, "A60301")
})
router.get('/blue', (req, res) => {
    response(res, "A60302")
})
router.get('/yellow_green', (req, res) => {

})
router.get('/yellow_2', (req, res) => {

})
router.get('/yellow_blink', (req, res) => {

})

router.get('/off', (req, res) => {

})
function response(res, commands) {
    let receives = []
    if (!portAvailable) {
        return res.json({
            "err": "001",
            "info": "COM порт занят!"
        })
    }
    portAvailable = false
    for (const command in commands) {
        turn(command).then((received)=>{
            receives.push(received.param)
        }).catch((err)=>{
            res.json({
                "err": "001",
                "info": err.message
            })
        }).finally(() => {
            portAvailable = true
        })
    }

    return res.json({
        signals: receives
    })
}
function turn(command) {
    let received = Buffer.alloc(0)
    return new Promise( (resolve, reject) => {
         firmware.openPort({
            path: "/dev/ttyS1",
            dataBits: 8,
            baudRate: 115200,
            stopBits: 1,
            parity: "even"
        }).then((port)=>{
             firmware.sendMessage(port, Buffer.from(command, 'hex')).then(()=>{
                 port.on('data', (data)=>{
                     received = Buffer.concat([received, data])
                     if (received.length === 3) {
                         received = {
                             "header": received.readUInt8(0),
                             "code": received.readUInt8(1),
                             "param": received.readUInt8(2)
                         }
                         firmware.closePort(port).then(()=>{
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
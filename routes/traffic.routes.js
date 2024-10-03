const {Router} = require('express')
const devices = require("../middleware/devices");
const router = Router()
router.get('/white', async (req, res) => {
    let received = Buffer.alloc(0)
    await turn("A60301").then(()=>{
        devices.serialPort2.on('data', (data)=> {
            received = Buffer.concat([received,  Buffer.from(data, 'hex')])
            let header = Buffer.from([received[0]]).readUInt8(0)
            let charge = Buffer.from([received[1]]).readUInt8(0)
            let param = Buffer.from([received[2]]).readUInt8(0)
            res.json({
                "header": header,
                "charge": charge,
                "param ": param
            })
            devices.serialPort2.close()
            res.end()
    }).catch((err)=>{
        res.json({
            "err": "001",
            "info": err.message
        })
        res.end()
    })
})
router.get('/blue', (req, res) => {
    res.json({
        "answer": "ok"
    })
    res.end()
})
router.get('/green', (req, res) => {
    res.json({
        "answer": "ok"
    })
    res.end()
})
router.get('/yellow', (req, res) => {
    res.json({
        "answer": "ok"
    })
    res.end()
})
router.get('/red', (req, res) => {
    res.json({
        "answer": "ok"
    })
    res.end()
})
async function turn(command) {
    await new Promise(async (resolve, reject) => {
        await devices.openPort({
            path: "/dev/ttyS1",
            dataBits: 8,
            baudRate: 115200,
            stopBits: 1,
            parity: "even"
        },2).then(async ()=>{
            await devices.sendMessage(Buffer.from(command, 'hex'), devices.serialPort2)
            resolve()
        }).catch(err => {
            reject (new Error(err))
        })
    })
}
function listen() {

}
module.exports = router
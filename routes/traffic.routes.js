const {Router} = require('express')
const devices = require("../middleware/devices");
const router = Router()
router.get('/light', async (req, res) => {
    let received = Buffer.alloc(0)
    let light
    switch (req.query.s) {
        case "white":
            light = "A60301"
            return
        case "blue":
            light = "A60302"
            return
        case "green":
            light = "A60303"
            return
        case "yellow":
            light = "A60304"
            return
        case "red":
            light = "A60305"
            return
        default: light = "A60500"
    }
    console.log(light)
    await turn("A604FF").then(()=>{}).catch((err)=>{
        res.json({
            "err": "001",
            "info": err.message
        })
        res.end()
    })
    await turn(light).then(()=>{}).catch((err)=>{
        res.json({
            "err": "001",
            "info": err.message
        })
        res.end()
    })
    devices.serialPort2.on('data', (data)=> {
        received = Buffer.concat([received, Buffer.from(data, 'hex')])
        let header = Buffer.from([received[0]]).readUInt8(0)
        let code = Buffer.from([received[1]]).readUInt8(0)
        let param = Buffer.from([received[2]]).readUInt8(0)
        devices.serialPort2.close()
        res.json({
            "header": header,
            "code": code,
            "light ": param
        })
        res.end()
    })
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
module.exports = router
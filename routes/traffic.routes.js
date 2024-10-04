const {Router} = require('express')
const devices = require("../middleware/devices");
const router = Router()
router.get('/white', async (req, res) => {
    //1. Отправить команду
    //2. Прослушать
    await turn("A604FF").then(async (result)=>{
        console.log(result)
        res.end()
    }).catch((err)=>{
        res.json({
            "err": "001",
            "info": err.message
        })
        res.end()
    })

})
async function listen(res) {
    let received = Buffer.alloc(0)
    await new Promise((resolve) => {
        devices.serialPort2.on('data', (data)=> {
            received = Buffer.concat([received, Buffer.from(data, 'hex')])
            let header = Buffer.from([received[0]]).readUInt8(0)
            let code = Buffer.from([received[1]]).readUInt8(0)
            let param = Buffer.from([received[2]]).readUInt8(0)
            res.json({
                "header": header,
                "code": code,
                "light ": param
            })
            res.end()
            resolve()
        })
    })
}
async function turn(command) {
    let received = Buffer.alloc(0)
    await new Promise(async (resolve, reject) => {
        await devices.openPort({
            path: "/dev/ttyS1",
            dataBits: 8,
            baudRate: 115200,
            stopBits: 1,
            parity: "even"
        },2).then(async ()=>{
            await devices.sendMessage(Buffer.from(command, 'hex'), devices.serialPort2)
            devices.serialPort2.on('data', (data)=> {
                received = Buffer.concat([received, Buffer.from(data, 'hex')])
                received = {
                    "header": Buffer.from([received[0]]).readUInt8(0),
                    "code": Buffer.from([received[1]]).readUInt8(0),
                    "param": Buffer.from([received[2]]).readUInt8(0)
                }
                // let header = Buffer.from([received[0]]).readUInt8(0)
                // let code = Buffer.from([received[1]]).readUInt8(0)
                // let param = Buffer.from([received[2]]).readUInt8(0)
                devices.serialPort2.close()
                resolve(received)
            })
        }).catch(err => {
            reject (new Error(err))
        })
    })
}
module.exports = router
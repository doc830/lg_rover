const {Router} = require('express')
const firmware = require("../firmware/RS485")
const router = Router()
let portAvailable = true
router.get('/red', async (req, res) => {
    try {
        await response(res, ["A60305"]);
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        })
    }
})
router.get('/yellow', async (req, res) => {
    try {
        await response(res, ["A60304"]);
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        })
    }
})
router.get('/green', async (req, res) => {
    try {
        await response(res, ["A60303"]);
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        })
    }
})
router.get('/white', async (req, res) => {
    try {
        await response(res, ["A60301"]);
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        })
    }
})
router.get('/blue', async (req, res) => {
    try {
        await response(res, ["A60302"]);
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        })
    }
})
router.get('/yellow_green', async (req, res) => {
    try {
        await response(res, ["A60304", "A60303"])
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        });
    }
})
router.get('/yellow_2', async (req, res) => {
    try {
        await response(res, ["A60304", "A60305"]) // Два желтых
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        });
    }
})
// router.get('/yellow_blink', (req, res) => {
//
// })
router.get('/off', async (req, res) => {
    try {
        await response(res, ["A604FF"])
    } catch (err) {
        res.status(500).json({
            err: "002",
            info: "Не удалось обработать запрос: " + err.message
        });
    }
})
async function response(res, commands) {
    if (!portAvailable) {
        return res.json({
            "err": "001",
            "info": "COM порт занят!"
        })
    }
    portAvailable = false
    let receives = []
    try {
        await turn("A604FF")
        for (const command of commands) {
            const result = await turn(command)
            receives.push(result.param)
        }
    } catch (err) {
        return res.json({
            err: "001",
            info: err.message
        })
    } finally {
        portAvailable = true
    }
    return res.json({
        signals: receives.map(r => r.param)
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
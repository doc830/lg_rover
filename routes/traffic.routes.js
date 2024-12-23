const {Router} = require('express')
const firmware = require('../middleware/devices')
const router = Router()
let portAvailable = true
let blink_flag = false
let blinkTimer = null
router.get('/red', async (req, res) => {
    try {
        await response(res, ["A60305"])
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        })
    }
})
router.get('/yellow', async (req, res) => {
    try {
        await response(res, ["A60304"])
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        })
    }
})
router.get('/green', async (req, res) => {
    try {
        await response(res, ["A60303"])
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
        await turn("A60303")
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        })
    }
})
router.get('/yellow_2', async (req, res) => {
    try {
        await response(res, ["A60304", "A60303"])
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message
        })
    }
})
router.get('/yellow_blink', async (req, res) => {
    try {
        await response(res, ["A60304", "A60303"])
        blink_flag = true
        if (!blinkTimer) {
            blinkTimer = setInterval(async () => {
                try {
                    if (!blink_flag) {
                        clearInterval(blinkTimer)
                        blinkTimer = null
                        return
                    }
                    await turn("A60403")
                    await new Promise((resolve) => setTimeout(resolve, 500))
                    await turn("A60303")
                } catch (err) {
                    clearInterval(blinkTimer)
                    blinkTimer = null
                }
            }, 1000);
        }
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message,
        });
    }
})
router.get('/off', async (req, res) => {
    try {
        if (blinkTimer) {
            clearInterval(blinkTimer)
            blinkTimer = null
            blink_flag = false
        }
        await response(res, ["A604FF"])
    } catch (err) {
        res.status(500).json({
            err: "001",
            info: "Не удалось обработать запрос: " + err.message,
        })
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
        if (blink_flag) {
            blink_flag = false
            clearInterval(blinkTimer)
            blinkTimer = null
        }
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
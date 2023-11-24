const {Router} = require('express')
const router = Router()
const http = require('http')
const {UBXParser} = require('ubx-parser')
const {SerialPort} = require("serialport");
const config = require("config");
const Parser = new UBXParser
const serialPort = new SerialPort({
    path: config.get('serialPort'),
    baudRate: config.get('baudRate')
})
let marker = 'ro'
let nav_data = 0
serialPort.on("data", (buffer) => Parser.parse(buffer))
Parser.on("data", async (data)=> {
    if (marker !== 'ro') {
        marker = 'ro'
        nav_data = ''
        nav_data = data
        marker = 'w'
    }
})
router.get('/data',   async (req, res) => {
    try {
        await http.get(config.get('base-host')+'/api/rover/nav'+'?length='+readNavData())
    } catch (e) {
        res.status(500).json({message: "Что-то пошло не так, попробуйте снова"})
    }
})
function readNavData () {
    marker = 'ro'
    let buffer = nav_data
    marker = 'w'
    return buffer["Lenght"]
}
module.exports = router

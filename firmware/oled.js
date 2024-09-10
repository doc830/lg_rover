'use strict'
const i2c = require('i2c-bus')
const Oled = require('oled-i2c-bus')
const font = require('oled-font-pack')
function  oled() {
    const opts = {
        width: 128,
        height: 64,
        address: 0x3C,
        bus: 2,
        driver: "SSD1306"
    }
    const i2cBus = i2c.openSync(opts.bus)
    let oled = new Oled(i2cBus, opts)
    oled.clearDisplay()
    setInterval(()=> {


    }, 1)

}
module.exports = oled
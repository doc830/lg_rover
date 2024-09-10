const {SerialPort} = require('serialport')
const i2c = require('i2c-bus')
const Oled = require('oled-i2c-bus')
const font = require('oled-font-pack')
function oled() {
    let _oled
    const opts = {
        width: 128,
        height: 64,
        address: 0x3C,
        bus: 2,
        driver:"SSD1306"
    }
    const i2cBus = i2c.openSync(opts.bus)
    let oled = new Oled(i2cBus, opts)
    _oled = oled
    oled.clearDisplay(true)
    setInterval(()=> {
        oled.setCursor(20, Math.floor(64 / 2) +5)
        oled.writeString(font.oled_5x7, 2, 'TEST LOGGER', 1, true)
    }, 1000)

}
module.exports = oled
const {SerialPort} = require('serialport')
const i2c = require('i2c-bus')
const Oled = require('oled-i2c-bus')
const font = require('oled-font-5x7')

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
        oled.setCursor(1, 1)
        oled.writeString(font.oled_5x7, 2, 'TEST LOGGER', 1, true)
    }, 1)

}
module.exports = oled
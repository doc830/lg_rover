const {SerialPort} = require('serialport')
const i2c = require('i2c-bus')
const Oled = require('oled-i2c-bus')
const font = require('oled-font-5x7')

function oled() {
    const opts = {
        width: 128,
        height: 64,
        address: 0x3C,
        bus: 2,
        driver:"SSD1306"
    }
    const i2cBus = i2c.openSync(opts.bus)
    const oled = new Oled(i2cBus, opts)
    oled.clearDisplay()
    oled.turnOnDisplay()

    setInterval(()=> {
        oled.clearDisplay()
        oled.setCursor(1, 1)
        oled.writeString(font, 1, 'TEST LOGGER', 'white', true)
    }, 10)

}
module.exports = oled
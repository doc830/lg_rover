const i2c = require('i2c-bus')
const Oled = require('oled-i2c-bus')
const font = require('oled-font-pack')
function  oled() {
    const opts = {
        width: 128,
        height: 64,
        address: 0x3C,
        bus: 2,
        driver:"SSD1306"
    }
    const i2cBus = i2c.openSync(opts.bus)
    let oled = new Oled(i2cBus, opts)
    oled.clearDisplay()
    oled.turnOnDisplay()
    oled.setCursor(1, 2)
    oled.writeString(font.oled_5x7, 2, 'H', 1, true)
    // setInterval(()=> {
    //     oled.setCursor(20, Math.floor(64 / 2) +5)
    //     oled.writeString(font.oled_5x7, 2, ' LOGGER', 1, true)
    //
    // }, 1000)

}
module.exports = oled
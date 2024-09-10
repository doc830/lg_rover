'use strict'
const i2c = require('i2c-bus')
const i2cBus = i2c.openSync(2)
const OLED_ADDRESS = 0x3C
async function  oled() {
    await initDisplay()
    clearDisplay()
}
function sendCommand(command) {
    i2cBus.writeByteSync(OLED_ADDRESS, 0x00, command); // 0x00 указывает, что это команда
}
function sendData(data) {
    const MAX_BYTES = 32; // Максимальный размер блока (попробуем с 32 байтами)
    let offset = 0;
    while (offset < data.length) {
        const chunkSize = Math.min(MAX_BYTES, data.length - offset);
        const chunk = data.slice(offset, offset + chunkSize);
        i2cBus.writeI2cBlockSync(OLED_ADDRESS, 0x40, chunk.length, Buffer.from(chunk));
        offset += chunkSize;
    }
}
function clearDisplay() {
    for (let page = 0; page < 8; page++) {
        sendCommand(0xB0 + page);  // Устанавливаем страницу (от 0 до 7)
        sendCommand(0x00);         // Устанавливаем младший байт столбца
        sendCommand(0x10);         // Устанавливаем старший байт столбца

        const emptyData = new Array(128).fill(0); // Очищаем текущую страницу (128 байт)
        sendData(emptyData); // Отправляем данные для страницы
    }
}
function initDisplay() {
    sendCommand(0xAE); // Display OFF
    sendCommand(0xD5); // Set display clock divide ratio/oscillator frequency
    sendCommand(0x80); // Suggested value
    sendCommand(0xA8); // Set multiplex ratio
    sendCommand(0x3F); // 64MUX
    sendCommand(0xD3); // Set display offset
    sendCommand(0x00); // No offset
    sendCommand(0x40); // Set display start line to 0
    sendCommand(0x8D); // Charge pump
    sendCommand(0x14); // Enable charge pump
    sendCommand(0x20); // Memory addressing mode
    sendCommand(0x00); // Horizontal addressing mode
    sendCommand(0xA1); // Set segment re-map to normal
    sendCommand(0xC8); // Set COM output scan direction to remapped
    sendCommand(0xDA); // Set COM pins hardware configuration
    sendCommand(0x12); // Alternative COM pin configuration
    sendCommand(0x81); // Set contrast control
    sendCommand(0x7F); // Contrast value
    sendCommand(0xD9); // Set pre-charge period
    sendCommand(0xF1); // Pre-charge period value
    sendCommand(0xDB); // Set VCOMH deselect level
    sendCommand(0x40); // VCOMH deselect level
    sendCommand(0xA4); // Resume RAM content display
    sendCommand(0xA6); // Normal display (not inverted)
    sendCommand(0xAF); // Display ON
}
module.exports = oled
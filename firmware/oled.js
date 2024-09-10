const i2c = require('i2c-bus')
const Oled = require('oled-i2c-bus')
const font = require('oled-font-5x7')
function oled() {
    // Открываем шину I2C
    const i2cBus = i2c.openSync(1); // Убедитесь, что используется правильная I2C шина

// Настройки дисплея
    const opts = {
        width: 128,
        height: 64,
        address: 0x3C // Используйте адрес дисплея без учёта операций (в данном случае 0x78 -> 0x3C)
    };

// Создаем объект дисплея
    const oled = new Oled(i2cBus, opts);

// Инициализация дисплея
    oled.clearDisplay(); // Очистка экрана
    oled.turnOnDisplay(); // Включаем дисплей

// Отображение текста на экране
    oled.setCursor(1, 1); // Установка курсора в координаты (x, y)
    oled.writeString(font, 1, 'Hello, I2C Display!', 1, true); // Пишем текст

// Делаем задержку перед очисткой экрана
    setTimeout(() => {
        oled.clearDisplay(); // Очищаем экран через 5 секунд
    }, 5000);
}
module.exports = oled
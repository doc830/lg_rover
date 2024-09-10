const {SerialPort} = require('serialport')
const i2c = require('i2c-bus')
const Oled = require('oled-i2c-bus')
const font = require('oled-font-5x7')

function oled() {
    // Открываем шину I2C
    const i2cBus = i2c.openSync(2); // Убедитесь, что используется правильная I2C шина

// Настройки дисплея
    const opts = {
        width: 128,
        height: 64,
        address: 0x3C // Используйте адрес дисплея без учёта операций (в данном случае 0x78 -> 0x3C)
    };
// Создаем объект дисплея
    const oled = new Oled(i2cBus, opts);
    let sp = "/dev/ttyS1"
    const port = new SerialPort({
        path: sp,
        baudRate: 115200
    })
    // Обработка данных из UART
    port.on('data', (data) => {
        console.log('Получено сообщение:', data.toString()); // Выводим данные в консоль
        oled.clearDisplay(); // Очищаем дисплей перед выводом нового текста
        //oled.setCursor(1, 1); // Установка курсора в координаты (x, y)
        oled.writeString(font, 1, data.toString(), 1, true); // Пишем текст на дисплей
    });

// Обработка ошибок
    port.on('error', (err) => {
        console.error('Ошибка UART:', err.message);
    });


}
module.exports = oled
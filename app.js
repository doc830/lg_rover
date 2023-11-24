const express = require('express')
const config = require ('config')
const app = express()
const http = require('http')
const PORT = config.get('port')
app.use('/api/nav_data', require('./routes/nav_data.routes'))
async function start() {
    try {
        await app.listen(PORT)
        await http.get(config.get('base-host')+'/api/rover/'+'?host='+config.get('self-host')+'&pass='+config.get('pass'),
            (res) => {
            if (res.statusCode !== 200) {
                console.error(`Ошибка подключения к базе: ${res.statusCode}`)
                res.resume()
            }
        })
    } catch (e) {
        console.log('Server error ', e.message)
        process.exit(1)
    }
}
start()




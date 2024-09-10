const express = require('express')
const config = require('config')
const cors = require('cors')
const server = express()
const firmware = require('./firmware/firmware')
const oled = require('./firmware/oled')
async function initialization () {
    await server.listen(config.get('port'))
}
initialization().then(()=>{
    console.log('Server started successfully on port ' + config.get('port') + '!')
    firmware()
    //oled()
}).catch((err)=>{
    console.error('Internal server error', err)
    process.exit(1)
})
server.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization'
}))
server.use("/api/traffic", require("./routes/traffic.routes"))
server.use("/api/weather", require("./routes/weather.routes"))




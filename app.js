const express = require('express')
const config = require('config')
const cors = require('cors')
const server = express()
const firmware = require('./firmware/firmware')
const rs485 = require("./firmware/RS485");
async function initialization () {
    await server.listen(config.get('port'))
}
initialization().then(()=>{
    console.log('Server started successfully on port ' + config.get('port') + '!')
    firmware()
    rs485()
}).catch((err)=>{
    console.error('Internal server error', err)
    process.exit(1)
})
server.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization'
}))
server.use("/api/info", require("./routes/info.routes"))
server.use("/api/traffic", require("./routes/traffic.routes"))
server.use("/api/weather", require("./routes/weather.routes"))





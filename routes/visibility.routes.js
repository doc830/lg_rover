const {Router} = require('express')
const {SerialPort} = require("serialport")
const  {ReadlineParser} = require('@serialport/parser-readline')
const router = Router()

module.exports = router
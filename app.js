const config = require ('config')
const {ReadlineParser} = require('@serialport/parser-readline')
const http = require('http')
const {UBXParser} = require('ubx-parser')
const {SerialPort} = require("serialport")
const ubxParser = new UBXParser
const serialPort = new SerialPort({
    path: config.get('serialPort'),
    baudRate: config.get('baudRate')
})
const nmeaParser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n'  }))
let ubxData = 0
let nmeaData = 0
nmeaParser.on("data", async (msg) => {
    try {
        if (msg.match(/^\$GNGST,(\d{6})+/m)) {
            nmeaData = msg.split(/(\d{6})+/m)[1]
            console.log(nmeaData)
        }
    } catch (e) {
        console.error("ERROR with nmea packet")
    }
})
serialPort.on("data", async (buffer) =>{
    ubxParser.parse(buffer)
})
ubxParser.on("data", async (data)=> {
    ubxData = data
    console.log(ubxData["relPosLength"])
})
setInterval(async ()=>{
    await sendNavData()
},500)
async function sendNavData () {
    let request = await http.request(
        config.get('base-host')+'/api/rover/navigate'
        +'?length='+ubxData["relPosLength"]
        +'&UTC='+nmeaData
        +'&isFix='+ubxData["diffFixOK"]
    )
    request.on('error', ()=> {
        console.log('Error with connection to base')
    })
    request.end()
}



const config = require ('config')
const { exec } = require("child_process")
const {ReadlineParser} = require('@serialport/parser-readline')
const http = require('http')
const ip = require('ip')
const {UBXParser} = require('ubx-parser')
const {SerialPort} = require("serialport")
const fs = require('fs')
const ubxParser = new UBXParser
const serialPort = new SerialPort({
    path: config.get('serialPort'),
    baudRate: config.get('baudRate')
})

serialPort.on('error', ()=> {
    console.log("CANNOT OPEN SERIAL PORT "+config.get('serialPort')+" WITH BAUD RATE "+config.get('baudRate'))
    process.exit(1)
})

//setIP() //ip config og gnss_correction
//sendIP()

const nmeaParser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n'  }))
let ubxData = 0
let nmeaData = 0

nmeaParser.on("data", async (msg) => {
    if (msg.match(/^\$GNGST,(\d{6})+/m)) {
        nmeaData = msg.split(/(\d{6})+/m)[1]
        //console.log(nmeaData)
    }
})

serialPort.on("data", async (buffer) =>{
    ubxParser.parse(buffer)
})

ubxParser.on("data", async (data)=> {
    ubxData = data
    //console.log(ubxData["relPosLength"])
})

setInterval(async ()=>{
    await sendNavData()
},500)

async function sendNavData () {
    let request = await http.request(
        config.get('baseHost')+'/api/rover/navigate'
        +'?length='+ubxData["relPosLength"]
        +'&UTC='+nmeaData
        +'&isFix='+ubxData["diffFixOK"]
        +'&diffSol='+ubxData["diffSoln"]
        +'&carrSol='+ubxData["carrSoln"]
    )
    request.on('error', ()=> {
        console.log('Error with connection to base via '+ config.get('baseHost'))
    })
    request.end()
}
async function setIP () {
    let line = 'ip: ' + ip.address()
     await fs.readFile(config.get('gnssCorrectionCFG'), 'utf8', (err, data) => {
        if (err) {
            console.log(err+" Error with opening gnss_correction configuration file")
            process.exit(1)
        }
        let replaceable = data.split('\n')[15]
        let replaced = data.replace(replaceable, line)
        fs.writeFile(config.get('gnssCorrectionCFG'), replaced,'utf8', (err) => {
            if (err) {
                console.log(err+" Error with writing to gnss_correction configuration file")
                process.exit(1)
            }
        })
    })
    await exec("systemctl restart gnss_correction", (error) => {
        if (error) {
            console.log(`Cannot restart gnss_correction`)
            process.exit(1)
        }
    })
}
async function sendIP () {
    let request = await http.request(config.get('baseHost')+'/api/rover?pass='+config.get('pass'))
    request.on('error', ()=> {
        console.log('Error with connection to base via '+ config.get('baseHost'))
    })
    request.end()
}

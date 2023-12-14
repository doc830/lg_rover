//node modules
const fs = require('fs')
const ip = require('ip')
const http = require('http')
const config = require ('config')
const {UBXParser} = require('ubx-parser')
const {SerialPort} = require("serialport")
const { exec } = require("child_process")
const {ReadlineParser} = require('@serialport/parser-readline')
//logic
//open serial
const serialPort = new SerialPort({
    path: config.get('serialPort'),
    baudRate: config.get('baudRate')
})
//if error
serialPort.on('error', ()=> {
    console.log("CANNOT OPEN SERIAL PORT "+config.get('serialPort')+" WITH BAUD RATE "+config.get('baudRate'))
    process.exit(1)
})
//init UBX parser
const ubxParser = new UBXParser
//catch UBX
serialPort.on("data", async (buffer) =>{
    ubxParser.parse(buffer)
})
//send UBX
ubxParser.on("data", async (data)=> {
    let request = await http.request(
        config.get('iHost')+'/api/rover/ubx'
        +'?itow='+data["iTOW"]
        +'&relPosN='+data["relPosN"]
        +'&relPosE='+data["relPosE"]
        +'&relPosD='+data["relPosD"]
        +'&length='+data["relPosLength"]
        +'&isFix='+data["diffFixOK"]
        +'&diffSol='+data["diffSoln"]
        +'&carrSol='+data["carrSoln"]
    )
    request.on('error', ()=> {
        console.log('Error with connection to investigator via '+ config.get('iHost'))
    })
    request.end()
    console.log(data["relPosLength"])
})
//catch NMEA
const nmeaParser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n'  }))
//send NMEA
nmeaParser.on("data", async (msg) => {
    if (msg.match(/^\$GNGGA,+/m)) {
        msg = msg.split(',')
        let request = await http.request(
            config.get('iHost')+'/api/rover/nmea'
            +'?nTime='+msg[1]
            +'&lat='+msg[2]
            +'&NS='+msg[3]
            +'&lon='+msg[4]
            +'&EW='+msg[5]
        )
        request.on('error', ()=> {
            console.log('Error with connection to investigator via '+ config.get('iHost'))
        })
        request.end()
        console.log(msg)
    }
})
//initialization
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

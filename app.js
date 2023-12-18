//node modules
const http = require('http')
const config = require ('config')
const {UBXParser} = require('ubx-parser')
const {SerialPort} = require("serialport")
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
        +'&r_timestamp='+Date.now()
        +'&roverID='+config.get('roverID')
    )
    request.on('error', ()=> {
        console.log('Error with connection to investigator via '+ config.get('iHost'))
    })
    request.end()
    console.log(data)
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
            +'&r_timestamp='+Date.now()
            +'&roverID='+config.get('roverID')
        )
        request.on('error', ()=> {
            console.log('Error with connection to investigator via '+ config.get('iHost'))
        })
        request.end()
        console.log(msg)
    }
})

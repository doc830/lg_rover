//node modules
const http = require('http')
const config = require ('config')
const {UBXParser} = require('ubx-parser')
const {SerialPort} = require("serialport")
const {ReadlineParser} = require('@serialport/parser-readline')
const fs = require("fs");
let TIMESTAMP = 0
// current date
let date_ob = new Date();
// adjust 0 before single digit date
let date = ("0" + date_ob.getDate()).slice(-2);
// current month
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
// current year
let year = date_ob.getFullYear();
// current hours
let hours = date_ob.getHours();
// current minutes
let minutes = date_ob.getMinutes();
// current seconds
let seconds = date_ob.getSeconds();
//log file name
let file = year + "-" + month + "-" + date + " " + hours + "-" + minutes + "-" + seconds
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
//check the ability for streaming data to file
fs.access('logs/', (err) => {
    if (err) {
        console.log('Directory "logs" is required in "lg_rover" ', err.message);
        process.exit(1)
    }
})
//init write to file stream
const writeableStream = fs.createWriteStream("logs/"+file+".txt")
//init UBX parser
const ubxParser = new UBXParser
//catch UBX
serialPort.on("data", async (buffer) =>{
    TIMESTAMP = Date.now()
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
        +'&r_timestamp='+TIMESTAMP
        +'&roverID='+config.get('roverID')
    )
    request.on('error', ()=> {
        console.log('Error with connection to investigator via '+ config.get('iHost'))
    })
    request.end()
    let ubx = {
        roverID: config.get('roverID'),
        sys_timestamp: TIMESTAMP,
        itow: data["iTOW"],
        relPosN: data["relPosN"],
        relPosE: data["relPosE"],
        relPosD: data["relPosD"],
        length: data["relPosLength"],
        isFix: data["diffFixOK"],
        diffSol: data["diffSoln"],
        carrSol: data["carrSoln"]
    }
    writeableStream.write(JSON.stringify(ubx)+"\n")
    console.log(data)
})
//catch NMEA
const nmeaParser = serialPort.pipe(new ReadlineParser({delimiter: '\r\n'}), ()=>{
    TIMESTAMP = Date.now()
})
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
            +'&r_timestamp='+TIMESTAMP
            +'&roverID='+config.get('roverID')
        )
        request.on('error', ()=> {
            console.log('Error with connection to investigator via '+ config.get('iHost'))
        })
        request.end()
        let nmea = {
            roverID: config.get('roverID'),
            sys_timestamp: TIMESTAMP,
            nTime: msg[1],
            lat: msg[2],
            NS: msg[3],
            lon: msg[4],
            EW: msg[5]
        }
        writeableStream.write(JSON.stringify(nmea)+"\n")
        console.log(msg)
    }
})

//node modules
const http = require('http')
const config = require ('config')
const {UBXParser} = require('ubx-parser')
const {SerialPort} = require("serialport")
const {ReadlineParser} = require('@serialport/parser-readline')
const fs = require("fs");
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
let file = year + "-" + month + "-" + date + " " + hours + "-" + minutes + "-" + seconds
const writeableStream = fs.createWriteStream("logs/"+file+".txt")
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
    let timestamp = Date.now()
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
        +'&r_timestamp='+timestamp
        +'&roverID='+config.get('roverID')
    )
    let ubx = {
        roverID: config.get('roverID'),
        sys_timestamp: timestamp,
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
    let timestamp = Date.now()
    if (msg.match(/^\$GNGGA,+/m)) {
        msg = msg.split(',')
        let request = await http.request(
            config.get('iHost')+'/api/rover/nmea'
            +'?nTime='+msg[1]
            +'&lat='+msg[2]
            +'&NS='+msg[3]
            +'&lon='+msg[4]
            +'&EW='+msg[5]
            +'&r_timestamp='+timestamp
            +'&roverID='+config.get('roverID')
        )
        let nmea = {
            roverID: config.get('roverID'),
            sys_timestamp: timestamp,
            nTime: msg[1],
            lat: msg[2],
            NS: msg[3],
            lon: msg[4],
            EW: msg[5]
        }
        writeableStream.write(JSON.stringify(nmea)+"\n")
        request.on('error', ()=> {
            console.log('Error with connection to investigator via '+ config.get('iHost'))
        })
        request.end()
        console.log(msg)
    }
})

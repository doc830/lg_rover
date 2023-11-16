import { SerialPort } from "serialport";
import { UBXParser } from "ubx-parser";
const serialport = new SerialPort({ path: "/dev/ttyS1", baudRate: 115200 }, () => console.log("port opened"));
const parser = new UBXParser();

serialport.on("data", (buffer) => parser.parse(buffer));
parser.on("data", (data) => console.log(data));
const axios = require('axios')
const config = require("config");
class Devices {
    constructor() {
        this.weather = false
        this.visibility = false
    }
    setVisibility (data) {
        axios.get("http://localhost:2020/api/visibility/info", {

        })
            .then(() => {

            })
            .catch(() => {
            })
    }
    setWeather (data) {
        this.weather = data
    }
}
const devices = new Devices()
module.exports = devices
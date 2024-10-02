const {Router} = require('express')
const axios = require('axios')
const router = Router()
let weather_station_status = false
let visibility_status = false
router.get('/devices', (req, res) => {

    res.json({
        "answer": "ok"
    })
    res.end()
})
router.get('/battery', (req, res) => {
    res.json({
        "answer": "ok"
    })
    res.end()
})

module.exports = router
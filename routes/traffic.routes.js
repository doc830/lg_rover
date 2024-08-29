const {Router} = require('express')
const router = Router()
router.get('/light', (req, res) => {
    res.json({
        "answer": "ok"
    })
    res.end()
})
module.exports = router
const express = require('express')
const ImageOperations = require("../lib/ImageOperations")

const router = express.Router()

router.post("/encrypt-image", async (req, res) => {
    if (req.files.image && req.files.image.size < 32 * 1024 * 1024 &&
        req.body.text && req.body.text.length > 0) {
        const newFile = await ImageOperations.encodeText(req.body.text, req.files.image.path, req.body.includeLength)
        res.sendFile(newFile.path, { headers: { "Content-Type": newFile.mimeType } })
    } else {
        res.status(400)
        const response = {info: "Invalid request"}
        res.json(response)
    }
})

router.post("/decrypt-image", async (req, res) => {
    if (req.files.image && req.files.image.size < 32 * 1024 * 1024) {
        const decodedText = await ImageOperations.decodeText(req.files.image.path, req.body.hasLength)
        res.json({text: decodedText})
    } else {
        res.status(400)
        res.json({info: "Invalid request"})
    }
})

module.exports = router

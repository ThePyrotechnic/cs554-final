const express = require('express')
const ImageOperations = require('../lib/ImageOperations')
const Users = require('../data/users')
const Images = require('../data/images')
const {ObjectID} = require('mongodb')

const router = express.Router()

router.post('/encrypt-image', async (req, res) => {
    if (req.files.image && req.files.image.size < 32 * 1024 * 1024 &&
        req.body.text && req.body.text.length > 0) {
        const newFile = await ImageOperations.encodeText(req.body.text, req.files.image.path, req.body.includeLength)

        if (req.body.uid !== '') {
            try {
                await Users.get(req.body.uid)
            } catch {
                await Users.create(req.body.uid)
            }
            await ImageOperations.store(req.body.uid, newFile.path)
            Users.addImage(newFile.path, req.body.uid, true)
        }

        res.sendFile(newFile.path, {headers: {'Content-Type': newFile.mimeType}})
    } else {
        res.status(400)
        const response = {info: 'Invalid request'}
        res.json(response)
    }
})

router.post('/decrypt-image', async (req, res) => {
    if (req.files.image && req.files.image.size < 32 * 1024 * 1024) {
        const decodedText = await ImageOperations.decodeText(req.files.image.path, req.body.hasLength)
        res.json({text: decodedText})
    } else {
        res.status(400)
        res.json({info: 'Invalid request'})
    }
})

router.post('/user-image-ids', async (req, res) => {
    try {
        const user = await Users.get(req.body.uid)
        res.json(user.images)
    } catch {
        res.status(500)
        const response = {info: 'An error occurred'}
        res.json(response)
    }
})

router.post('/image', async (req, res) => {
    try {
        const user = await Users.get(req.body.uid)
        for (let id of user.images)
            if (id.toString() === req.body.imageId) {
                const mongoImageId = ObjectID(req.body.imageId)
                const image = await Images.get(mongoImageId)
                res.sendFile(image.url, {headers: {'Content-Type': 'image/png'}})
            } else {
                res.status(400)
                const response = {info: 'Invalid request'}
                res.json(response)
            }
    } catch {
        res.status(500)
        const response = {info: 'An error occurred'}
        res.json(response)
    }
})

module.exports = router

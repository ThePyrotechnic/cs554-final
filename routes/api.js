const express = require('express')
const bluebird = require('bluebird')
const redis = require('redis')

const ImageOperations = require('../lib/ImageOperations')
const Users = require('../data/users')
const Images = require('../data/images')
const {ObjectID} = require('mongodb')

const redisClient = redis.createClient();

redisClient.flushall()

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

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
        const imageHash = await ImageOperations.hash(req.files.image.path)
        const responseIsCached = await redisClient.existsAsync(imageHash)

        let decodedText
        if (responseIsCached === 1) {
            decodedText = await redisClient.hgetAsync(imageHash, "text")
        } else {
            decodedText = await ImageOperations.decodeText(req.files.image.path, req.body.hasLength)

            await redisClient.hsetAsync(imageHash, "text", decodedText)
        }
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

router.post('/delete-image', async (req, res) => {
    try {
        const user = await Users.get(req.body.uid)
        const mongoImageId = ObjectID(req.body.imageId)
        await Users.deleteImage(req.body.uid, mongoImageId)
        res.status(200)
        res.json({info: 'Image successfully deleted'})
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
                return
            }
        res.status(400)
        const response = {info: 'Invalid request'}
        res.json(response)
    } catch {
        res.status(500)
        const response = {info: 'An error occurred'}
        res.json(response)
    }
})

module.exports = router

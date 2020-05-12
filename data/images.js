const mongoCollections = require("./collections")
const images = mongoCollections.images

module.exports = {
    async get(id) {
        if (!id) throw "Invalid parameter: ID"

        const imageCollection = await images()

        const image = imageCollection.findOne({"_id": id})
        if (image === null) throw "Unable to find an image with the given ID"

        return image
    },

    async create(url, owner, hasLength) {
        if (!url || !owner || hasLength === null) throw "Invalid parameters"

        let newImage = {
            "url": url,
            "owner": owner,
            "hasLength": hasLength
        }

        const imageCollection = await images()

        const res = await imageCollection.insertOne(newImage)
        if (res.insertedCount === 0) throw "Unable to add image"

        const newId = res.insertedId
        return await this.get(newId)
    },

    async delete(id) {
        if (!id) throw new Error('Invalid parameter: id');

        const imageCollection = await images();
        const res = await imageCollection.findOneAndDelete({'_id':id});
        if (res === null) throw new Error('Unable to find an image with the given id');

        return res.value;
    }
}
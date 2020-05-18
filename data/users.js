const mongoCollections = require("./collections")
const users = mongoCollections.users
const images = require("./images")

module.exports = {
    async get(id) {
        if (!id) throw "Invalid parameter: ID"

        const userCollection = await users()

        const user = await userCollection.findOne({"id": id})
        if (user === null) throw "Unable to find a user with the given ID"

        return user
    },

    async create(id) {
        if (!id) throw "Invalid parameters"

        let newUser = {
            "id": id,
            "images": []
        }

        const userCollection = await users()

        const res = await userCollection.insertOne(newUser)
        if (res.insertedCount === 0) throw "Unable to add user"

        const newId = res.insertedId
        return await this.get(newId)
    },

    async addImage(url, id, hasLength) {
        if (!id || !url || hasLength === null) throw "Invalid parameters"

        await this.get(id)  // This will throw if the ID doesn't exist

        const userCollection = await users()

        const newImage = await images.create(url, id, hasLength)
        const res = await userCollection.updateOne({"id": id}, {$push: {"images": newImage._id}})

        if (res.modifiedCount === 0) throw "Unable to add image to user"
    },

    async deleteImage(id, imageId) {
        if (!id || !imageId) throw "Invalid parameters"

        await this.get(id)  // This will throw if the ID doesn't exist

        const userCollection = await users()
        const res = await userCollection.updateOne({"id": id}, {$pull: {"images": imageId}})
        const newImage = await images.delete(imageId)

        if (res === null) throw "Unable to delete image from user"
    },

    async delete(id) {
        if (!id) throw new Error('Invalid parameter: id');

        const userCollection = await users();
        const res = await userCollection.findOneAndDelete({'id':id});
        if (res === null) throw new Error('Unable to find a user with the given id');

        return res.value;
    }
}
const Jimp = require('jimp')


class TextTooLongError extends Error {
    constructor(message) {
        super(message)
        this.name = 'TextTooLongError'
    }
}

class CharacterError extends Error {
    constructor(message) {
        super(message)
        this.name = 'UnicodeError'
    }
}

module.exports = {
    encodeText: async (text, imagePath, includeLength) => {
        const image = await Jimp.read(imagePath)

        // Text length in bits must be less than the number of pixels multiplied by 3 (3 channels ignoring alpha; RGB)
        // Note: ASCII characters are 7 bits wide but today they are much more commonly treated as 8 bits with a
        //  fixed 8th bit (i.e. UTF-8)
        const minLength = (includeLength === 'true') ? (text.length * 8) + 32 : text.length * 8
        if (minLength > image.bitmap.width * image.bitmap.height * 3) {
            const bitDifference = text.length * 8 - image.bitmap.width * image.bitmap.height * 3
            const remainder = bitDifference % 4
            const pixelsNeeded = (remainder === 0) ? bitDifference / 3 : bitDifference / 3 + 1

            throw new TextTooLongError('Would need ' + pixelsNeeded + ' more pixels to encode this text in the image')
        }

        let bitstring = ''
        for (let a = 0; a < text.length; a++) {
            const currentBString = text.charCodeAt(a).toString(2)
            if (currentBString.length > 8) throw new CharacterError('Character ' + text[a] + 'is not 8 bits wide')

            // Below: will slice the combined string like this (for ASCII char "a"): 000000 | 01100001
            //   and only the right side will be kept, resulting in a fixed 8 bits
            bitstring += ('0000000' + currentBString).slice(-8)
        }

        let currentBitPos = 0
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            // "idx" denotes the current index in the raw bitmap (RGB for every pixel)
            // "a" denotes the current channel in the pixel (R, G, or B)
            for (let a = 0; a < 3; a++) {
                if (currentBitPos === bitstring.length) return

                // even is 0, odd is 1 (so that `channel` mod 2 gives the encoded bit
                if ((image.bitmap.data[idx + a] % 2).toString() !== bitstring[currentBitPos])
                    image.bitmap.data[idx + a] = (image.bitmap.data[idx + a] + 1) % 256  // Wrap from 0 - 255

                currentBitPos++
            }
        })

        if (includeLength === 'true') {  // Do the same thing but with the length of the encoded text at the very end of the image
            currentBitPos = 0
            const lengthString = ('0000000000000000000000000000000' + (text.length).toString(2)).slice(-32)

            const pixelsNeeded = 11  // Need 11 pixels to store 32 bit int (3 channels per pixel)
            const startWidth = image.bitmap.width - (pixelsNeeded % image.bitmap.height)
            const startHeight = image.bitmap.height - Math.floor(pixelsNeeded / image.bitmap.width) - 1
            image.scan(startWidth, startHeight, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                for (let a = 0; a < 3; a++) {
                    if (currentBitPos === lengthString.length) return

                    if ((image.bitmap.data[idx + a] % 2).toString() !== lengthString[currentBitPos])
                        image.bitmap.data[idx + a] = (image.bitmap.data[idx + a] + 1) % 256

                    currentBitPos++
                }
            })
        }

        const lastPeriodIndex = imagePath.lastIndexOf('.')
        const name = imagePath.substr(0, lastPeriodIndex)
        const extension = '.png' /*imagePath.substr(lastPeriodIndex + 1)*/

        const newPath = name + '-encoded' + extension

        await image.writeAsync(newPath)

        return {path: newPath, mimeType: 'image/png'}
    },

    decodeText: async (imagePath, hasLength = 'false') => {
        const image = await Jimp.read(imagePath)

        let length = -1
        if (hasLength === 'true') {
            let currentBitPos = 0
            let lengthString = ''

            const pixelsNeeded = 11  // Need 11 pixels to store 32 bit int (3 channels per pixel)
            const startWidth = image.bitmap.width - (pixelsNeeded % image.bitmap.height)
            const startHeight = image.bitmap.height - Math.floor(pixelsNeeded / image.bitmap.width) - 1
            image.scan(startWidth, startHeight, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                for (let a = 0; a < 3; a++) {
                    if (currentBitPos === 32) return
                    lengthString += (image.bitmap.data[idx + a] % 2).toString()
                    currentBitPos++
                }
            })

            length = parseInt(lengthString, 2)
        }

        let decodedText = ''
        let currentBitPos = 0
        let buffer = ''
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            for (let a = 0; a < 3; a++) {
                if (currentBitPos === length * 8) return  // If length is -1 this will never stop the function early

                buffer += (image.bitmap.data[idx + a] % 2).toString()

                if ((currentBitPos + 1) % 8 === 0) {
                    decodedText += String.fromCharCode(parseInt(buffer, 2))
                    buffer = ''
                }

                currentBitPos++
            }
        })

        return decodedText
    },

    store: async (userId, imagePath) => {
        const image = await Jimp.read(imagePath)

        const newPath = './storage/' + userId + '/' + image.hash() + "." + image.getExtension()
        await image.writeAsync(newPath)

        return newPath
    }
}

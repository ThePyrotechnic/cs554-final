const express = require('express')
const apiRoutes =  require('./api.js')

const constructor = app => {
    app.use(express.json())

    app.use("/api", apiRoutes)

    app.use('*', (req, res) => {
        res.status(404).json({ error: "Not found" })
    })
}

module.exports = constructor

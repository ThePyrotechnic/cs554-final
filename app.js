const express = require("express");
const os = require("os")
const formParser = require("express-form-data")
const configRoutes = require("./routes");

const site = express();

site.use(formParser.parse({uploadDir: os.tmpdir(), autoClean: true}))

configRoutes(site);


site.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});

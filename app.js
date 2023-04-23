const express = require("express");
const app = express();
const { connectDB } = require("./config/database.config")
require("dotenv").config()

const port = process.env.PORT || 5050;

(async () => {
    try {
        await connectDB();
    } catch (err) {
        console.log(err)
    }
    console.log("Successfully connected to database...");
    app.listen(port, () => console.log(`Listening for requests on port ${port}`));
})();
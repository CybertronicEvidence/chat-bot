const { Sequelize } = require("sequelize");
require("dotenv").config()

const { db, db_user, db_pass, db_host } = process.env;

const sequelize = new Sequelize(db, db_user, db_pass, {
    host: db_host,
    dialect: "postgres"
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = { connectDB }

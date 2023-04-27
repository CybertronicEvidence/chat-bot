const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.config");

const Training = sequelize.define(
    'training',
    {
        data: {
            type: DataTypes.STRING
        }
    }
)

module.exports = Training;
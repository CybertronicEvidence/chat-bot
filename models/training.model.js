const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.config");

const Training = sequelize.define(
    'training',
    {
        trainingData: {
            type: DataTypes.STRING
        }
    }
)

module.exports = Training;
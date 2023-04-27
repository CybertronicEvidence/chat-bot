const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.config");

const Training = sequelize.define(
    'training',
    {
        trainingData: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
)

module.exports = Training;
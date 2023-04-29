const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.config");

const Message = sequelize.define(
    'message',
    {
        content: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });


module.exports = Message;




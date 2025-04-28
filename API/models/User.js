const { DataTypes } = require('sequelize');
const Connection = require('../config/database');

const User = Connection.define('User', {
  card1: DataTypes.STRING,
  card2: DataTypes.STRING,
  hand: DataTypes.STRING,
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  firstname: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  balance: {    // 🪙 Added balance field
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1000   // Default starting balance
  }
});

module.exports = User;

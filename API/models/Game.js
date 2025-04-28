const { DataTypes } = require('sequelize');
const Connection = require('../config/database');
const User = require('./User'); // need to access User model

const Game = Connection.define('Game', {
  lobby_code: { type: DataTypes.STRING, unique: true, allowNull: false },
  table_card1: DataTypes.STRING,
  table_card2: DataTypes.STRING,
  table_card3: DataTypes.STRING,
  table_card4: DataTypes.STRING,
  table_card5: DataTypes.STRING
});

// Associations
Game.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Game;

const { DataTypes } = require('sequelize');
const Connection = require('../config/database');
const Game = require('./Game');
const User = require('./User');

const GamePlayer = Connection.define('GamePlayer', {
  chips: { type: DataTypes.INTEGER, defaultValue: 1000 },
  seat_number: DataTypes.INTEGER,
  has_folded: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Associations
GamePlayer.belongsTo(User, { foreignKey: 'user_id' });
GamePlayer.belongsTo(Game, { foreignKey: 'game_id' });

module.exports = GamePlayer;

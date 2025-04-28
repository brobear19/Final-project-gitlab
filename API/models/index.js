const Connection = require('../config/database');
const User = require('./User');
const Game = require('./Game');
const GamePlayer = require('./GamePlayer');

// Set up model associations
User.hasMany(Game, { foreignKey: 'user_id' });
Game.belongsTo(User, { foreignKey: 'user_id' });

Game.hasMany(GamePlayer, { foreignKey: 'game_id' });
GamePlayer.belongsTo(Game, { foreignKey: 'game_id' });

GamePlayer.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(GamePlayer, { foreignKey: 'user_id' });

module.exports = {
  Connection,
  User,
  Game,
  GamePlayer
};

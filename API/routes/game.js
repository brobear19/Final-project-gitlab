const express = require('express');
const { Game, GamePlayer, User } = require('../models');
const router = express.Router();

// Create Game
router.post('/create', async (req, res) => {
  try {
    const { userId, lobbyCode } = req.body;
    const game = await Game.create({ lobby_code: lobbyCode, user_id: userId });
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join Game
router.post('/join', async (req, res) => {
  try {
    const { lobbyCode, userId } = req.body;
    const game = await Game.findOne({ where: { lobby_code: lobbyCode } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const player = await GamePlayer.create({ game_id: game.id, user_id: userId });
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Game Info
router.get('/:lobbyCode', async (req, res) => {
  try {
    const { lobbyCode } = req.params;
    const game = await Game.findOne({
      where: { lobby_code: lobbyCode },
      include: [{ model: GamePlayer, include: [User] }]
    });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

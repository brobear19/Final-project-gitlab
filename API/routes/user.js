const express = require('express');
const { User } = require('../models');
const router = express.Router();

// ✅ Search users by username (partial match)
router.get('/search', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Username query parameter required' });
    }

    const users = await User.findAll({
      where: {
        username: {
          [require('sequelize').Op.like]: `%${username}%`
        }
      },
      attributes: ['id', 'username', 'balance'] // Only return safe fields
    });

    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during user search' });
  }
});

// ✅ Get user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ Update user
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ Get user balance
router.get('/:id/balance', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ balance: user.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Add to balance
router.post('/:id/balance', async (req, res) => {
  try {
    const { amount } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.balance += amount;
    await user.save();

    res.json({ message: 'Balance updated', balance: user.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Withdraw from balance
router.post('/:id/withdraw', async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.balance -= amount;
    await user.save();

    res.json({ message: 'Withdrawal successful', balance: user.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

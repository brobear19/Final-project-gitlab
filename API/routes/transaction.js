const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// 📜 Get all transactions for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.params.userId },
      order: [['timestamp', 'DESC']]
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 📝 Create a new transaction (deposit, withdrawal, win, loss)
router.post('/', async (req, res) => {
  try {
    const { userId, type, amount } = req.body;

    if (!userId || !type || amount === undefined) {
      return res.status(400).json({ error: 'userId, type, and amount are required.' });
    }

    if (!['deposit', 'withdrawal', 'win', 'loss'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type.' });
    }

    const newTransaction = await Transaction.create({
      userId,
      type,
      amount
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

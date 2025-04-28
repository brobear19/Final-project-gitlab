const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  console.log('Received signup request:', req.body);
  try {
    const { username, firstname, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, firstname, email, password: hashedPassword });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid password' });

    const safeUser = {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      email: user.email
    };
    
    res.json(safeUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

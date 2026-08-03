const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST /api/auth/login — the single admin account only (username/password come from .env)
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const validUsername = username === process.env.ADMIN_USERNAME;
  const validPassword = validUsername
    ? await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
    : false;

  if (!validUsername || !validPassword) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;

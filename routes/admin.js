const express = require('express');
const router = express.Router();
const { readUsers } = require('../helpers/storage');

// GET /admin/users
router.get('/users', (req, res) => {
  try {
    const users = readUsers();
    res.json(users || {});
  } catch (err) {
    console.error('Error reading users:', err.message);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

module.exports = router;

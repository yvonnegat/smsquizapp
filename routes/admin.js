const express = require('express');
const router = express.Router();
const { readUsers } = require('../helpers/storage');

// GET /admin/users
router.get('/users', (req, res) => {
  res.json(readUsers());
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getInspiration } = require('../controllers/inspirationController');

// GET /api/inspiration?q=web+design
router.get('/', getInspiration);

module.exports = router;

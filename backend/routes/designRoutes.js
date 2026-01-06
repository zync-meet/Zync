const express = require('express');
const router = express.Router();
const { getBehance, getInspiration } = require('../controllers/inspirationController');

router.get('/behance', getBehance);

// Unified search (Unsplash + Behance)
router.get('/search', getInspiration);

module.exports = router;


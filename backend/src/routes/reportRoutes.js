const express = require('express');
const router = express.Router();
const { getProfitLossReport } = require('../controllers/reportController');

router.get('/profit-loss', getProfitLossReport);

module.exports = router;

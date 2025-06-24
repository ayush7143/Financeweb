const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.get('/categorization', aiController.categorizeExpenses);
router.post('/categorization', aiController.categorizeExpenses);
router.get('/forecast', aiController.getForecast);
router.put('/categorization', aiController.updateCategorization);
router.get('/ask', aiController.askAI); // for streaming (EventSource)
router.post('/ask', aiController.askAI); // for normal POST

module.exports = router;

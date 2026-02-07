const express = require('express');
const TaskController = require('../controllers/taskController');

const router = express.Router();

// Task Creation Routes
router.post('/permanent', TaskController.createPermanentTask);
router.post('/additional', TaskController.createAdditionalTask);

// Task Fetching Routes
router.get('/today/:userId', TaskController.getTodayTasks);
router.get('/history/:userId', TaskController.getTaskHistory);
router.get('/all', TaskController.getAllTasks);

// Task Completion Route
router.post('/complete', TaskController.completeTask);

// Admin/Testing Routes
router.post('/reset', TaskController.performDailyReset);

module.exports = router;
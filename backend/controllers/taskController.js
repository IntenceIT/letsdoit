const TaskService = require('../services/taskService');

class TaskController {
  // Create permanent task
  static async createPermanentTask(req, res) {
    try {
      const { taskName, description, selectedWeekDays, assignedUsers, createdBy } = req.body;

      // Validation
      if (!taskName || !selectedWeekDays || !assignedUsers || !createdBy) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: taskName, selectedWeekDays, assignedUsers, createdBy'
        });
      }

      const result = TaskService.createPermanentTask({
        taskName,
        description,
        selectedWeekDays,
        assignedUsers,
        createdBy
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Create additional task
  static async createAdditionalTask(req, res) {
    try {
      const { taskName, description, selectedDates, assignedUsers, createdBy } = req.body;

      // Validation
      if (!taskName || !selectedDates || !assignedUsers || !createdBy) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: taskName, selectedDates, assignedUsers, createdBy'
        });
      }

      const result = TaskService.createAdditionalTask({
        taskName,
        description,
        selectedDates,
        assignedUsers,
        createdBy
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Get today's tasks for a user
  static async getTodayTasks(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const result = TaskService.getTodayTasks(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Complete a task
  static async completeTask(req, res) {
    try {
      const { userId, taskId, date } = req.body;

      // Validation
      if (!userId || !taskId || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, taskId, date'
        });
      }

      const result = TaskService.completeTask(userId, taskId, date);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Get task history
  static async getTaskHistory(req, res) {
    try {
      const { userId } = req.params;
      const { date } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      if (!date) {
        return res.status(400).json({
          success: false,
          error: 'Date query parameter is required (format: YYYY-MM-DD)'
        });
      }

      const result = TaskService.getTaskHistory(userId, date);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Get all tasks (admin function)
  static async getAllTasks(req, res) {
    try {
      const result = TaskService.getAllTasks();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Manual daily reset (admin function for testing)
  static async performDailyReset(req, res) {
    try {
      const result = TaskService.performDailyReset();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}

module.exports = TaskController;
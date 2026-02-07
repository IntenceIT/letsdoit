const moment = require('moment');
const TaskModels = require('../models/taskModels');

class TaskService {
  // Create permanent task
  static createPermanentTask(taskData) {
    try {
      // Validate weekdays
      if (!taskData.selectedWeekDays || !Array.isArray(taskData.selectedWeekDays)) {
        throw new Error('selectedWeekDays must be an array');
      }

      // Create the task
      const task = TaskModels.createTask({
        name: taskData.taskName,
        description: taskData.description,
        taskType: 'permanent',
        createdBy: taskData.createdBy,
        assignedUsers: taskData.assignedUsers
      });

      // Create permanent schedule
      TaskModels.createPermanentSchedule(task.id, taskData.selectedWeekDays);

      return {
        success: true,
        task,
        message: 'Permanent task created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create additional task
  static createAdditionalTask(taskData) {
    try {
      // Validate dates
      if (!taskData.selectedDates || !Array.isArray(taskData.selectedDates)) {
        throw new Error('selectedDates must be an array');
      }

      const today = moment().format('YYYY-MM-DD');
      
      // Check for past dates
      const pastDates = taskData.selectedDates.filter(date => moment(date).isBefore(today));
      if (pastDates.length > 0) {
        throw new Error('Cannot create tasks for past dates');
      }

      // Create the task
      const task = TaskModels.createTask({
        name: taskData.taskName,
        description: taskData.description,
        taskType: 'additional',
        createdBy: taskData.createdBy,
        assignedUsers: taskData.assignedUsers
      });

      // Create additional schedules
      TaskModels.createAdditionalSchedule(task.id, taskData.selectedDates);

      return {
        success: true,
        task,
        message: 'Additional task created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get today's tasks for a user
  static getTodayTasks(userId) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const todayWeekday = moment().day(); // 0=Sunday, 1=Monday, etc.
      
      const todayTasks = [];

      // Get permanent tasks for today
      const permanentSchedules = TaskModels.getAllPermanentSchedules();
      const todayPermanentSchedules = permanentSchedules.filter(schedule => 
        schedule.weekdays.includes(todayWeekday)
      );

      for (const schedule of todayPermanentSchedules) {
        const task = TaskModels.getTaskById(schedule.taskId);
        if (task && task.assignedUsers.includes(userId)) {
          const completion = TaskModels.getTaskCompletion(userId, task.id, today);
          
          todayTasks.push({
            id: task.id,
            name: task.name,
            description: task.description,
            taskType: 'permanent',
            status: completion ? 'done' : 'pending',
            date: today
          });
        }
      }

      // Get additional tasks for today
      const additionalSchedules = TaskModels.getAdditionalSchedulesByDate(today);
      
      for (const schedule of additionalSchedules) {
        const task = TaskModels.getTaskById(schedule.taskId);
        if (task && task.assignedUsers.includes(userId)) {
          const completion = TaskModels.getTaskCompletion(userId, task.id, today);
          
          todayTasks.push({
            id: task.id,
            name: task.name,
            description: task.description,
            taskType: 'additional',
            status: completion ? 'done' : 'pending',
            date: today
          });
        }
      }

      return {
        success: true,
        tasks: todayTasks,
        date: today
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Complete a task
  static completeTask(userId, taskId, date) {
    try {
      const today = moment().format('YYYY-MM-DD');
      
      // Validate that the date is today
      if (date !== today) {
        throw new Error('Tasks can only be completed for the current date');
      }

      // Check if task exists
      const task = TaskModels.getTaskById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Check if user is assigned to this task
      if (!task.assignedUsers.includes(userId)) {
        throw new Error('User is not assigned to this task');
      }

      // Check if task is scheduled for today
      const isScheduledToday = this.isTaskScheduledForDate(taskId, today);
      if (!isScheduledToday) {
        throw new Error('Task is not scheduled for today');
      }

      // Check if already completed
      const existingCompletion = TaskModels.getTaskCompletion(userId, taskId, date);
      if (existingCompletion) {
        throw new Error('Task already completed for today');
      }

      // Create completion record
      const completion = TaskModels.createTaskCompletion(userId, taskId, date);

      return {
        success: true,
        completion,
        message: 'Task completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get task history for a user and date
  static getTaskHistory(userId, date) {
    try {
      const historyTasks = [];
      const weekday = moment(date).day();

      // Get permanent tasks for the date
      const permanentSchedules = TaskModels.getAllPermanentSchedules();
      const datePermanentSchedules = permanentSchedules.filter(schedule => 
        schedule.weekdays.includes(weekday)
      );

      for (const schedule of datePermanentSchedules) {
        const task = TaskModels.getTaskById(schedule.taskId);
        if (task && task.assignedUsers.includes(userId)) {
          const completion = TaskModels.getTaskCompletion(userId, task.id, date);
          
          historyTasks.push({
            id: task.id,
            name: task.name,
            description: task.description,
            taskType: 'permanent',
            status: completion ? 'done' : 'not_done',
            date: date
          });
        }
      }

      // Get additional tasks for the date
      const additionalSchedules = TaskModels.getAdditionalSchedulesByDate(date);
      
      for (const schedule of additionalSchedules) {
        const task = TaskModels.getTaskById(schedule.taskId);
        if (task && task.assignedUsers.includes(userId)) {
          const completion = TaskModels.getTaskCompletion(userId, task.id, date);
          
          historyTasks.push({
            id: task.id,
            name: task.name,
            description: task.description,
            taskType: 'additional',
            status: completion ? 'done' : 'not_done',
            date: date
          });
        }
      }

      return {
        success: true,
        tasks: historyTasks,
        date: date
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to check if task is scheduled for a specific date
  static isTaskScheduledForDate(taskId, date) {
    const task = TaskModels.getTaskById(taskId);
    if (!task) return false;

    if (task.taskType === 'permanent') {
      const weekday = moment(date).day();
      const schedules = TaskModels.getPermanentSchedulesByTaskId(taskId);
      return schedules.some(schedule => schedule.weekdays.includes(weekday));
    } else if (task.taskType === 'additional') {
      const schedules = TaskModels.getAdditionalSchedulesByTaskId(taskId);
      return schedules.some(schedule => schedule.assignedDate === date);
    }

    return false;
  }

  // Daily reset operation (called by scheduler)
  static performDailyReset() {
    try {
      const today = moment().format('YYYY-MM-DD');
      
      // Reset daily task instances for permanent tasks
      TaskModels.resetDailyTaskInstances(today);
      
      console.log(`✅ Daily reset completed for ${today}`);
      
      return {
        success: true,
        message: `Daily reset completed for ${today}`,
        date: today
      };
    } catch (error) {
      console.error('❌ Daily reset failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all tasks (admin function)
  static getAllTasks() {
    try {
      const allTasks = TaskModels.getAllTasks();
      
      const tasksWithSchedules = allTasks.map(task => {
        let scheduleInfo = {};
        
        if (task.taskType === 'permanent') {
          const schedules = TaskModels.getPermanentSchedulesByTaskId(task.id);
          scheduleInfo.weekdays = schedules.length > 0 ? schedules[0].weekdays : [];
        } else if (task.taskType === 'additional') {
          const schedules = TaskModels.getAdditionalSchedulesByTaskId(task.id);
          scheduleInfo.assignedDates = schedules.map(s => s.assignedDate);
        }
        
        return {
          ...task,
          ...scheduleInfo
        };
      });

      return {
        success: true,
        tasks: tasksWithSchedules
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TaskService;
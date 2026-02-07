const { v4: uuidv4 } = require('uuid');

// In-memory storage (will be replaced with database later)
let tasks = [];
let permanentTaskSchedules = [];
let additionalTaskSchedules = [];
let taskCompletions = [];
let dailyTaskInstances = [];

class TaskModels {
  // Task CRUD operations
  static createTask(taskData) {
    const task = {
      id: uuidv4(),
      name: taskData.name,
      description: taskData.description,
      taskType: taskData.taskType, // 'permanent' or 'additional'
      createdBy: taskData.createdBy,
      createdAt: new Date().toISOString(),
      assignedUsers: taskData.assignedUsers || []
    };
    
    tasks.push(task);
    return task;
  }

  static getAllTasks() {
    return tasks;
  }

  static getTaskById(taskId) {
    return tasks.find(task => task.id === taskId);
  }

  // Permanent Task Schedule operations
  static createPermanentSchedule(taskId, weekdays) {
    const schedule = {
      id: uuidv4(),
      taskId,
      weekdays, // Array of weekday numbers (0=Sunday, 1=Monday, etc.)
      createdAt: new Date().toISOString()
    };
    
    permanentTaskSchedules.push(schedule);
    return schedule;
  }

  static getPermanentSchedulesByTaskId(taskId) {
    return permanentTaskSchedules.filter(schedule => schedule.taskId === taskId);
  }

  static getAllPermanentSchedules() {
    return permanentTaskSchedules;
  }

  // Additional Task Schedule operations
  static createAdditionalSchedule(taskId, assignedDates) {
    const schedules = assignedDates.map(date => ({
      id: uuidv4(),
      taskId,
      assignedDate: date,
      createdAt: new Date().toISOString()
    }));
    
    additionalTaskSchedules.push(...schedules);
    return schedules;
  }

  static getAdditionalSchedulesByDate(date) {
    return additionalTaskSchedules.filter(schedule => schedule.assignedDate === date);
  }

  static getAdditionalSchedulesByTaskId(taskId) {
    return additionalTaskSchedules.filter(schedule => schedule.taskId === taskId);
  }

  // Task Completion operations
  static createTaskCompletion(userId, taskId, completionDate) {
    const completion = {
      id: uuidv4(),
      taskId,
      userId,
      completionDate,
      status: 'done',
      completedAt: new Date().toISOString()
    };
    
    taskCompletions.push(completion);
    return completion;
  }

  static getTaskCompletion(userId, taskId, date) {
    return taskCompletions.find(completion => 
      completion.userId === userId && 
      completion.taskId === taskId && 
      completion.completionDate === date
    );
  }

  static getTaskCompletionsByUserAndDate(userId, date) {
    return taskCompletions.filter(completion => 
      completion.userId === userId && 
      completion.completionDate === date
    );
  }

  static getTaskCompletionsByDate(date) {
    return taskCompletions.filter(completion => completion.completionDate === date);
  }

  // Daily Task Instance operations (for tracking daily task states)
  static createDailyTaskInstance(taskId, userId, date, taskType) {
    const instance = {
      id: uuidv4(),
      taskId,
      userId,
      date,
      taskType,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    dailyTaskInstances.push(instance);
    return instance;
  }

  static getDailyTaskInstances(userId, date) {
    return dailyTaskInstances.filter(instance => 
      instance.userId === userId && 
      instance.date === date
    );
  }

  static updateDailyTaskInstanceStatus(taskId, userId, date, status) {
    const instance = dailyTaskInstances.find(inst => 
      inst.taskId === taskId && 
      inst.userId === userId && 
      inst.date === date
    );
    
    if (instance) {
      instance.status = status;
      instance.updatedAt = new Date().toISOString();
    }
    
    return instance;
  }

  // Reset operations for daily scheduler
  static resetDailyTaskInstances(date) {
    // Remove old daily instances for permanent tasks
    dailyTaskInstances = dailyTaskInstances.filter(instance => 
      !(instance.taskType === 'permanent' && instance.date !== date)
    );
  }

  // Utility methods for data access (useful for debugging)
  static getAllData() {
    return {
      tasks,
      permanentTaskSchedules,
      additionalTaskSchedules,
      taskCompletions,
      dailyTaskInstances
    };
  }

  static clearAllData() {
    tasks = [];
    permanentTaskSchedules = [];
    additionalTaskSchedules = [];
    taskCompletions = [];
    dailyTaskInstances = [];
  }
}

module.exports = TaskModels;
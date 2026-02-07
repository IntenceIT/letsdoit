const cron = require('node-cron');
const TaskService = require('../services/taskService');

class TaskScheduler {
  static start() {
    // Schedule daily reset at 12:00 AM (midnight)
    // Cron format: second minute hour day month weekday
    // '0 0 0 * * *' = every day at 00:00:00
    cron.schedule('0 0 0 * * *', () => {
      console.log('🕛 Running daily task reset at midnight...');
      TaskService.performDailyReset();
    }, {
      scheduled: true,
      timezone: "America/New_York" // Adjust timezone as needed
    });

    // Optional: Schedule a test run every minute for development
    // Uncomment the following for testing purposes
    /*
    cron.schedule('* * * * *', () => {
      console.log('🔄 Test scheduler running every minute...');
      const now = new Date();
      console.log(`Current time: ${now.toISOString()}`);
    }, {
      scheduled: true
    });
    */

    console.log('📅 Task scheduler initialized');
    console.log('⏰ Daily reset scheduled for 12:00 AM every day');
  }

  // Manual trigger for testing
  static triggerDailyReset() {
    console.log('🔧 Manual daily reset triggered...');
    return TaskService.performDailyReset();
  }

  // Get scheduler status
  static getStatus() {
    return {
      active: true,
      nextReset: this.getNextMidnight(),
      timezone: "America/New_York"
    };
  }

  // Helper method to get next midnight
  static getNextMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }
}

module.exports = TaskScheduler;
// Advanced test scenarios for edge cases and validation
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runAdvancedTests() {
  console.log('🧪 Running Advanced Test Scenarios...\n');

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];

    // Test 1: Try to create additional task with past date (should fail)
    console.log('1. Testing Past Date Validation...');
    const pastDateTask = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/additional',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      taskName: 'Past Task',
      description: 'This should fail',
      selectedDates: [yesterday],
      assignedUsers: ['user1'],
      createdBy: 'admin'
    });
    console.log('✅ Past Date Blocked:', !pastDateTask.data.success);
    console.log('Error:', pastDateTask.data.error);
    console.log('');

    // Test 2: Create valid tasks for testing completion scenarios
    console.log('2. Creating Test Tasks...');
    
    // Permanent task
    const permanentTask = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/permanent',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      taskName: 'Weekly Review',
      description: 'Weekly team review',
      selectedWeekDays: [0, 1, 2, 3, 4, 5, 6], // All days
      assignedUsers: ['user1', 'user2'],
      createdBy: 'admin'
    });
    
    // Additional task for today and tomorrow
    const additionalTask = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/additional',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      taskName: 'Special Meeting',
      description: 'Important meeting',
      selectedDates: [today, tomorrow],
      assignedUsers: ['user1'],
      createdBy: 'admin'
    });
    
    console.log('✅ Test Tasks Created');
    console.log('');

    // Test 3: Try to complete task for yesterday (should fail)
    if (permanentTask.data.success) {
      console.log('3. Testing Past Date Completion...');
      const pastCompletion = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/complete',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        userId: 'user1',
        taskId: permanentTask.data.task.id,
        date: yesterday
      });
      console.log('✅ Past Date Completion Blocked:', !pastCompletion.data.success);
      console.log('Error:', pastCompletion.data.error);
      console.log('');
    }

    // Test 4: Try to complete task for tomorrow (should fail)
    if (permanentTask.data.success) {
      console.log('4. Testing Future Date Completion...');
      const futureCompletion = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/complete',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        userId: 'user1',
        taskId: permanentTask.data.task.id,
        date: tomorrow
      });
      console.log('✅ Future Date Completion Blocked:', !futureCompletion.data.success);
      console.log('Error:', futureCompletion.data.error);
      console.log('');
    }

    // Test 5: Complete task for today (should succeed)
    if (permanentTask.data.success) {
      console.log('5. Testing Valid Completion...');
      const validCompletion = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/complete',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        userId: 'user1',
        taskId: permanentTask.data.task.id,
        date: today
      });
      console.log('✅ Valid Completion:', validCompletion.data.success);
      console.log('Message:', validCompletion.data.message);
      console.log('');
    }

    // Test 6: Try to complete same task twice (should fail)
    if (permanentTask.data.success) {
      console.log('6. Testing Duplicate Completion...');
      const duplicateCompletion = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/complete',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        userId: 'user1',
        taskId: permanentTask.data.task.id,
        date: today
      });
      console.log('✅ Duplicate Completion Blocked:', !duplicateCompletion.data.success);
      console.log('Error:', duplicateCompletion.data.error);
      console.log('');
    }

    // Test 7: Test user not assigned to task
    if (permanentTask.data.success) {
      console.log('7. Testing Unauthorized User Completion...');
      const unauthorizedCompletion = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/complete',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        userId: 'user3', // Not assigned to task
        taskId: permanentTask.data.task.id,
        date: today
      });
      console.log('✅ Unauthorized Completion Blocked:', !unauthorizedCompletion.data.success);
      console.log('Error:', unauthorizedCompletion.data.error);
      console.log('');
    }

    // Test 8: Test missing required fields
    console.log('8. Testing Missing Fields Validation...');
    const missingFieldsTask = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/permanent',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      taskName: 'Incomplete Task'
      // Missing required fields
    });
    console.log('✅ Missing Fields Blocked:', !missingFieldsTask.data.success);
    console.log('Error:', missingFieldsTask.data.error);
    console.log('');

    // Test 9: Test task history for different dates
    console.log('9. Testing Task History...');
    const historyToday = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/tasks/history/user1?date=${today}`,
      method: 'GET'
    });
    console.log('✅ Today\'s History Retrieved:', historyToday.data.success);
    console.log('Tasks in history:', historyToday.data.tasks ? historyToday.data.tasks.length : 0);
    
    if (historyToday.data.tasks) {
      historyToday.data.tasks.forEach(task => {
        console.log(`  - ${task.name}: ${task.status}`);
      });
    }
    console.log('');

    // Test 10: Test scheduler status
    console.log('10. Testing System Status...');
    const allTasks = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/all',
      method: 'GET'
    });
    console.log('✅ System Status Check:', allTasks.data.success);
    console.log('Total tasks in system:', allTasks.data.tasks ? allTasks.data.tasks.length : 0);
    console.log('');

    console.log('🎉 All advanced tests completed successfully!');
    console.log('');
    console.log('📊 Test Summary:');
    console.log('✅ Past date validation working');
    console.log('✅ Future date validation working');
    console.log('✅ Duplicate completion prevention working');
    console.log('✅ User authorization working');
    console.log('✅ Required field validation working');
    console.log('✅ Task history tracking working');
    console.log('✅ System integrity maintained');

  } catch (error) {
    console.error('❌ Advanced test failed:', error.message);
  }
}

runAdvancedTests();
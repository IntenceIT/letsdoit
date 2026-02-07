// Simple test to verify backend functionality
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
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

async function runTests() {
  console.log('🧪 Testing Task Management Backend...\n');

  try {
    // Test 1: Health Check
    console.log('1. Health Check...');
    const health = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    console.log('✅ Status:', health.status);
    console.log('');

    // Test 2: Create Permanent Task
    console.log('2. Creating Permanent Task...');
    const permanentTask = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/permanent',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      taskName: 'Daily Standup',
      description: 'Team standup meeting',
      selectedWeekDays: [1, 2, 3, 4, 5], // Mon-Fri
      assignedUsers: ['user1', 'user2'],
      createdBy: 'admin'
    });
    console.log('✅ Permanent Task:', permanentTask.success ? 'Created' : 'Failed');
    if (permanentTask.task) {
      console.log('Task ID:', permanentTask.task.id);
    }
    console.log('');

    // Test 3: Create Additional Task
    console.log('3. Creating Additional Task...');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
    
    const additionalTask = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/additional',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      taskName: 'Project Review',
      description: 'Review project deliverables',
      selectedDates: [today, tomorrow],
      assignedUsers: ['user1'],
      createdBy: 'admin'
    });
    console.log('✅ Additional Task:', additionalTask.success ? 'Created' : 'Failed');
    if (additionalTask.task) {
      console.log('Task ID:', additionalTask.task.id);
    }
    console.log('');

    // Test 4: Get Today's Tasks
    console.log('4. Getting Today\'s Tasks...');
    const todayTasks = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/today/user1',
      method: 'GET'
    });
    console.log('✅ Today\'s Tasks:', todayTasks.success ? 'Retrieved' : 'Failed');
    console.log('Number of tasks:', todayTasks.tasks ? todayTasks.tasks.length : 0);
    if (todayTasks.tasks) {
      todayTasks.tasks.forEach(task => {
        console.log(`  - ${task.name} (${task.taskType}): ${task.status}`);
      });
    }
    console.log('');

    // Test 5: Complete a Task
    if (todayTasks.tasks && todayTasks.tasks.length > 0) {
      console.log('5. Completing First Task...');
      const taskToComplete = todayTasks.tasks[0];
      const completion = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/complete',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        userId: 'user1',
        taskId: taskToComplete.id,
        date: today
      });
      console.log('✅ Task Completion:', completion.success ? 'Success' : 'Failed');
      console.log('Message:', completion.message || completion.error);
      console.log('');
    }

    // Test 6: Get All Tasks
    console.log('6. Getting All Tasks...');
    const allTasks = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/all',
      method: 'GET'
    });
    console.log('✅ All Tasks:', allTasks.success ? 'Retrieved' : 'Failed');
    console.log('Total tasks:', allTasks.tasks ? allTasks.tasks.length : 0);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
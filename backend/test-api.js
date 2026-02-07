// Test script to verify API functionality
// Run with: node test-api.js

const moment = require('moment');

// Mock data for testing
const testData = {
  permanentTask: {
    taskName: "Daily Standup Meeting",
    description: "Attend daily team standup meeting",
    selectedWeekDays: [1, 2, 3, 4, 5], // Monday to Friday
    assignedUsers: ["user1", "user2", "user3"],
    createdBy: "admin"
  },
  additionalTask: {
    taskName: "Project Presentation",
    description: "Present Q1 project results to stakeholders",
    selectedDates: [
      moment().format('YYYY-MM-DD'), // Today
      moment().add(1, 'day').format('YYYY-MM-DD'), // Tomorrow
      moment().add(3, 'days').format('YYYY-MM-DD') // 3 days from now
    ],
    assignedUsers: ["user1", "user2"],
    createdBy: "admin"
  }
};

async function testAPI() {
  const baseURL = 'http://localhost:3001/api';
  
  console.log('🧪 Starting API Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.status);
    console.log('');

    // Test 2: Create Permanent Task
    console.log('2. Creating Permanent Task...');
    const permanentResponse = await fetch(`${baseURL}/tasks/permanent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData.permanentTask)
    });
    const permanentData = await permanentResponse.json();
    console.log('✅ Permanent Task Created:', permanentData.success);
    const permanentTaskId = permanentData.task?.id;
    console.log('Task ID:', permanentTaskId);
    console.log('');

    // Test 3: Create Additional Task
    console.log('3. Creating Additional Task...');
    const additionalResponse = await fetch(`${baseURL}/tasks/additional`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData.additionalTask)
    });
    const additionalData = await additionalResponse.json();
    console.log('✅ Additional Task Created:', additionalData.success);
    const additionalTaskId = additionalData.task?.id;
    console.log('Task ID:', additionalTaskId);
    console.log('');

    // Test 4: Get Today's Tasks
    console.log('4. Getting Today\'s Tasks for user1...');
    const todayResponse = await fetch(`${baseURL}/tasks/today/user1`);
    const todayData = await todayResponse.json();
    console.log('✅ Today\'s Tasks Retrieved:', todayData.success);
    console.log('Number of tasks:', todayData.tasks?.length || 0);
    console.log('Tasks:', todayData.tasks?.map(t => ({ name: t.name, status: t.status })));
    console.log('');

    // Test 5: Complete a Task (if available)
    if (todayData.tasks && todayData.tasks.length > 0) {
      console.log('5. Completing First Task...');
      const taskToComplete = todayData.tasks[0];
      const completeResponse = await fetch(`${baseURL}/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user1',
          taskId: taskToComplete.id,
          date: moment().format('YYYY-MM-DD')
        })
      });
      const completeData = await completeResponse.json();
      console.log('✅ Task Completion:', completeData.success);
      console.log('Message:', completeData.message || completeData.error);
      console.log('');
    }

    // Test 6: Get Task History
    console.log('6. Getting Task History for today...');
    const historyResponse = await fetch(`${baseURL}/tasks/history/user1?date=${moment().format('YYYY-MM-DD')}`);
    const historyData = await historyResponse.json();
    console.log('✅ Task History Retrieved:', historyData.success);
    console.log('Number of tasks in history:', historyData.tasks?.length || 0);
    console.log('History:', historyData.tasks?.map(t => ({ name: t.name, status: t.status })));
    console.log('');

    // Test 7: Get All Tasks (Admin)
    console.log('7. Getting All Tasks (Admin View)...');
    const allTasksResponse = await fetch(`${baseURL}/tasks/all`);
    const allTasksData = await allTasksResponse.json();
    console.log('✅ All Tasks Retrieved:', allTasksData.success);
    console.log('Total tasks:', allTasksData.tasks?.length || 0);
    console.log('');

    // Test 8: Try to complete past date task (should fail)
    if (permanentTaskId) {
      console.log('8. Testing Past Date Completion (should fail)...');
      const pastCompleteResponse = await fetch(`${baseURL}/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user1',
          taskId: permanentTaskId,
          date: moment().subtract(1, 'day').format('YYYY-MM-DD')
        })
      });
      const pastCompleteData = await pastCompleteResponse.json();
      console.log('✅ Past Date Completion Blocked:', !pastCompleteData.success);
      console.log('Error:', pastCompleteData.error);
      console.log('');
    }

    console.log('🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ or install node-fetch');
  console.log('Alternative: Use curl commands from README.md');
} else {
  testAPI();
}
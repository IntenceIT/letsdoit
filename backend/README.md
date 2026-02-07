# Task Management Backend

A comprehensive Node.js + Express backend for managing permanent and additional tasks with automatic scheduling and daily reset functionality.

## 🚀 Features

- **Permanent Tasks**: Recurring tasks that repeat on selected weekdays
- **Additional Tasks**: One-time tasks for specific dates
- **Daily Reset**: Automatic reset of task completion status at midnight
- **Task History**: Complete history tracking for all tasks
- **Date Validation**: Prevents past date task creation and completion
- **RESTful API**: Clean and well-documented API endpoints

## 📋 API Endpoints

### Task Creation
- `POST /api/tasks/permanent` - Create permanent task
- `POST /api/tasks/additional` - Create additional task

### Task Fetching
- `GET /api/tasks/today/:userId` - Get today's tasks for user
- `GET /api/tasks/history/:userId?date=YYYY-MM-DD` - Get task history
- `GET /api/tasks/all` - Get all tasks (admin)

### Task Completion
- `POST /api/tasks/complete` - Mark task as complete

### Admin/Testing
- `POST /api/tasks/reset` - Manual daily reset trigger

## 🛠️ Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📝 API Usage Examples

### Create Permanent Task
```bash
curl -X POST http://localhost:3001/api/tasks/permanent \
  -H "Content-Type: application/json" \
  -d '{
    "taskName": "Daily Standup",
    "description": "Attend daily team standup meeting",
    "selectedWeekDays": [1, 2, 3, 4, 5],
    "assignedUsers": ["user1", "user2"],
    "createdBy": "admin"
  }'
```

### Create Additional Task
```bash
curl -X POST http://localhost:3001/api/tasks/additional \
  -H "Content-Type: application/json" \
  -d '{
    "taskName": "Project Presentation",
    "description": "Present Q1 project results",
    "selectedDates": ["2026-02-10", "2026-02-11"],
    "assignedUsers": ["user1"],
    "createdBy": "admin"
  }'
```

### Get Today's Tasks
```bash
curl http://localhost:3001/api/tasks/today/user1
```

### Complete Task
```bash
curl -X POST http://localhost:3001/api/tasks/complete \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "taskId": "task-uuid-here",
    "date": "2026-02-05"
  }'
```

### Get Task History
```bash
curl "http://localhost:3001/api/tasks/history/user1?date=2026-02-05"
```

## 🏗️ Project Structure

```
backend/
├── app.js                 # Main application entry point
├── package.json          # Dependencies and scripts
├── controllers/          # Request handlers
│   └── taskController.js
├── routes/              # API route definitions
│   └── taskRoutes.js
├── services/            # Business logic
│   └── taskService.js
├── models/              # Data models (in-memory storage)
│   └── taskModels.js
├── scheduler/           # Background job scheduler
│   └── taskScheduler.js
└── README.md           # This file
```

## ⏰ Scheduler Details

The system includes an automatic scheduler that:
- Runs daily at 12:00 AM (midnight)
- Resets completion status for permanent tasks
- Maintains historical records
- Uses `node-cron` for reliable scheduling

## 🔒 Business Rules

### Permanent Tasks
- Must select at least one weekday
- Automatically repeat on selected days
- Reset daily at midnight
- Users can only complete current day tasks

### Additional Tasks
- Cannot be created for past dates
- Only appear on assigned dates
- Remain in history after completion
- Users can only complete current day tasks

### Task Completion
- Only current date tasks can be completed
- Past and future task completion is blocked
- Completion status is preserved in history

## 🚀 Future Enhancements

The backend is designed to be easily extended with:
- Database integration (MongoDB/PostgreSQL)
- User authentication and authorization
- Role-based access control
- Email notifications
- Task assignment workflows
- Advanced reporting and analytics

## 🧪 Testing

The system includes validation for:
- Date restrictions
- User permissions
- Task scheduling logic
- Daily reset functionality

## 📊 Data Models

### Task
- id, name, description, taskType, createdBy, assignedUsers

### Permanent Task Schedule
- taskId, weekdays (array of day numbers)

### Additional Task Schedule
- taskId, assignedDate

### Task Completion
- taskId, userId, completionDate, status

## 🌐 Health Check

Check if the backend is running:
```bash
curl http://localhost:3001/api/health
```

## 📞 Support

For issues or questions, please check the API documentation or contact the development team.
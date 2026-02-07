# Task Management API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Currently, no authentication is required. User identification is handled via `userId` parameters.

## Response Format
All API responses follow this structure:
```json
{
  "success": boolean,
  "message": "string (optional)",
  "error": "string (optional)",
  "data": "object (varies by endpoint)"
}
```

---

## 📋 Endpoints

### 1. Health Check
**GET** `/health`

Check if the backend service is running.

**Response:**
```json
{
  "status": "OK",
  "message": "Task Management Backend is running",
  "timestamp": "2026-02-05T06:34:47.777Z"
}
```

---

### 2. Create Permanent Task
**POST** `/tasks/permanent`

Create a recurring task that repeats on selected weekdays.

**Request Body:**
```json
{
  "taskName": "Daily Standup",
  "description": "Team standup meeting",
  "selectedWeekDays": [1, 2, 3, 4, 5],
  "assignedUsers": ["user1", "user2"],
  "createdBy": "admin"
}
```

**Field Descriptions:**
- `taskName` (string, required): Name of the task
- `description` (string, optional): Task description
- `selectedWeekDays` (array, required): Array of weekday numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
- `assignedUsers` (array, required): Array of user IDs
- `createdBy` (string, required): ID of the user creating the task

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "name": "Daily Standup",
    "description": "Team standup meeting",
    "taskType": "permanent",
    "createdBy": "admin",
    "assignedUsers": ["user1", "user2"],
    "createdAt": "2026-02-05T06:34:47.777Z"
  },
  "message": "Permanent task created successfully"
}
```

---

### 3. Create Additional Task
**POST** `/tasks/additional`

Create a one-time task for specific dates.

**Request Body:**
```json
{
  "taskName": "Project Presentation",
  "description": "Present Q1 results",
  "selectedDates": ["2026-02-05", "2026-02-06"],
  "assignedUsers": ["user1"],
  "createdBy": "admin"
}
```

**Field Descriptions:**
- `taskName` (string, required): Name of the task
- `description` (string, optional): Task description
- `selectedDates` (array, required): Array of dates in YYYY-MM-DD format
- `assignedUsers` (array, required): Array of user IDs
- `createdBy` (string, required): ID of the user creating the task

**Validation Rules:**
- Cannot select past dates
- Dates must be in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "name": "Project Presentation",
    "description": "Present Q1 results",
    "taskType": "additional",
    "createdBy": "admin",
    "assignedUsers": ["user1"],
    "createdAt": "2026-02-05T06:34:47.777Z"
  },
  "message": "Additional task created successfully"
}
```

---

### 4. Get Today's Tasks
**GET** `/tasks/today/:userId`

Get all tasks assigned to a user for the current date.

**Parameters:**
- `userId` (string, required): User ID in the URL path

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "uuid",
      "name": "Daily Standup",
      "description": "Team standup meeting",
      "taskType": "permanent",
      "status": "pending",
      "date": "2026-02-05"
    },
    {
      "id": "uuid",
      "name": "Project Review",
      "description": "Review deliverables",
      "taskType": "additional",
      "status": "done",
      "date": "2026-02-05"
    }
  ],
  "date": "2026-02-05"
}
```

**Task Status Values:**
- `pending`: Task not completed
- `done`: Task completed

---

### 5. Complete Task
**POST** `/tasks/complete`

Mark a task as completed for the current date.

**Request Body:**
```json
{
  "userId": "user1",
  "taskId": "uuid",
  "date": "2026-02-05"
}
```

**Field Descriptions:**
- `userId` (string, required): ID of the user completing the task
- `taskId` (string, required): ID of the task to complete
- `date` (string, required): Date in YYYY-MM-DD format (must be current date)

**Validation Rules:**
- Date must be current date (no past or future completion)
- User must be assigned to the task
- Task must be scheduled for the specified date
- Cannot complete the same task twice on the same date

**Response:**
```json
{
  "success": true,
  "completion": {
    "id": "uuid",
    "taskId": "uuid",
    "userId": "user1",
    "completionDate": "2026-02-05",
    "status": "done",
    "completedAt": "2026-02-05T06:34:47.777Z"
  },
  "message": "Task completed successfully"
}
```

---

### 6. Get Task History
**GET** `/tasks/history/:userId?date=YYYY-MM-DD`

Get task history for a user on a specific date.

**Parameters:**
- `userId` (string, required): User ID in the URL path
- `date` (string, required): Date in YYYY-MM-DD format as query parameter

**Example:**
```
GET /tasks/history/user1?date=2026-02-05
```

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "uuid",
      "name": "Daily Standup",
      "description": "Team standup meeting",
      "taskType": "permanent",
      "status": "done",
      "date": "2026-02-05"
    },
    {
      "id": "uuid",
      "name": "Project Review",
      "description": "Review deliverables",
      "taskType": "additional",
      "status": "not_done",
      "date": "2026-02-05"
    }
  ],
  "date": "2026-02-05"
}
```

**History Status Values:**
- `done`: Task was completed
- `not_done`: Task was not completed

---

### 7. Get All Tasks (Admin)
**GET** `/tasks/all`

Get all tasks in the system (admin function).

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "uuid",
      "name": "Daily Standup",
      "description": "Team standup meeting",
      "taskType": "permanent",
      "createdBy": "admin",
      "assignedUsers": ["user1", "user2"],
      "createdAt": "2026-02-05T06:34:47.777Z",
      "weekdays": [1, 2, 3, 4, 5]
    },
    {
      "id": "uuid",
      "name": "Project Review",
      "description": "Review deliverables",
      "taskType": "additional",
      "createdBy": "admin",
      "assignedUsers": ["user1"],
      "createdAt": "2026-02-05T06:34:47.777Z",
      "assignedDates": ["2026-02-05", "2026-02-06"]
    }
  ]
}
```

---

### 8. Manual Daily Reset (Admin/Testing)
**POST** `/tasks/reset`

Manually trigger the daily reset process (normally runs automatically at midnight).

**Response:**
```json
{
  "success": true,
  "message": "Daily reset completed for 2026-02-05",
  "date": "2026-02-05"
}
```

---

## 🔄 Business Logic

### Permanent Tasks
1. **Creation**: Admin selects weekdays (0-6), task repeats automatically
2. **Daily Reset**: Every midnight, completion status resets
3. **Completion**: Users can only complete tasks for current date
4. **History**: Previous completions are preserved

### Additional Tasks
1. **Creation**: Admin selects specific dates (no past dates allowed)
2. **Expiration**: Tasks only appear on assigned dates
3. **Completion**: Users can only complete tasks for current date
4. **History**: All additional tasks remain in history

### Daily Scheduler
- Runs automatically at 12:00 AM every day
- Resets permanent task completion status
- Maintains historical records
- Uses `node-cron` for reliable scheduling

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: taskName, selectedWeekDays, assignedUsers, createdBy"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Task not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Detailed error message"
}
```

---

## 📝 Example Usage with cURL

### Create Permanent Task
```bash
curl -X POST http://localhost:3001/api/tasks/permanent \
  -H "Content-Type: application/json" \
  -d '{
    "taskName": "Daily Standup",
    "description": "Team standup meeting",
    "selectedWeekDays": [1, 2, 3, 4, 5],
    "assignedUsers": ["user1", "user2"],
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
    "taskId": "your-task-id-here",
    "date": "2026-02-05"
  }'
```

### Get Task History
```bash
curl "http://localhost:3001/api/tasks/history/user1?date=2026-02-05"
```

---

## 🔧 Development Notes

### Data Storage
Currently using in-memory storage. Data will be lost when server restarts. Ready for database integration.

### Timezone
Server uses system timezone. Scheduler timezone can be configured in `scheduler/taskScheduler.js`.

### Testing
Use the provided `simple-test.js` file to test all endpoints:
```bash
node simple-test.js
```

### Future Enhancements
- Database integration (MongoDB/PostgreSQL)
- User authentication
- Role-based access control
- Email notifications
- Advanced reporting
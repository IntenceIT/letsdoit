const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');
const scheduler = require('./scheduler/taskScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Task Management Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Start scheduler
scheduler.start();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Task Management Backend running on port ${PORT}`);
  console.log(`📅 Daily task scheduler is active`);
});

module.exports = app;
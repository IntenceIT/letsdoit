# Task Management Backend - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation Steps

1. **Clone and Navigate**
```bash
cd backend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Edit .env file as needed
```

4. **Start Development Server**
```bash
npm run dev
```

5. **Start Production Server**
```bash
npm start
```

The server will run on `http://localhost:3001`

---

## 🧪 Testing

### Quick Health Check
```bash
curl http://localhost:3001/api/health
```

### Run Comprehensive Tests
```bash
node simple-test.js
```

### Manual API Testing
Use the examples in `API_DOCUMENTATION.md` or import the Postman collection (if created).

---

## 📁 Project Structure

```
backend/
├── app.js                    # Main application entry point
├── package.json             # Dependencies and scripts
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── README.md               # Project documentation
├── API_DOCUMENTATION.md    # Complete API reference
├── DEPLOYMENT_GUIDE.md     # This file
├── simple-test.js          # API testing script
├── controllers/            # Request handlers
│   └── taskController.js
├── routes/                 # API route definitions
│   └── taskRoutes.js
├── services/               # Business logic layer
│   └── taskService.js
├── models/                 # Data models (in-memory)
│   └── taskModels.js
└── scheduler/              # Background job scheduler
    └── taskScheduler.js
```

---

## ⚙️ Configuration

### Environment Variables
```bash
PORT=3001                    # Server port
NODE_ENV=development         # Environment mode
TIMEZONE=America/New_York    # Scheduler timezone
```

### Scheduler Configuration
Edit `scheduler/taskScheduler.js` to modify:
- Reset time (default: midnight)
- Timezone settings
- Additional scheduled tasks

---

## 🔄 Daily Scheduler

The system includes an automatic scheduler that:
- **Runs at**: 12:00 AM (midnight) every day
- **Function**: Resets permanent task completion status
- **Technology**: node-cron
- **Timezone**: Configurable (default: America/New_York)

### Manual Reset (Testing)
```bash
curl -X POST http://localhost:3001/api/tasks/reset
```

---

## 📊 Data Models

### Current Storage
- **Type**: In-memory storage
- **Persistence**: Data lost on server restart
- **Purpose**: Development and testing

### Data Structures
```javascript
// Tasks
{
  id: "uuid",
  name: "string",
  description: "string",
  taskType: "permanent|additional",
  createdBy: "string",
  assignedUsers: ["array"],
  createdAt: "ISO string"
}

// Task Completions
{
  id: "uuid",
  taskId: "uuid",
  userId: "string",
  completionDate: "YYYY-MM-DD",
  status: "done",
  completedAt: "ISO string"
}
```

---

## 🚀 Production Deployment

### Docker Deployment (Recommended)

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

2. **Build and Run**
```bash
docker build -t task-management-backend .
docker run -p 3001:3001 task-management-backend
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start app.js --name "task-backend"
pm2 startup
pm2 save
```

### Systemd Service
```bash
# Create service file
sudo nano /etc/systemd/system/task-backend.service

# Service content:
[Unit]
Description=Task Management Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node app.js
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable task-backend
sudo systemctl start task-backend
```

---

## 🗄️ Database Integration (Future)

### MongoDB Setup
```javascript
// Add to package.json
"mongoose": "^7.0.0"

// Connection example
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL);
```

### PostgreSQL Setup
```javascript
// Add to package.json
"pg": "^8.8.0"
"sequelize": "^6.28.0"

// Connection example
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);
```

---

## 🔒 Security Considerations

### Current State
- No authentication implemented
- CORS enabled for all origins
- Input validation in place
- Date validation prevents past/future manipulation

### Production Recommendations
```javascript
// Add authentication middleware
const jwt = require('jsonwebtoken');

// Add rate limiting
const rateLimit = require('express-rate-limit');

// Add input sanitization
const helmet = require('helmet');

// Configure CORS properly
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000'], // Your frontend URL
  credentials: true
}));
```

---

## 📈 Monitoring & Logging

### Add Logging
```bash
npm install winston
```

### Health Monitoring
```javascript
// Add to app.js
app.get('/api/status', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

---

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Find process using port 3001
netstat -ano | findstr :3001
# Kill process
taskkill /PID <process_id> /F
```

2. **Module Not Found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

3. **Scheduler Not Working**
- Check timezone configuration
- Verify cron syntax
- Check server logs

### Debug Mode
```bash
DEBUG=* npm run dev
```

---

## 📞 Support & Maintenance

### Log Files
- Application logs: Console output
- Error logs: Console error output
- Access logs: Not implemented (add morgan middleware)

### Backup Strategy
- Current: No persistence (in-memory)
- Future: Database backups required

### Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit
npm audit fix
```

---

## 🎯 Performance Optimization

### Current Limitations
- In-memory storage (not scalable)
- No caching layer
- No connection pooling

### Future Improvements
- Database connection pooling
- Redis caching
- Load balancing
- Horizontal scaling

---

## 📋 Checklist for Production

- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] Authentication implemented
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Logging implemented
- [ ] Error handling improved
- [ ] Health checks configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] SSL/TLS certificates installed
- [ ] Security headers added
- [ ] Input validation enhanced
- [ ] API documentation updated

---

## 🔗 Related Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Project README](./README.md)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
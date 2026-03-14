const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Auth middleware
const auth = require('./middleware/auth');

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/orgs/:orgId/sites', auth, require('./routes/sites'));
app.use('/api/v1/orgs/:orgId/sites/:siteId/tasks', auth, require('./routes/tasks'));
app.use('/api/v1/orgs/:orgId/dashboard', auth, require('./routes/dashboard'));
app.use('/api/v1/orgs/:orgId/users', auth, require('./routes/users'));
app.use('/api/v1/notifications', auth, require('./routes/notifications'));

// Health check
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;

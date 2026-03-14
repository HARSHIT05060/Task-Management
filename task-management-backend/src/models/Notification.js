const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['task_assigned', 'task_overdue', 'status_changed', 'comment_mention', 'task_created', 'due_soon'],
    default: 'task_assigned',
  },
  read: { type: Boolean, default: false },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  site_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', default: null },
}, { timestamps: true });

notificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

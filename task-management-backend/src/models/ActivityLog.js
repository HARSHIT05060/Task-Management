const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  field: { type: String },
  old_value: { type: mongoose.Schema.Types.Mixed },
  new_value: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

activityLogSchema.index({ task_id: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

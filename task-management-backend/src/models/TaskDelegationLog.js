const mongoose = require('mongoose');

const taskDelegationLogSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  from_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  delegated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TaskDelegationLog', taskDelegationLogSchema);

const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hours_logged: { type: Number, required: true, min: 0.25 },
  log_date: { type: Date, default: Date.now },
  note: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('TimeLog', timeLogSchema);

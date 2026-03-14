const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completed_at: { type: Date },
});

const taskSchema = new mongoose.Schema({
  site_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  parent_task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  observers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'On Hold', 'In Review', 'Completed', 'Cancelled'],
    default: 'Not Started',
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  start_date: { type: Date, default: null },
  due_date: { type: Date, default: null },
  estimated_hours: { type: Number, default: 0 },
  tags: [{ type: String }],
  checklist: [checklistItemSchema],
  milestone: { type: String, trim: true },
  task_list: { type: String, trim: true },
  completion_percentage: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

taskSchema.index({ site_id: 1, status: 1 });
taskSchema.index({ assignee_id: 1 });
taskSchema.index({ due_date: 1 });

module.exports = mongoose.model('Task', taskSchema);

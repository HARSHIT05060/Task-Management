const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  attachments: [{ name: String, url: String, size: Number }],
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);

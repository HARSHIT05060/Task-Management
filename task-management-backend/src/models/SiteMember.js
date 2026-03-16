const mongoose = require('mongoose');

const siteMemberSchema = new mongoose.Schema({
  site_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  site_role: { type: String, enum: ['manager', 'employee', 'participant', 'observer'], default: 'employee' },
  max_active_tasks: { type: Number, default: 5 },
  current_active_tasks: { type: Number, default: 0 },
}, { timestamps: true });

siteMemberSchema.index({ site_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('SiteMember', siteMemberSchema);

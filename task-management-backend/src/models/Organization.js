const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);

const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  status: { type: String, enum: ['active', 'paused'], default: 'active' },
  description: { type: String, trim: true },
  color: { type: String, default: '#6366f1' },
  health_score: { type: Number, default: 100, min: 0, max: 100 },
}, { timestamps: true });

module.exports = mongoose.model('Site', siteSchema);

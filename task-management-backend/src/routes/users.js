const express = require('express');
const User = require('../models/User');
const SiteMember = require('../models/SiteMember');
const { requireOrgRole } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });

// GET /api/v1/orgs/:orgId/users
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({ org_id: req.params.orgId }).select('-password');
    res.json(users);
  } catch (err) { next(err); }
});

// POST /api/v1/orgs/:orgId/users/invite
router.post('/invite', requireOrgRole('owner', 'admin'), async (req, res, next) => {
  try {
    const { name, email, password, org_role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const user = await User.create({
      name, email, password,
      org_id: req.params.orgId,
      org_role: org_role || 'member',
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
});

// GET /api/v1/orgs/:orgId/users/:userId
router.get('/:userId', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const memberships = await SiteMember.find({ user_id: user._id }).populate('site_id', 'name location status color');
    res.json({ user, memberships });
  } catch (err) { next(err); }
});

module.exports = router;

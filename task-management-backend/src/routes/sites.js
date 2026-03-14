const express = require('express');
const Site = require('../models/Site');
const SiteMember = require('../models/SiteMember');
const User = require('../models/User');
const Task = require('../models/Task');
const { requireOrgRole, requireSiteMember } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });

// GET /api/v1/orgs/:orgId/sites
router.get('/', async (req, res, next) => {
  try {
    const { orgId } = req.params;
    let sites;
    if (['owner', 'admin'].includes(req.user.org_role)) {
      sites = await Site.find({ org_id: orgId });
    } else {
      // Only sites the user is member of
      const memberships = await SiteMember.find({ user_id: req.user._id }).select('site_id');
      const siteIds = memberships.map(m => m.site_id);
      sites = await Site.find({ org_id: orgId, _id: { $in: siteIds } });
    }

    // Enrich with task + member counts
    const enriched = await Promise.all(sites.map(async (site) => {
      const [taskCount, memberCount, overdueTasks, completedTasks] = await Promise.all([
        Task.countDocuments({ site_id: site._id, parent_task_id: null }),
        SiteMember.countDocuments({ site_id: site._id }),
        Task.countDocuments({ site_id: site._id, due_date: { $lt: new Date() }, status: { $nin: ['Completed', 'Cancelled'] } }),
        Task.countDocuments({ site_id: site._id, status: 'Completed' }),
      ]);
      const total = taskCount || 1;
      const healthScore = Math.round(((total - overdueTasks) / total) * 100);
      return { ...site.toObject(), taskCount, memberCount, overdueTasks, completedTasks, healthScore };
    }));

    res.json(enriched);
  } catch (err) { next(err); }
});

// POST /api/v1/orgs/:orgId/sites
router.post('/', requireOrgRole('owner', 'admin'), async (req, res, next) => {
  try {
    const { name, location, status, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const site = await Site.create({ org_id: req.params.orgId, name, location, status, description, color });
    // Auto-add creator as manager
    await SiteMember.create({ site_id: site._id, user_id: req.user._id, site_role: 'manager' });
    res.status(201).json(site);
  } catch (err) { next(err); }
});

// GET /api/v1/orgs/:orgId/sites/:siteId
router.get('/:siteId', requireSiteMember, async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.siteId);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch (err) { next(err); }
});

// PUT /api/v1/orgs/:orgId/sites/:siteId
router.put('/:siteId', requireOrgRole('owner', 'admin'), async (req, res, next) => {
  try {
    const site = await Site.findByIdAndUpdate(req.params.siteId, req.body, { new: true, runValidators: true });
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch (err) { next(err); }
});

// DELETE /api/v1/orgs/:orgId/sites/:siteId
router.delete('/:siteId', requireOrgRole('owner'), async (req, res, next) => {
  try {
    await Site.findByIdAndDelete(req.params.siteId);
    await SiteMember.deleteMany({ site_id: req.params.siteId });
    await Task.deleteMany({ site_id: req.params.siteId });
    res.json({ message: 'Site deleted' });
  } catch (err) { next(err); }
});

// GET /api/v1/orgs/:orgId/sites/:siteId/members
router.get('/:siteId/members', requireSiteMember, async (req, res, next) => {
  try {
    const members = await SiteMember.find({ site_id: req.params.siteId }).populate('user_id', 'name email avatar_color org_role');
    res.json(members);
  } catch (err) { next(err); }
});

// POST /api/v1/orgs/:orgId/sites/:siteId/members
router.post('/:siteId/members', requireOrgRole('owner', 'admin'), async (req, res, next) => {
  try {
    const { user_id, site_role } = req.body;
    const member = await SiteMember.create({ site_id: req.params.siteId, user_id, site_role: site_role || 'employee' });
    await member.populate('user_id', 'name email avatar_color');
    res.status(201).json(member);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'User is already a member' });
    next(err);
  }
});

// PUT /api/v1/orgs/:orgId/sites/:siteId/members/:userId
router.put('/:siteId/members/:userId', requireOrgRole('owner', 'admin'), async (req, res, next) => {
  try {
    const member = await SiteMember.findOneAndUpdate(
      { site_id: req.params.siteId, user_id: req.params.userId },
      { site_role: req.body.site_role },
      { new: true }
    ).populate('user_id', 'name email avatar_color');
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) { next(err); }
});

// DELETE /api/v1/orgs/:orgId/sites/:siteId/members/:userId
router.delete('/:siteId/members/:userId', requireOrgRole('owner', 'admin'), async (req, res, next) => {
  try {
    await SiteMember.findOneAndDelete({ site_id: req.params.siteId, user_id: req.params.userId });
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
});

module.exports = router;

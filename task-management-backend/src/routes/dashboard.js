const express = require('express');
const Task = require('../models/Task');
const Site = require('../models/Site');
const SiteMember = require('../models/SiteMember');
const TimeLog = require('../models/TimeLog');

const router = express.Router({ mergeParams: true });

// GET /api/v1/orgs/:orgId/dashboard
router.get('/', async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const now = new Date();

    const sites = await Site.find({ org_id: orgId });
    const siteIds = sites.map(s => s._id);

    const [totalTasks, overdueTasks, completedTasks, inProgressTasks] = await Promise.all([
      Task.countDocuments({ site_id: { $in: siteIds }, parent_task_id: null }),
      Task.countDocuments({ site_id: { $in: siteIds }, due_date: { $lt: now }, status: { $nin: ['Completed', 'Cancelled'] } }),
      Task.countDocuments({ site_id: { $in: siteIds }, status: 'Completed' }),
      Task.countDocuments({ site_id: { $in: siteIds }, status: 'In Progress' }),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Per-site health
    const siteHealth = await Promise.all(sites.map(async (site) => {
      const [total, overdue, completed, members] = await Promise.all([
        Task.countDocuments({ site_id: site._id, parent_task_id: null }),
        Task.countDocuments({ site_id: site._id, due_date: { $lt: now }, status: { $nin: ['Completed', 'Cancelled'] } }),
        Task.countDocuments({ site_id: site._id, status: 'Completed' }),
        SiteMember.countDocuments({ site_id: site._id }),
      ]);
      const health = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;
      const cRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { site: { _id: site._id, name: site.name, location: site.location, status: site.status, color: site.color }, total, overdue, completed, members, healthScore: health, completionRate: cRate };
    }));

    // Employee utilization: tasks assigned per user across all sites
    const tasksByAssignee = await Task.aggregate([
      { $match: { site_id: { $in: siteIds }, status: { $nin: ['Completed', 'Cancelled'] } } },
      { $group: { _id: '$assignee_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { count: 1, 'user.name': 1, 'user.email': 1, 'user.avatar_color': 1 } },
    ]);

    // Tasks by status (for chart)
    const tasksByStatus = await Task.aggregate([
      { $match: { site_id: { $in: siteIds }, parent_task_id: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $match: { site_id: { $in: siteIds }, parent_task_id: null } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Recent tasks
    const recentTasks = await Task.find({ site_id: { $in: siteIds } })
      .populate('assignee_id', 'name avatar_color')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status priority due_date site_id updatedAt assignee_id');

    res.json({
      kpis: { totalTasks, overdueTasks, completedTasks, inProgressTasks, completionRate, totalSites: sites.length },
      siteHealth,
      tasksByAssignee,
      tasksByStatus,
      tasksByPriority,
      recentTasks,
    });
  } catch (err) { next(err); }
});

module.exports = router;

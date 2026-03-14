const express = require('express');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const TimeLog = require('../models/TimeLog');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { requireSiteMember, requireSiteRole } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });

// Helper: create activity log + notification
async function logActivity(taskId, userId, action, field, oldVal, newVal) {
  await ActivityLog.create({ task_id: taskId, user_id: userId, action, field, old_value: oldVal, new_value: newVal });
}

// GET /api/v1/orgs/:orgId/sites/:siteId/tasks
router.get('/', requireSiteMember, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { status, priority, assignee_id, parent_task_id, search, from, to, page = 1, limit = 100 } = req.query;

    const filter = { site_id: siteId };
    if (parent_task_id === 'null' || parent_task_id === undefined) {
      filter.parent_task_id = null;
    } else if (parent_task_id) {
      filter.parent_task_id = parent_task_id;
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee_id) filter.assignee_id = assignee_id;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (from || to) {
      filter.due_date = {};
      if (from) filter.due_date.$gte = new Date(from);
      if (to) filter.due_date.$lte = new Date(to);
    }

    const tasks = await Task.find(filter)
      .populate('assignee_id', 'name email avatar_color')
      .populate('creator_id', 'name email avatar_color')
      .populate('participants', 'name email avatar_color')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Task.countDocuments(filter);
    res.json({ tasks, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// POST /api/v1/orgs/:orgId/sites/:siteId/tasks
router.post('/', requireSiteMember, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const taskData = { ...req.body, site_id: siteId, creator_id: req.user._id };
    const task = await Task.create(taskData);
    await task.populate([
      { path: 'assignee_id', select: 'name email avatar_color' },
      { path: 'creator_id', select: 'name email avatar_color' },
    ]);
    await logActivity(task._id, req.user._id, 'created task', null, null, task.title);

    // Notify assignee
    if (task.assignee_id && task.assignee_id._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user_id: task.assignee_id._id,
        message: `You were assigned to "${task.title}"`,
        type: 'task_assigned',
        task_id: task._id,
        site_id: siteId,
      });
    }
    res.status(201).json(task);
  } catch (err) { next(err); }
});

// GET /api/v1/orgs/:orgId/sites/:siteId/tasks/:taskId
router.get('/:taskId', requireSiteMember, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignee_id', 'name email avatar_color')
      .populate('creator_id', 'name email avatar_color')
      .populate('participants', 'name email avatar_color')
      .populate('observers', 'name email avatar_color');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Include subtask count and time logged
    const [subtaskCount, timeLogged] = await Promise.all([
      Task.countDocuments({ parent_task_id: task._id }),
      TimeLog.aggregate([{ $match: { task_id: task._id } }, { $group: { _id: null, total: { $sum: '$hours_logged' } } }]),
    ]);
    res.json({ ...task.toObject(), subtaskCount, totalHoursLogged: timeLogged[0]?.total || 0 });
  } catch (err) { next(err); }
});

// PUT /api/v1/orgs/:orgId/sites/:siteId/tasks/:taskId
router.put('/:taskId', requireSiteMember, async (req, res, next) => {
  try {
    const existing = await Task.findById(req.params.taskId);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const updates = req.body;
    const changedFields = Object.keys(updates).filter(k => JSON.stringify(existing[k]) !== JSON.stringify(updates[k]));

    const task = await Task.findByIdAndUpdate(req.params.taskId, updates, { new: true, runValidators: true })
      .populate('assignee_id', 'name email avatar_color')
      .populate('creator_id', 'name email avatar_color');

    for (const field of changedFields) {
      await logActivity(task._id, req.user._id, `updated ${field}`, field, existing[field], task[field]);
    }

    // Notify on status change
    if (updates.status && updates.status !== existing.status) {
      const notifyUser = task.assignee_id?._id?.toString() === req.user._id.toString()
        ? task.creator_id : task.assignee_id;
      if (notifyUser) {
        await Notification.create({
          user_id: notifyUser._id || notifyUser,
          message: `"${task.title}" status changed to ${updates.status}`,
          type: 'status_changed',
          task_id: task._id,
          site_id: task.site_id,
        });
      }
    }

    res.json(task);
  } catch (err) { next(err); }
});

// DELETE /api/v1/orgs/:orgId/sites/:siteId/tasks/:taskId
router.delete('/:taskId', requireSiteRole('manager'), async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.taskId);
    await Task.deleteMany({ parent_task_id: req.params.taskId });
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
});

// GET subtasks
router.get('/:taskId/subtasks', requireSiteMember, async (req, res, next) => {
  try {
    const subtasks = await Task.find({ parent_task_id: req.params.taskId })
      .populate('assignee_id', 'name email avatar_color');
    res.json(subtasks);
  } catch (err) { next(err); }
});

// GET /tasks/:taskId/comments
router.get('/:taskId/comments', requireSiteMember, async (req, res, next) => {
  try {
    const comments = await Comment.find({ task_id: req.params.taskId })
      .populate('user_id', 'name email avatar_color')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) { next(err); }
});

// POST /tasks/:taskId/comments
router.post('/:taskId/comments', requireSiteMember, async (req, res, next) => {
  try {
    const comment = await Comment.create({
      task_id: req.params.taskId,
      user_id: req.user._id,
      body: req.body.body,
    });
    await comment.populate('user_id', 'name email avatar_color');
    await logActivity(req.params.taskId, req.user._id, 'added comment', null, null, comment.body);
    res.status(201).json(comment);
  } catch (err) { next(err); }
});

// GET /tasks/:taskId/activity
router.get('/:taskId/activity', requireSiteMember, async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ task_id: req.params.taskId })
      .populate('user_id', 'name email avatar_color')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) { next(err); }
});

// POST /tasks/:taskId/timelogs
router.post('/:taskId/timelogs', requireSiteMember, async (req, res, next) => {
  try {
    const log = await TimeLog.create({
      task_id: req.params.taskId,
      user_id: req.user._id,
      hours_logged: req.body.hours_logged,
      log_date: req.body.log_date || new Date(),
      note: req.body.note,
    });
    await logActivity(req.params.taskId, req.user._id, `logged ${req.body.hours_logged}h`, 'time', null, req.body.hours_logged);
    res.status(201).json(log);
  } catch (err) { next(err); }
});

// GET /tasks/:taskId/timelogs
router.get('/:taskId/timelogs', requireSiteMember, async (req, res, next) => {
  try {
    const logs = await TimeLog.find({ task_id: req.params.taskId })
      .populate('user_id', 'name email avatar_color')
      .sort({ log_date: -1 });
    res.json(logs);
  } catch (err) { next(err); }
});

module.exports = router;

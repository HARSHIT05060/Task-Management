const express = require('express');
const Notification = require('../models/Notification');

const router = express.Router();

// GET /api/v1/notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id })
      .populate('task_id', 'title')
      .populate('site_id', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user_id: req.user._id, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

// PUT /api/v1/notifications/:id/read
router.put('/:id/read', async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json(notif);
  } catch (err) { next(err); }
});

// PUT /api/v1/notifications/read-all
router.put('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ user_id: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

module.exports = router;

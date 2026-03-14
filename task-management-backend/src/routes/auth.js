const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, orgName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    // Create user first (without org)
    const user = new User({ name, email, password, org_role: 'owner' });
    await user.save();

    // Create org owned by this user
    const org = await Organization.create({
      name: orgName || `${name}'s Organization`,
      owner_id: user._id,
    });

    user.org_id = org._id;
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({ token, user, org });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const org = await Organization.findById(user.org_id);
    const token = signToken(user._id);
    res.json({ token, user, org });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const org = await Organization.findById(req.user.org_id);
  res.json({ user: req.user, org });
});

module.exports = router;

const SiteMember = require('../models/SiteMember');

// requireOrgRole('owner', 'admin') - checks req.user.org_role
const requireOrgRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!roles.includes(req.user.org_role)) {
    return res.status(403).json({ error: 'Insufficient organization permissions' });
  }
  next();
};

// requireSiteRole('manager') - checks SiteMember record for siteId
const requireSiteRole = (...roles) => async (req, res, next) => {
  try {
    const { siteId } = req.params;
    if (!siteId) return next(); // no site context, skip
    // Owners and admins always pass
    if (['owner', 'admin'].includes(req.user.org_role)) return next();
    const member = await SiteMember.findOne({ site_id: siteId, user_id: req.user._id });
    if (!member) return res.status(403).json({ error: 'Not a member of this site' });
    if (!roles.includes(member.site_role)) {
      return res.status(403).json({ error: 'Insufficient site permissions' });
    }
    req.siteMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

// Ensure user is at least a member of the site (any role)
const requireSiteMember = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    if (!siteId) return next();
    if (['owner', 'admin'].includes(req.user.org_role)) return next();
    const member = await SiteMember.findOne({ site_id: siteId, user_id: req.user._id });
    if (!member) return res.status(403).json({ error: 'Not a member of this site' });
    req.siteMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireOrgRole, requireSiteRole, requireSiteMember };

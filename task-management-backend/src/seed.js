const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const Organization = require('./models/Organization');
const Site = require('./models/Site');
const User = require('./models/User');
const SiteMember = require('./models/SiteMember');
const Task = require('./models/Task');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const ActivityLog = require('./models/ActivityLog');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement';

const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

const statuses = ['Not Started', 'In Progress', 'On Hold', 'In Review', 'Completed', 'Cancelled'];
const priorities = ['low', 'medium', 'high', 'critical'];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Organization.deleteMany({}), Site.deleteMany({}), User.deleteMany({}),
    SiteMember.deleteMany({}), Task.deleteMany({}), Comment.deleteMany({}),
    Notification.deleteMany({}), ActivityLog.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Create organization
  const org = await Organization.create({ name: 'Apex Operations', plan: 'pro', owner_id: new mongoose.Types.ObjectId() });

  // Create users
  const hashedPw = await bcrypt.hash('password123', 12);
  const usersData = [
    { name: 'Alex Morgan', email: 'alex@apex.com', org_role: 'owner', avatar_color: avatarColors[0] },
    { name: 'Jordan Lee', email: 'jordan@apex.com', org_role: 'admin', avatar_color: avatarColors[1] },
    { name: 'Sam Rivera', email: 'sam@apex.com', org_role: 'member', avatar_color: avatarColors[2] },
    { name: 'Casey Kim', email: 'casey@apex.com', org_role: 'member', avatar_color: avatarColors[3] },
    { name: 'Morgan Patel', email: 'morgan@apex.com', org_role: 'member', avatar_color: avatarColors[4] },
    { name: 'Taylor Chen', email: 'taylor@apex.com', org_role: 'member', avatar_color: avatarColors[5] },
    { name: 'Riley Johnson', email: 'riley@apex.com', org_role: 'member', avatar_color: avatarColors[6] },
    { name: 'Drew Williams', email: 'drew@apex.com', org_role: 'member', avatar_color: avatarColors[7] },
  ];

  const users = await User.insertMany(
    usersData.map(u => ({ ...u, password: hashedPw, org_id: org._id }))
  );
  org.owner_id = users[0]._id;
  await org.save();
  console.log(`Created ${users.length} users`);

  // Create sites
  const sitesData = [
    { name: 'Headquarters', location: 'New York, NY', color: '#6366f1', description: 'Main office operations hub' },
    { name: 'West Coast Hub', location: 'San Francisco, CA', color: '#8b5cf6', description: 'Product and engineering teams' },
    { name: 'Manufacturing Plant', location: 'Austin, TX', color: '#f59e0b', description: 'Production and QA operations' },
  ];
  const sites = await Site.insertMany(sitesData.map(s => ({ ...s, org_id: org._id, status: 'active' })));
  console.log(`Created ${sites.length} sites`);

  // Assign members to sites
  const memberAssignments = [
    // HQ: users[0,1,2,3]
    { site_id: sites[0]._id, user_id: users[0]._id, site_role: 'manager' },
    { site_id: sites[0]._id, user_id: users[1]._id, site_role: 'manager' },
    { site_id: sites[0]._id, user_id: users[2]._id, site_role: 'employee' },
    { site_id: sites[0]._id, user_id: users[3]._id, site_role: 'employee' },
    // West Coast: users[1,4,5]
    { site_id: sites[1]._id, user_id: users[1]._id, site_role: 'manager' },
    { site_id: sites[1]._id, user_id: users[4]._id, site_role: 'employee' },
    { site_id: sites[1]._id, user_id: users[5]._id, site_role: 'employee' },
    // Plant: users[0,6,7]
    { site_id: sites[2]._id, user_id: users[0]._id, site_role: 'manager' },
    { site_id: sites[2]._id, user_id: users[6]._id, site_role: 'employee' },
    { site_id: sites[2]._id, user_id: users[7]._id, site_role: 'employee' },
  ];
  await SiteMember.insertMany(memberAssignments);
  console.log('Assigned site members');

  // Generate tasks per site
  const taskTemplates = [
    { title: 'Redesign onboarding flow', priority: 'high', status: 'In Progress', estimated_hours: 16, tags: ['design', 'ux'] },
    { title: 'Fix authentication bug in login page', priority: 'critical', status: 'In Progress', estimated_hours: 4, tags: ['bug', 'auth'] },
    { title: 'Write Q2 financial summary report', priority: 'medium', status: 'Not Started', estimated_hours: 8, tags: ['report', 'finance'] },
    { title: 'Set up CI/CD pipeline', priority: 'high', status: 'Completed', estimated_hours: 12, tags: ['devops'] },
    { title: 'Conduct user interviews (5 sessions)', priority: 'medium', status: 'In Review', estimated_hours: 10, tags: ['research', 'ux'] },
    { title: 'Update dependency packages to latest', priority: 'low', status: 'Completed', estimated_hours: 3, tags: ['maintenance'] },
    { title: 'Deploy staging environment', priority: 'high', status: 'Not Started', estimated_hours: 6, tags: ['devops'] },
    { title: 'Create marketing landing page', priority: 'medium', status: 'In Progress', estimated_hours: 20, tags: ['marketing', 'design'] },
    { title: 'Perform SQL database migration', priority: 'critical', status: 'On Hold', estimated_hours: 8, tags: ['database'] },
    { title: 'Code review: API v2 endpoints', priority: 'medium', status: 'In Review', estimated_hours: 5, tags: ['review', 'api'] },
    { title: 'Write integration tests for payment module', priority: 'high', status: 'Not Started', estimated_hours: 14, tags: ['testing'] },
    { title: 'Employee performance review Q1', priority: 'low', status: 'Completed', estimated_hours: 4, tags: ['hr'] },
    { title: 'Plan product roadmap for Q3', priority: 'high', status: 'In Progress', estimated_hours: 10, tags: ['planning'] },
    { title: 'Optimize image assets for web', priority: 'low', status: 'Not Started', estimated_hours: 3, tags: ['performance'] },
    { title: 'Resolve customer support tickets backlog', priority: 'medium', status: 'In Progress', estimated_hours: 6, tags: ['support'] },
  ];

  const allTasks = [];
  for (let sIdx = 0; sIdx < sites.length; sIdx++) {
    const site = sites[sIdx];
    const siteUserIds = memberAssignments.filter(m => m.site_id.toString() === site._id.toString()).map(m => m.user_id);
    const managerIds = memberAssignments.filter(m => m.site_id.toString() === site._id.toString() && m.site_role === 'manager').map(m => m.user_id);
    const creator = managerIds[0];

    for (let i = 0; i < taskTemplates.length; i++) {
      const t = taskTemplates[i];
      const assignee = siteUserIds[i % siteUserIds.length];
      const daysOffset = [-14, -7, -3, -1, 0, 2, 5, 7, 10, 14, 21, 30, -2, 4, 8][i];
      const task = await Task.create({
        ...t,
        site_id: site._id,
        creator_id: creator,
        assignee_id: assignee,
        due_date: daysFromNow(daysOffset),
        start_date: daysFromNow(daysOffset - 7),
        milestone: i < 5 ? 'Phase 1 – Foundation' : i < 10 ? 'Phase 2 – Core Features' : 'Phase 3 – Polish',
        task_list: i < 5 ? 'Backlog' : i < 10 ? 'Sprint 1' : 'Sprint 2',
        checklist: [
          { text: 'Review requirements', completed: t.status !== 'Not Started' },
          { text: 'Implementation', completed: ['In Review', 'Completed'].includes(t.status) },
          { text: 'Testing', completed: t.status === 'Completed' },
        ],
      });
      allTasks.push(task);

      // Add activity log
      await ActivityLog.create({ task_id: task._id, user_id: creator, action: 'created task', new_value: task.title });
    }
  }
  console.log(`Created ${allTasks.length} tasks`);

  // Add some subtasks
  for (let i = 0; i < 6; i++) {
    const parentTask = allTasks[i];
    await Task.create({
      title: `Subtask: ${['Design mockups', 'Backend implementation', 'Write tests', 'Code review', 'Documentation', 'Deploy'][i]}`,
      site_id: parentTask.site_id,
      parent_task_id: parentTask._id,
      creator_id: parentTask.creator_id,
      assignee_id: parentTask.assignee_id,
      status: randomItem(['Not Started', 'In Progress', 'Completed']),
      priority: randomItem(priorities),
      due_date: daysFromNow(i + 1),
    });
  }
  console.log('Created subtasks');

  // Add comments
  const commentBodies = [
    'Just started work on this. Will update by EOD.',
    'Ran into a blocker — waiting for API keys from the DevOps team.',
    'Draft ready for review @manager please check.',
    'All done! Pushing to staging now.',
    'Added more context to the description. Estimated time might increase.',
  ];
  for (let i = 0; i < Math.min(10, allTasks.length); i++) {
    const task = allTasks[i];
    await Comment.create({ task_id: task._id, user_id: task.creator_id, body: commentBodies[i % commentBodies.length] });
  }
  console.log('Created comments');

  // Add notifications for users[2..7]
  const notifMessages = [
    { message: 'You were assigned to "Fix authentication bug in login page"', type: 'task_assigned' },
    { message: '"Deploy staging environment" is due tomorrow', type: 'due_soon' },
    { message: '"Set up CI/CD pipeline" status changed to Completed', type: 'status_changed' },
    { message: 'New comment in "Redesign onboarding flow"', type: 'comment_mention' },
    { message: '"Write Q2 financial summary report" is overdue', type: 'task_overdue' },
  ];
  for (let i = 2; i < users.length; i++) {
    await Notification.create({
      user_id: users[i]._id,
      ...notifMessages[(i - 2) % notifMessages.length],
      task_id: allTasks[(i - 2) % allTasks.length]._id,
      site_id: sites[0]._id,
    });
  }
  console.log('Created notifications');

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Login credentials (all use password: password123)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  usersData.forEach(u => console.log(`  ${u.org_role.padEnd(7)} │ ${u.email}`));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`OrgId: ${org._id}`);

  mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });

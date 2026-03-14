import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, Globe2, ArrowRight } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/Badge';

const STATUS_COLORS = {
  'Not Started': 'var(--text-secondary)', 'In Progress': 'var(--accent)', 'On Hold': 'var(--amber)',
  'In Review': 'var(--purple)', 'Completed': 'var(--green)', 'Cancelled': 'var(--red)'
};

function HealthRing({ score }) {
  const r = 28; const circ = 2 * Math.PI * r;
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)';
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={r} fill="none" stroke="var(--bg-surface3)" strokeWidth={6} />
      <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
        strokeLinecap="round" transform="rotate(-90 36 36)" className="transition-all duration-1000 ease-out" />
      <text x={36} y={40} textAnchor="middle" fill={color} fontSize={13} fontWeight={700}>{score}%</text>
    </svg>
  );
}

export default function DashboardPage() {
  const { org } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    api.get(`/orgs/${org._id}/dashboard`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [org]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm animate-pulse h-28" />
      ))}
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center p-16 text-center text-text-muted mt-12 bg-bg-surface border border-border-default rounded-xl shadow-sm border-dashed">
      <Globe2 size={48} className="opacity-20 mb-4" />
      <h3 className="text-lg font-semibold text-text-secondary">No data available</h3>
      <p className="text-sm mt-1">Wait for teams to start updating tasks.</p>
    </div>
  );

  const { kpis, siteHealth, tasksByAssignee, tasksByStatus, recentTasks } = data;

  const kpiCards = [
    { label: 'Total Tasks', value: kpis.totalTasks, icon: CheckCircle2, color: 'var(--accent)', bg: 'var(--accent-light)', sub: `${kpis.inProgressTasks} in progress` },
    { label: 'Overdue', value: kpis.overdueTasks, icon: AlertCircle, color: 'var(--red)', bg: 'var(--red-light)', sub: 'Need attention' },
    { label: 'Completion Rate', value: `${kpis.completionRate}%`, icon: TrendingUp, color: 'var(--green)', bg: 'var(--green-light)', sub: `${kpis.completedTasks} completed` },
    { label: 'Active Sites', value: kpis.totalSites, icon: Globe2, color: 'var(--purple)', bg: 'var(--purple-light)', sub: 'Across your org' },
  ];

  const statusChartData = tasksByStatus.map(s => ({ name: s._id, value: s.count, color: STATUS_COLORS[s._id] || 'var(--accent)' }));
  const assigneeChartData = tasksByAssignee.filter(a => a.user).map(a => ({ name: a.user?.name?.split(' ')[0] || 'Unknown', tasks: a.count }));

  return (
    <div className="px-8 py-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="title-page">Owner Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time health across all your sites — {org?.name}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm hover:shadow-md hover:border-border-strong transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text-secondary">{label}</span>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg, color }}>
                <Icon size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-text-primary leading-none tracking-tight mb-2" style={label === 'Overdue' && value > 0 ? { color: 'var(--red)' } : {}}>{value}</div>
            <div className="text-xs text-text-tertiary">{sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Site Health */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-bg-surface border border-border-default rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="px-6 py-4 border-b border-border-default bg-bg-surface2/50 flex justify-between items-center">
              <span className="title-section">Site Health Overview</span>
              <button className="btn btn-ghost btn-sm text-accent font-medium hover:text-accent-hover" onClick={() => navigate('/sites')}>View all<ArrowRight size={14} /></button>
            </div>
            <div className="flex flex-col">
              {siteHealth.map(({ site, total, overdue, completed, members, healthScore, completionRate: cRate }) => (
                <div key={site._id} onClick={() => navigate(`/sites/${site._id}`)}
                  className="flex flex-col gap-3 p-6 border-b border-border-default cursor-pointer hover:bg-bg-surface2/40 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: site.color || 'var(--accent)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-text-primary tracking-tight">{site.name}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{site.location} · {members} members · {total} tasks</div>
                      </div>
                    </div>
                    <HealthRing score={healthScore} />
                  </div>
                  <div className="h-1.5 bg-bg-surface3 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-accent transition-all duration-1000 ease-out rounded-full" style={{ width: `${cRate}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>{completed} completed</span>
                    {overdue > 0 && <span className="font-medium text-red">{overdue} overdue</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task by Status pie */}
        <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
          <div className="title-section mb-6">Tasks by Status</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} dataKey="value" paddingAngle={2} stroke="none">
                  {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)' }} itemStyle={{ color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-3 mt-6 pl-4">
            {statusChartData.map(s => (
              <div key={s.name} className="flex items-center gap-2 text-xs text-text-secondary font-medium w-[45%]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.name}: <span className="text-text-primary font-semibold">{s.value}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee utilization */}
        <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
          <div className="title-section mb-6">Employee Workload</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assigneeChartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} width={80} />
                <Tooltip cursor={{ fill: 'var(--bg-surface2)' }} contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }} itemStyle={{ color: 'var(--accent)' }}/>
                <Bar dataKey="tasks" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent tasks */}
        <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm">
          <div className="title-section mb-6">Recent Activity</div>
          <div className="flex flex-col">
            {recentTasks.slice(0, 5).map((task, i) => (
              <div key={task._id} className="px-5 py-3.5 border-b border-border-default flex gap-3 items-center hover:bg-bg-surface2/30 transition-colors cursor-pointer" onClick={() => navigate(`/sites/${task.site_id}/tasks?task=${task._id}`)}>

                <Avatar name={task.assignee_id?.name || 'A'} color={task.assignee_id?.avatar_color} size="sm" />
                <div className="overflow-hidden">
                  <div className="text-sm font-medium text-text-primary truncate">{task.title}</div>
                  <div className="text-xs text-text-tertiary">Updated {new Date(task.updatedAt).toLocaleDateString()}</div>
                </div>
                <div className="shrink-0 pl-2">
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

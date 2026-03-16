import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import Avatar from './ui/Avatar';

export default function ManagerDashboard() {
  const { siteId } = useParams();
  const { org } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org || !siteId) return;
    Promise.all([
      api.get(`/orgs/${org._id}/sites/${siteId}`),
      api.get(`/orgs/${org._id}/sites/${siteId}/members`),
      api.get(`/orgs/${org._id}/sites/${siteId}/tasks`)
    ]).then(([siteRes, membersRes, tasksRes]) => {
      setData({ site: siteRes.data, members: membersRes.data, tasks: tasksRes.data });
    }).catch(() => {
      // Handle error natively
    }).finally(() => setLoading(false));
  }, [org, siteId]);

  if (loading) return (
    <div className="p-8 animate-pulse flex flex-col gap-6">
      <div className="h-10 w-1/3 bg-bg-surface border border-border-default rounded-xl" />
      <div className="h-64 bg-bg-surface border border-border-default rounded-xl" />
    </div>
  );

  if (!data || !data.site) return <div className="p-8 text-center text-text-muted">Manager data not found</div>;

  const { site, members, tasks } = data;

  // Process Workload Heatmap Data
  const activeTasks = tasks.filter(t => !['Completed', 'Cancelled'].includes(t.status));
  
  const workloadData = members.map(m => {
    const assignedTasks = activeTasks.filter(t => t.assignee_id?._id === m.user_id?._id || t.assignee_id === m.user_id?._id);
    const count = assignedTasks.length;
    const capacity = m.max_active_tasks || 5;
    const loadPercent = Math.min(100, Math.round((count / capacity) * 100));
    
    return {
      userId: m.user_id?._id,
      name: m.user_id?.name || 'Unknown',
      avatar: m.user_id?.avatar_color,
      activeCount: count,
      capacity: capacity,
      loadPercent: loadPercent,
      isOverloaded: count >= capacity
    };
  }).sort((a, b) => b.loadPercent - a.loadPercent);

  // Identify Overloaded Staff for Rebalance Wizard
  const overloadedStaff = workloadData.filter(w => w.isOverloaded);

  return (
    <div className="px-8 py-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors -ml-2" onClick={() => navigate(`/sites/${siteId}`)}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="title-page flex items-center gap-2">Manager Overview: {site.name}</h1>
          <p className="text-sm text-text-secondary mt-1">Resource planning & workload rebalancing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workload Heatmap Widget */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm flex flex-col h-full">
            <div className="title-section mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2"><Users size={18} className="text-accent" /> Staff Workload Heatmap</span>
            </div>
            
            <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {workloadData.length === 0 && <p className="text-sm text-text-tertiary">No members found.</p>}
              
              {workloadData.map(member => (
                <div key={member.userId} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} color={member.avatar} size="xs" />
                      <span className="text-sm font-semibold text-text-primary">{member.name}</span>
                    </div>
                    <div className="text-xs font-medium text-text-secondary">
                      <span className={member.isOverloaded ? 'text-red font-bold' : ''}>{member.activeCount}</span> / {member.capacity} tasks
                    </div>
                  </div>
                  
                  {/* Heatmap Bar */}
                  <div className="h-2.5 bg-bg-surface3 rounded-full overflow-hidden w-full ring-1 ring-inset ring-black/5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${member.loadPercent}%`,
                        backgroundColor: member.loadPercent >= 100 ? 'var(--red)' : member.loadPercent >= 75 ? 'var(--amber)' : 'var(--green)'
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rebalance Wizard Suggestions */}
        <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-sm flex flex-col h-full ring-1 ring-amber/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber to-red" />
          
          <div className="title-section mb-4 flex items-center gap-2 text-amber">
            <AlertCircle size={18} /> Rebalance Wizard
          </div>
          
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Staff highlighted below are at or exceeding their maximum concurrent task capacity. Reassign tasks to maintain velocity.
          </p>

          <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
            {overloadedStaff.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border-default rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green shadow-[0_0_10px_var(--green)] animate-pulse" />
                </div>
                <div className="text-sm font-bold text-text-primary">Workloads Balanced</div>
                <div className="text-xs text-text-tertiary mt-1">No staff members are overloaded.</div>
              </div>
            ) : (
              overloadedStaff.map(staff => (
                <div key={staff.userId} className="p-4 bg-bg-surface2/50 border border-amber/30 rounded-lg flex flex-col gap-3 backdrop-blur-sm shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red blur-2xl opacity-10 rounded-full -mr-8 -mt-8 group-hover:opacity-20 transition-opacity" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                       <Avatar name={staff.name} color={staff.avatar} size="sm" />
                       <span className="text-sm font-bold text-text-primary">{staff.name}</span>
                    </div>
                    <span className="text-xs font-bold text-red bg-red/10 px-2 py-0.5 rounded-full border border-red/20">{staff.loadPercent}% Load</span>
                  </div>
                  
                  <button 
                    className="btn btn-secondary btn-sm w-full relative z-10 mt-1 shadow-sm hover:border-text-primary transition-colors"
                    onClick={() => navigate(`/sites/${siteId}/tasks?assignee=${staff.userId}`)}
                  >
                    View active tasks <ArrowRight size={14} className="ml-1 opacity-70" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

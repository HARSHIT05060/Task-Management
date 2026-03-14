import { useMemo } from 'react';
import Avatar from '../ui/Avatar';

export default function WorkloadView({ tasks, members }) {
  const workload = useMemo(() => {
    const map = {};
    members.forEach(m => {
      const uId = m.user_id?._id;
      if (uId) map[uId] = { user: m.user_id, count: 0, hours: 0, critical: 0 };
    });
    map['unassigned'] = { user: { name: 'Unassigned', _id: 'unassigned' }, count: 0, hours: 0, critical: 0 };

    tasks.forEach(task => {
      if (['Completed', 'Cancelled'].includes(task.status)) return;
      const key = task.assignee_id?._id || 'unassigned';
      if (!map[key]) map[key] = { user: task.assignee_id || { name: 'Unknown' }, count: 0, hours: 0, critical: 0 };
      
      map[key].count += 1;
      map[key].hours += (task.estimated_hours || 0);
      if (task.priority === 'critical' || task.priority === 'high') {
         map[key].critical += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [tasks, members]);

  const maxCount = Math.max(...workload.map(w => w.count), 1);
  
  // Adjusted colors for a softer look
  const getColor = (count) => {
    if (count === 0) return 'var(--bg-surface3)';
    if (count < 3) return 'var(--green-light)';
    if (count < 6) return 'var(--amber-light)';
    return 'var(--red-light)';
  };

  const getBorderColor = (count) => {
    if (count === 0) return 'var(--border-default)';
    if (count < 3) return 'var(--green)';
    if (count < 6) return 'var(--amber)';
    return 'var(--red)';
  };

  return (
    <div className="p-6 h-full overflow-y-auto max-w-5xl mx-auto pb-24 custom-scrollbar">
      <div className="bg-bg-surface border border-border-default rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-default bg-bg-surface2/50 flex justify-between items-center">
           <h2 className="title-section">Team Workload Distribution</h2>
           <div className="flex gap-4 text-xs font-medium text-text-secondary">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded shadow-sm" style={{ backgroundColor: 'var(--green-light)', borderColor: 'var(--green)', borderWidth: 1 }}/> Light (1-2)</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded shadow-sm" style={{ backgroundColor: 'var(--amber-light)', borderColor: 'var(--amber)', borderWidth: 1 }}/> Medium (3-5)</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded shadow-sm" style={{ backgroundColor: 'var(--red-light)', borderColor: 'var(--red)', borderWidth: 1 }}/> Heavy (6+)</span>
           </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-surface2/80 border-b border-border-default text-xs tracking-wider font-semibold text-text-tertiary uppercase">
              <th className="px-5 py-3.5 w-64">Team Member</th>
              <th className="px-5 py-3.5 w-24 text-center">Active</th>
              <th className="px-5 py-3.5 w-24 text-center">Critical</th>
              <th className="px-5 py-3.5 w-24 text-center">Est. Hrs</th>
              <th className="px-5 py-3.5">Capacity Heatmap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {workload.map(w => (
              <tr key={w.user._id} className="hover:bg-bg-surface2/40 transition-colors">
                <td className="px-5 py-3.5 flex items-center gap-3">
                  {w.user._id === 'unassigned' ? (
                     <div className="w-8 h-8 rounded-full border border-dashed border-border-strong flex items-center justify-center bg-bg-surface2 text-text-tertiary shrink-0">?</div>
                  ) : (
                     <Avatar name={w.user.name} color={w.user.avatar_color} size="md" />
                  )}
                  <span className="font-semibold text-text-primary text-sm truncate">{w.user.name}</span>
                </td>
                <td className="px-5 py-3.5 text-center font-mono text-sm text-text-secondary">{w.count}</td>
                <td className="px-5 py-3.5 text-center font-mono text-sm">
                   {w.critical > 0 ? <span className="text-red font-bold">{w.critical}</span> : <span className="text-text-tertiary">0</span>}
                </td>
                <td className="px-5 py-3.5 text-center font-mono text-sm text-text-secondary">{w.hours}h</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1 h-8">
                     {Array.from({ length: Math.min(10, Math.max(5, w.count)) }).map((_, i) => (
                        <div key={i} className="flex-1 rounded-sm border opacity-90 transition-all duration-300 shadow-sm"
                           style={{
                              backgroundColor: i < w.count ? getColor(w.count) : 'var(--bg-surface2)',
                              borderColor: i < w.count ? getBorderColor(w.count) : 'var(--border-default)',
                             opacity: i < w.count ? 1 : 0.3
                           }} 
                        />
                     ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

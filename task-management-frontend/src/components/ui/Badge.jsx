export function StatusBadge({ status }) {
  const styles = {
    'Not Started': 'bg-bg-surface3 text-text-secondary border border-border-default',
    'In Progress': 'bg-accent-light text-accent-text border border-accent/20',
    'On Hold': 'bg-amber-light text-amber-text border border-amber/20',
    'In Review': 'bg-purple-light text-purple-text border border-purple/20',
    'Completed': 'bg-green-light text-green-text border border-green/20',
    'Cancelled': 'bg-red-light text-red-text border border-red/20',
  };
  const style = styles[status] || styles['Not Started'];
  return (
    <span key={status} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-transform hover:scale-105 animate-in zoom-in duration-300 ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 mr-1 shadow-sm" />
      {status || 'Unknown'}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    low: 'bg-bg-surface3 text-text-secondary',
    medium: 'bg-accent-light text-accent-text',
    high: 'bg-amber-light text-amber-text',
    critical: 'bg-red-light text-red-text',
  };
  const style = styles[priority] || styles.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${style}`}>
      {priority || 'Medium'}
    </span>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    owner: 'bg-purple-light text-purple-text border border-purple/20',
    admin: 'bg-accent-light text-accent-text border border-accent/20',
    member: 'bg-bg-surface3 text-text-secondary border border-border-default',
    manager: 'bg-teal-light text-teal-text border border-teal/20',
    employee: 'bg-green-light text-green-text border border-green/20',
    participant: 'bg-amber-light text-amber-text border border-amber/20',
    observer: 'bg-bg-surface3 text-text-secondary border border-border-default',
  };
  const style = styles[role] || styles.member;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider ${style}`}>
      {role}
    </span>
  );
}

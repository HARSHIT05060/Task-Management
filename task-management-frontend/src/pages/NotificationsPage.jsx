import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Bell, CheckCheck } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

const TYPE_LABELS = {
  task_assigned:   { label: 'Assigned', color: 'var(--accent)',  bg: 'var(--accent-light)'  },
  task_overdue:    { label: 'Overdue',  color: 'var(--red)',     bg: 'var(--red-light)'     },
  status_changed:  { label: 'Status',   color: 'var(--purple)',  bg: 'var(--purple-light)'  },
  comment_mention: { label: 'Mention',  color: 'var(--amber)',   bg: 'var(--amber-light)'   },
  task_created:    { label: 'New Task', color: 'var(--green)',   bg: 'var(--green-light)'   },
  due_soon:        { label: 'Due Soon', color: 'var(--amber)',   bg: 'var(--amber-light)'   },
};

export default function NotificationsPage() {
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/notifications').then(r => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setData(prev => ({ ...prev, unreadCount: 0, notifications: prev.notifications.map(n => ({ ...n, read: true })) }));
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setData(prev => ({
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - 1),
      notifications: prev.notifications.map(n => n._id === id ? { ...n, read: true } : n),
    }));
  };

  if (loading) return (
    <div className="px-8 py-6 flex items-center justify-center mt-16">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="px-8 py-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="title-page">Notifications</h1>
          <p className="text-sm text-text-secondary mt-1">
            {data.unreadCount > 0
              ? <><span className="font-semibold text-accent">{data.unreadCount}</span> unread</>
              : 'All caught up'}
          </p>
        </div>
        {data.unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <CheckCheck size={14} />Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="bg-bg-surface border border-border-default rounded-xl shadow-sm overflow-hidden max-w-2xl">
        {data.notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bg-surface2 border border-border-default flex items-center justify-center mb-4">
              <Bell size={28} className="text-text-tertiary opacity-60" />
            </div>
            <h3 className="text-base font-semibold text-text-secondary">You're all caught up!</h3>
            <p className="text-sm text-text-tertiary mt-1">No notifications yet.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border-default">
            {data.notifications.map(n => {
              const typeInfo = TYPE_LABELS[n.type] || { label: n.type, color: 'var(--text-secondary)', bg: 'var(--bg-surface2)' };
              return (
                <div
                  key={n._id}
                  className={`flex gap-4 items-start px-5 py-4 transition-colors ${!n.read ? 'bg-accent/[0.03] cursor-pointer hover:bg-accent/[0.06]' : 'hover:bg-bg-surface2/40'}`}
                  onClick={() => !n.read && markRead(n._id)}
                >
                  {/* Icon bubble */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: typeInfo.bg }}
                  >
                    <Bell size={16} style={{ color: typeInfo.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: typeInfo.bg, color: typeInfo.color }}
                      >
                        {typeInfo.label}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-accent shrink-0" title="Unread" />
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${n.read ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1.5">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

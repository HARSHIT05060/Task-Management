import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { formatDateStrict, formatDateTimeStrict } from '../../lib/utils';
import { X, Send, Clock, Timer, CheckSquare, Activity, MessageSquare, User, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import Avatar from '../ui/Avatar';
import ConfirmationModal from '../ui/ConfirmationModal';
import { toast } from 'sonner';

const STATUSES   = ['Not Started', 'In Progress', 'On Hold', 'In Review', 'Completed', 'Cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function TaskDetailSection({ title, children }) {
  return (
    <div className="flex flex-col gap-3 py-5 border-b border-border-default last:border-0 relative">
      <div className="text-sm font-semibold text-text-primary tracking-tight">{title}</div>
      {children}
    </div>
  );
}

export default function TaskDetailPanel({ task, siteId, orgId, members, onClose, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState('details');
  const [comments, setComments] = useState([]);
  const [timelogs, setTimelogs]  = useState([]);
  const [activity, setActivity]  = useState([]);
  const [newComment, setNewComment] = useState('');
  const [logHours, setLogHours]  = useState('');
  const [logNote, setLogNote]    = useState('');
  const [subtasks, setSubtasks]  = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [saving, setSaving]      = useState(false);
  const [localTask, setLocalTask] = useState(task);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { setLocalTask(task); }, [task]);

  useEffect(() => {
    const base = `/orgs/${orgId}/sites/${siteId}/tasks/${task._id}`;
    api.get(`${base}/comments`).then(r => setComments(r.data));
    api.get(`${base}/subtasks`).then(r => setSubtasks(r.data));
  }, [task._id, orgId, siteId]);

  useEffect(() => {
    if (activeTab === 'timelog') api.get(`/orgs/${orgId}/sites/${siteId}/tasks/${task._id}/timelogs`).then(r => setTimelogs(r.data));
    if (activeTab === 'activity') api.get(`/orgs/${orgId}/sites/${siteId}/tasks/${task._id}/activity`).then(r => setActivity(r.data));
  }, [activeTab, task._id, orgId, siteId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const patchTask = async (updates) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/orgs/${orgId}/sites/${siteId}/tasks/${task._id}`, updates);
      setLocalTask(prev => ({ ...prev, ...data }));
      onUpdate(data);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    const { data } = await api.post(`/orgs/${orgId}/sites/${siteId}/tasks/${task._id}/comments`, { body: newComment });
    setComments(prev => [...prev, data]);
    setNewComment('');
    toast.success('Comment added');
  };

  const postTimeLog = async () => {
    if (!logHours || isNaN(logHours)) return;
    const { data } = await api.post(`/orgs/${orgId}/sites/${siteId}/tasks/${task._id}/timelogs`, { hours_logged: parseFloat(logHours), note: logNote });
    setTimelogs(prev => [data, ...prev]);
    setLogHours(''); setLogNote('');
    toast.success(`Logged ${logHours}h`);
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const { data } = await api.post(`/orgs/${orgId}/sites/${siteId}/tasks`, { title: newSubtask, parent_task_id: task._id });
    setSubtasks(prev => [...prev, data]);
    setNewSubtask('');
  };

  const toggleChecklist = async (idx) => {
    const updated = localTask.checklist.map((item, i) => i === idx ? { ...item, completed: !item.completed } : item);
    await patchTask({ checklist: updated });
  };

  const handleDeleteTask = async () => {
    try {
      await api.delete(`/orgs/${orgId}/sites/${siteId}/tasks/${task._id}`);
      toast.success('Task deleted');
      onDelete(task._id);
      onClose();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const memberOptions = members.map(m => m.user_id).filter(Boolean);
  const tabs = [
    { id: 'details',  label: 'Details',  Icon: User },
    { id: 'comments', label: 'Comments', Icon: MessageSquare, badge: comments.length },
    { id: 'timelog',  label: 'Timelog',  Icon: Timer },
    { id: 'activity', label: 'Activity', Icon: Activity },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-bg-surface shadow-[0_0_40px_rgba(0,0,0,0.1)] z-50 flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-border-default">
        {/* Header */}
        <div className="p-6 pb-2 shrink-0 border-b border-border-default bg-bg-surface2/50 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-text-tertiary mb-1.5 uppercase tracking-wider">Task #{task._id?.slice(-8)}</div>
              <div className="text-xl font-bold text-text-primary leading-snug">{localTask.title}</div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <StatusBadge status={localTask.status} />
                <PriorityBadge priority={localTask.priority} />
                {localTask.milestone && <span className="text-xs font-medium text-text-secondary bg-bg-surface3 px-2 py-0.5 rounded-full">{localTask.milestone}</span>}
              </div>
            </div>
            <div className="flex gap-1 -mt-2 -mr-2">
              <button className="p-2 text-text-tertiary hover:text-red hover:bg-bg-surface3 rounded-lg transition-colors" onClick={() => setShowDeleteConfirm(true)} title="Delete Task">
                <Trash2 size={18} />
              </button>
              <button className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-surface3 rounded-lg transition-colors" onClick={onClose} title="Close (Esc)">
                <X size={20} />
              </button>
            </div>
          </div>

           {/* Tabs */}
          <div className="flex items-center gap-6 mt-6 overflow-x-auto scrollbar-none hide-scrollbar">
            {tabs.map(({ id, label, Icon, badge }) => (
              <button key={id} className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === id ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`} onClick={() => setActiveTab(id)}>
                <Icon size={14} />{label}
                {badge !== undefined && badge > 0 && (
                  <span className="ml-1 bg-bg-surface3 text-text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="flex flex-col gap-2">
              <TaskDetailSection title="Properties">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Status</label>
                    <select className="select py-2" value={localTask.status} onChange={e => patchTask({ status: e.target.value })} disabled={saving}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Priority</label>
                    <select className="select py-2" value={localTask.priority} onChange={e => patchTask({ priority: e.target.value })} disabled={saving}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Assignee</label>
                    <select className="select py-2" value={localTask.assignee_id?._id || localTask.assignee_id || ''} onChange={e => patchTask({ assignee_id: e.target.value || null })}>
                      <option value="">Unassigned</option>
                      {memberOptions.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Estimate (hrs)</label>
                    <input className="input py-2" type="number" min="0" step="0.5" value={localTask.estimated_hours || ''}
                      onChange={e => patchTask({ estimated_hours: parseFloat(e.target.value) || 0 })} placeholder="0" />
                  </div>
                </div>
              </TaskDetailSection>

              <TaskDetailSection title="Timeline">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Start date</label>
                    <input className="input py-2" type="date" value={localTask.start_date ? format(new Date(localTask.start_date), 'yyyy-MM-dd') : ''}
                      onChange={e => patchTask({ start_date: e.target.value || null })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Due date</label>
                    <input className="input py-2" type="date" value={localTask.due_date ? format(new Date(localTask.due_date), 'yyyy-MM-dd') : ''}
                      onChange={e => patchTask({ due_date: e.target.value || null })} />
                  </div>
                </div>
              </TaskDetailSection>

              <TaskDetailSection title="Description">
                <textarea className="textarea min-h-[120px] resize-y" defaultValue={localTask.description}
                  onBlur={e => patchTask({ description: e.target.value })}
                  placeholder="Add a detailed description..." />
              </TaskDetailSection>

              <TaskDetailSection title="Checklist">
                 {localTask.checklist?.length === 0 && <span className="text-sm text-text-tertiary">No checklist items</span>}
                {(localTask.checklist || []).map((item, i) => (
                  <label key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg-surface2 transition-colors cursor-pointer group">
                    <input type="checkbox" className="mt-1 flex-shrink-0" checked={item.completed} onChange={() => toggleChecklist(i)} />
                    <span className={`text-sm leading-snug transition-colors ${item.completed ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{item.text}</span>
                  </label>
                ))}
              </TaskDetailSection>

              <TaskDetailSection title="Subtasks">
                <div className="flex flex-col gap-2">
                  {subtasks.map(st => (
                    <div key={st._id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border-default bg-bg-surface2 hover:border-border-strong transition-colors">
                      <StatusBadge status={st.status} />
                      <span className="text-sm font-medium text-text-primary flex-1 min-w-0 truncate">{st.title}</span>
                      {st.assignee_id && <Avatar name={st.assignee_id.name} color={st.assignee_id.avatar_color} size="sm" />}
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input className="input py-2 flex-1 shadow-sm" placeholder="Add a subtask..." value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSubtask()} />
                    <button className="btn btn-secondary shadow-sm" onClick={addSubtask}><Plus size={16} /></button>
                  </div>
                </div>
              </TaskDetailSection>
            </div>
          )}

          {/* COMMENTS TAB */}
          {activeTab === 'comments' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 flex flex-col gap-5 mb-6">
                {comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-10 text-center text-text-tertiary border-2 border-dashed border-border-default rounded-xl">
                    <MessageSquare size={32} className="opacity-40 mb-3" />
                    <div className="text-sm font-medium">No comments yet</div>
                    <div className="text-xs mt-1">Start the conversation below</div>
                  </div>
                )}
                {comments.map(c => (
                  <div key={c._id} className="flex gap-3 relative group">
                    <Avatar name={c.user_id?.name} color={c.user_id?.avatar_color} size="sm" />
                    <div className="flex-1 bg-bg-surface2 rounded-xl rounded-tl-sm p-4 border border-border-default shadow-sm border-l-2 border-l-border-strong">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-text-primary">{c.user_id?.name}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">{formatDateTimeStrict(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="shrink-0 bg-bg-surface sticky bottom-0 pt-2 border-t border-border-default">
                <textarea className="textarea min-h-[80px] mb-3" placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                <div className="flex justify-end">
                  <button className="btn btn-primary shadow-sm" onClick={postComment} disabled={!newComment.trim()}>
                    <Send size={14} />Post Comment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TIMELOG TAB */}
          {activeTab === 'timelog' && (
            <div className="flex flex-col gap-6">
              <div className="bg-bg-surface2 p-5 rounded-xl border border-border-default shadow-sm">
                <div className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Timer size={16} className="text-accent" /> Log Work Time
                </div>
                <div className="grid sm:grid-cols-[100px_1fr] gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Hours</label>
                    <input className="input py-2" type="number" min="0.25" step="0.25" placeholder="0.5" value={logHours} onChange={e => setLogHours(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Note (optional)</label>
                    <input className="input py-2" placeholder="What did you work on?" value={logNote} onChange={e => setLogNote(e.target.value)} />
                  </div>
                </div>
                <button className="btn btn-primary mt-4 w-full shadow-sm" onClick={postTimeLog} disabled={!logHours}>
                  Log Time
                </button>
              </div>

              <div>
                <div className="text-sm font-semibold text-text-primary mb-3">Time Entries</div>
                {timelogs.length === 0 && <p className="text-sm text-text-tertiary">No time logged yet.</p>}
                <div className="flex flex-col gap-2">
                  {timelogs.map(log => (
                    <div key={log._id} className="flex items-start gap-3 p-3 bg-bg-surface border border-border-default rounded-lg hover:border-border-strong transition-colors">
                      <Avatar name={log.user_id?.name} color={log.user_id?.avatar_color} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold text-text-primary">{log.hours_logged}h</span>
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-text-tertiary">{formatDateStrict(log.log_date)}</span>
                        </div>
                        {log.note ? <div className="text-xs text-text-secondary mt-0.5">{log.note}</div> : <div className="text-xs italic text-text-tertiary mt-0.5">No note provided</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="flex flex-col gap-4">
              {activity.length === 0 && <p className="text-sm text-background-tertiary text-center py-10">No activity yet.</p>}
              <div className="relative border-l-2 border-border-default ml-4 pl-6 flex flex-col gap-6 py-2">
                {activity.map(log => (
                  <div key={log._id} className="relative flex flex-col gap-1">
                    <div className="absolute -left-[35px] top-0 border-4 border-bg-surface w-4 h-4 rounded-full bg-border-strong" />
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar name={log.user_id?.name} color={log.user_id?.avatar_color} size="xs" />
                      <span className="text-sm font-semibold text-text-primary w-fit">{log.user_id?.name}</span>
                      <span className="text-[10px] font-mono tracking-wider text-text-tertiary ml-auto">{formatDateTimeStrict(log.createdAt)}</span>
                    </div>
                    <div className="text-sm text-text-secondary">
                      {log.action}
                      {log.new_value && <span className="font-medium text-accent"> → {String(log.new_value)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmationModal
          title="Delete Task"
          message={`Are you sure you want to delete "${localTask.title}"? This action cannot be undone and will permanently remove all associated comments, time logs, and history.`}
          confirmText="Delete Task"
          onConfirm={handleDeleteTask}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}

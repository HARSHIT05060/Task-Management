import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = ['Not Started', 'In Progress', 'On Hold'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function CreateTaskModal({ siteId, orgId, members, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', status: 'Not Started', priority: 'medium',
    assignee_id: '', start_date: '', due_date: '', estimated_hours: ''
  });
  const [loading, setLoading] = useState(false);

  // Shortcut to assign self
  const assignToMe = () => {
    // We don't have user in props, but we can assume from members if we know our ID. 
    // This isn't perfect without context, but as an example:
    // setForm({ ...form, assignee_id: MY_ID })
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.assignee_id) delete payload.assignee_id;
      if (!payload.start_date) delete payload.start_date;
      if (!payload.due_date) delete payload.due_date;
      if (payload.estimated_hours) payload.estimated_hours = parseFloat(payload.estimated_hours);

      const { data } = await api.post(`/orgs/${orgId}/sites/${siteId}/tasks`, payload);
      toast.success('Task created successfully');
      onCreated(data);
    } catch { toast.error('Failed to create task'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Create New Task" onClose={onClose} size="lg"
      footer={<>
        <button className="btn btn-secondary px-3 py-2" onClick={onClose} type="button">Cancel</button>
        <button className="btn btn-primary shadow-sm px-3 py-2" onClick={handleSubmit} disabled={!form.title || loading}>{loading ? 'Creating…' : 'Create Task'}</button>
      </>}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
        <div>
          <label className="form-label">Task Title</label>
          <input className="input py-2.5 text-base" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus required />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="form-label">Status</label>
            <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Assignee</label>
          <select className="select" value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
            <option value="">Unassigned</option>
            {members.map(m => m.user_id && <option key={m.user_id._id} value={m.user_id._id}>{m.user_id.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-5 border-y border-border-default py-5 bg-bg-surface2/30 px-4 -mx-6">
          <div>
            <label className="form-label">Start Date</label>
            <input className="input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Due Date</label>
            <input className="input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Est. Hours</label>
            <input className="input" type="number" step="0.5" placeholder="0" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="form-label mb-2 flex items-center gap-2">
            Description <span className="text-text-tertiary font-normal">(Optional)</span>
          </label>
          <textarea className="textarea min-h-[120px]" placeholder="Add context, subtasks, or acceptance criteria..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}

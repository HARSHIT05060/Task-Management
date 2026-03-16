import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/ui/Avatar';
import { RoleBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { ArrowLeft, Plus, Users, CheckSquare, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

function AddMemberModal({ orgId, siteId, onClose, onAdded }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [role, setRole] = useState('employee');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/orgs/${orgId}/users`).then(r => setUsers(r.data));
  }, [orgId]);

  const handleAdd = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/orgs/${orgId}/sites/${siteId}/members`, { user_id: selected, site_role: role });
      toast.success('Member added!', { description: 'They now have access to this branch.' });
      onAdded(data);
      onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add member'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Add Member" onClose={onClose}
      footer={<>
        <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
        <button className="btn btn-primary" onClick={handleAdd} disabled={!selected || loading}>{loading ? 'Adding…' : 'Add Member'}</button>
      </>}>
      <div className="flex flex-col gap-5">
        <div>
          <label className="form-label">Select user</label>
          <select className="select" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="" disabled>-- Choose a user --</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Branch role</label>
          <select className="select" value={role} onChange={e => setRole(e.target.value)}>
            {['manager', 'employee', 'participant', 'observer'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <p className="text-xs text-text-tertiary mt-2 flex items-center gap-1.5"><ShieldAlert size={12} /> Admins and Owners automatically have full access.</p>
        </div>
      </div>
    </Modal>
  );
}

export default function SiteDetailPage() {
  const { siteId } = useParams();
  const { org, user } = useAuth();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('members');
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const isOwnerOrAdmin = ['owner', 'admin'].includes(user?.org_role);

  useEffect(() => {
    if (!org) return;
    Promise.all([
      api.get(`/orgs/${org._id}/sites/${siteId}`),
      api.get(`/orgs/${org._id}/sites/${siteId}/members`),
    ]).then(([sRes, mRes]) => { setSite(sRes.data); setMembers(mRes.data); })
      .finally(() => setLoading(false));
  }, [org, siteId]);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await api.delete(`/orgs/${org._id}/sites/${siteId}/members/${memberToRemove}`);
      setMembers(prev => prev.filter(m => m.user_id?._id !== memberToRemove));
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
    setMemberToRemove(null);
  };

  if (loading) return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-20 bg-bg-surface border border-border-default rounded-xl shrink-0" />
      <div className="h-64 bg-bg-surface border border-border-default rounded-xl shrink-0" />
    </div>
  );
  if (!site) return <div className="p-10 text-center text-text-muted bg-bg-surface border border-border-default border-dashed rounded-xl mt-8">Branch not found</div>;

  return (
    <div className="px-8 py-6 animate-in fade-in slide-in-bottom duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors -ml-2" onClick={() => navigate('/sites')} title="Back to branches">
          <ArrowLeft size={18} />
        </button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border-default bg-bg-surface">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: site.color || 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{site.name}</h1>
          {site.location && <p className="text-sm text-text-secondary mt-0.5 tracking-wide">{site.location}</p>}
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          {(isOwnerOrAdmin || members.find(m => m.user_id?._id === user?._id)?.site_role === 'manager') && (
            <button className="btn btn-secondary shadow-sm px-3 py-2 text-accent border-accent/20 hover:border-accent" onClick={() => navigate(`/sites/${siteId}/manager`)}>
              <ShieldAlert size={16} />Manager Portal
            </button>
          )}
          <button className="btn btn-primary shadow-sm px-3 py-2" onClick={() => navigate(`/sites/${siteId}/tasks`)}>
            <CheckSquare size={16} />Open Tasks
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border-default">
        <button className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === 'members' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`} onClick={() => setTab('members')}>
          <Users size={16} /> Team Roster <span className="text-[10px] bg-bg-surface2 px-1.5 py-0.5 lg font-bold text-text-primary leading-none ml-1 rounded-full">{members.length}</span>
        </button>
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <div className="bg-bg-surface border border-border-default rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border-default">
            <span className="font-semibold text-text-primary">Branch Members</span>
            {isOwnerOrAdmin && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
                <Plus size={14} />Add Member
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-surface2/50 border-b border-border-default text-xs tracking-wider font-semibold text-text-tertiary uppercase">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Org Role</th>
                  <th className="px-5 py-3 font-medium">Branch Role</th>
                  {isOwnerOrAdmin && <th className="px-5 py-3 font-medium w-[80px]">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {members.map(m => (
                  <tr key={m._id} className="hover:bg-bg-surface2/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.user_id?.name} color={m.user_id?.avatar_color} size="sm" />
                        <span className="font-medium text-text-primary text-sm tracking-tight">{m.user_id?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary">{m.user_id?.email}</td>
                    <td className="px-5 py-3.5"><RoleBadge role={m.user_id?.org_role} /></td>
                    <td className="px-5 py-3.5"><RoleBadge role={m.site_role} /></td>
                    {isOwnerOrAdmin && (
                      <td className="px-5 py-3.5">
                        <button className="p-1.5 text-text-tertiary hover:text-red hover:bg-red-light rounded-md opacity-40 group-hover:opacity-100 transition-all shadow-sm group-hover:shadow hover:shadow-md"
                          onClick={() => setMemberToRemove(m.user_id?._id)} title="Remove Member">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length === 0 && (
              <div className="py-12 text-center text-text-tertiary text-sm">
                No members attached to this branch yet.
              </div>
            )}
          </div>
        </div>
      )}

      {showAddMember && (
        <AddMemberModal orgId={org._id} siteId={siteId} onClose={() => setShowAddMember(false)}
          onAdded={m => setMembers(prev => [...prev, m])} />
      )}

      {memberToRemove && (
        <ConfirmationModal
          title="Remove Member"
          message="Are you sure you want to remove this member from the branch? They will lose access to all tasks and data within this branch."
          confirmText="Remove"
          onConfirm={handleRemoveMember}
          onClose={() => setMemberToRemove(null)}
        />
      )}
    </div>
  );
}

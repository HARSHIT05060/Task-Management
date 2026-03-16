import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Plus, Globe2, MapPin, Search } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';

// Optional: Provide a set of colors users can pick for the site
const SITE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#64748b'];

function CreateSiteModal({ orgId, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', location: '', color: SITE_COLORS[0] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/orgs/${orgId}/sites`, form);
      toast.success('Site Created');
      onCreated(data);
    } catch { toast.error('Creation failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Create New Branch" onClose={onClose}
      footer={<>
        <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.name || loading}>{loading ? 'Creating…' : 'Create Site'}</button>
      </>}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="form-label hidden">Site color</label>
          <div className="flex gap-2">
            {SITE_COLORS.map(c => (
              <button
                key={c} type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-text-primary scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
                onClick={() => setForm({ ...form, color: c })}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="form-label">Branch Name</label>
          <input className="input" placeholder="e.g. North Hub" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="form-label">Location</label>
          <input className="input" placeholder="e.g. New York, NY" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}

export default function SitesPage() {
  const { org, user } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnerOrAdmin = ['owner', 'admin'].includes(user?.org_role);

  useEffect(() => {
    if (!org) return;
    api.get(`/orgs/${org._id}/sites`)
      .then(r => setSites(r.data))
      .finally(() => setLoading(false));
  }, [org]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-40 bg-bg-surface border border-border-default rounded-xl shrink-0" />)}
    </div>
  );

  const filtered = sites.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.location || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="px-8 py-6 animate-in fade-in slide-in-bottom duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="title-page">All Branches</h1>
          <p className="text-sm text-text-secondary mt-1">Manage physical or logical workspaces</p>
        </div>
        {isOwnerOrAdmin && (
          <button className="btn btn-primary px-3 py-2" onClick={() => setShowCreate(true)}>
            <Plus size={16} />New Branch
          </button>
        )}
      </div>

      <div className="relative mb-6 text-text-secondary max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          className="input pl-10 h-11"
          placeholder="Search branches..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center text-text-muted mt-8 bg-bg-surface border border-border-default rounded-xl border-dashed">
          <Globe2 size={48} className="opacity-20 mb-4" />
          <h3 className="text-lg font-semibold text-text-secondary">No branches found</h3>
          <p className="text-sm mt-1 max-w-sm">There are no operational branches matching your search.</p>
          {isOwnerOrAdmin && (
            <button className="btn btn-secondary mt-6" onClick={() => setShowCreate(true)}>Create First Branch</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(site => (
            <div key={site._id} onClick={() => navigate(`/sites/${site._id}`)}
              className="bg-bg-surface border border-border-default hover:border-border-strong hover:shadow-md transition-all duration-200 rounded-xl p-5 cursor-pointer group hover:-translate-y-1 flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-border-default bg-bg-surface2 shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: site.color || 'var(--accent)' }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary tracking-tight leading-snug">{site.name}</h3>
                  <div className="text-sm text-text-secondary flex items-center gap-1.5 mt-1">
                    <MapPin size={14} className="opacity-70" />
                    {site.location || 'Remote'}
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-border-default flex justify-end">
                <button className="text-accent text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  View Detail <span className="text-lg leading-none">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateSiteModal orgId={org._id} onClose={() => setShowCreate(false)} onCreated={s => { setSites(prev => [...prev, s]); setShowCreate(false); }} />}
    </div>
  );
}

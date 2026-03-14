import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Zap, BarChart2, Users } from 'lucide-react';

const features = [
  { icon: Zap, text: 'Multi-site task coordination in one view' },
  { icon: Users, text: 'Role-based access for every team' },
  { icon: BarChart2, text: 'Real-time health scores for all sites' },
  { icon: CheckSquare, text: 'Kanban, Gantt, Calendar & Workload views' },
];

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.ok) navigate('/dashboard');
    else setError(res.error);
  };

  const handleDemo = () => setForm({ email: 'alex@apex.com', password: 'password123' });

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-bg-primary">
      {/* Brand panel */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0F1119] via-[#1A1D23] to-[#201C3A] relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(79,106,245,0.15),transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg backdrop-blur-sm border border-white/10 shadow-sm">
              T
            </div>
            <span className="font-bold text-xl tracking-tight">TaskFlow</span>
          </div>
          
          <h2 className="text-4xl font-bold leading-tight mb-4 tracking-tight">
            Manage every site.<br />Every team.<br />Every task.
          </h2>
          <p className="text-white/70 text-base mb-10 max-w-sm leading-relaxed">
            A multi-site, multi-role task platform built for owners who need total operational visibility.
          </p>
          
          <div className="flex flex-col gap-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-accent-text" />
                </div>
                <span className="text-white/80 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 text-sm text-white/70 shadow-lg">
            Inspired by Zoho Projects & Bitrix24 — designed for what's next.
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8 bg-bg-surface2">
        <div className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-lg p-8">
          <div className="text-2xl font-bold tracking-tight text-text-primary mb-1">Welcome back</div>
          <div className="text-sm text-text-secondary mb-8">Sign in to your workspace</div>

          {error && (
            <div className="bg-red-light border border-red/20 rounded-lg p-3 text-red text-sm mb-6 flex items-center gap-2">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="form-label">Email address</label>
              <input 
                className="input" 
                type="email" 
                placeholder="you@example.com" 
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                required 
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input 
                 className="input" 
                 type="password" 
                 placeholder="••••••••" 
                 value={form.password}
                 onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                 required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-full py-2.5 mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <button onClick={handleDemo} className="btn btn-secondary w-full py-2.5 mt-3">
            Use demo credentials
          </button>

          <p className="text-center mt-8 text-sm text-text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover font-medium transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

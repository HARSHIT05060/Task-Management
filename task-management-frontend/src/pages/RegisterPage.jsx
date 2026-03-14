import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare } from 'lucide-react';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(form);
    if (res.ok) navigate('/dashboard');
    else setError(res.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-lg p-8">
        
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-xl shadow-sm border border-accent/20">
            T
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-1">Create your workspace</h2>
          <p className="text-sm text-text-secondary">Set up TaskFlow for your organization</p>
        </div>

        {error && (
          <div className="bg-red-light border border-red/20 rounded-lg p-3 text-red text-sm mb-6 flex items-center gap-2">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Full Name</label>
            <input 
              className="input" 
              placeholder="Jane Doe" 
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              required 
            />
          </div>
          <div>
            <label className="form-label">Work Email</label>
            <input 
              className="input" 
              type="email" 
              placeholder="jane@company.com" 
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
              minLength={6}
            />
          </div>
          <div className="pt-2 border-t border-border-default">
            <label className="form-label">Organization Name</label>
            <input 
              className="input" 
              placeholder="Apex Corp" 
              value={form.orgName}
              onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-full py-2.5 mt-4" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

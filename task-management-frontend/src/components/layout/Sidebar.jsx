import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Globe2, CheckSquare, Bell, ChevronLeft,
  ChevronRight, LogOut, Settings
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import ThemeToggle from '../ui/ThemeToggle';

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sites',          icon: Globe2,          label: 'Sites' },
  { to: '/notifications',  icon: Bell,            label: 'Notifications' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`fixed left-0 top-0 h-full bg-bg-surface border-r border-border-default transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-[68px]' : 'w-[248px]'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 h-[60px] shrink-0 border-b border-border-default transition-all ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
        <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">T</div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-lg text-text-primary tracking-tight leading-none">TaskFlow</div>
            {org && <div className="text-[11px] font-medium text-text-tertiary truncate mt-1">{org.name}</div>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
        {!collapsed && <div className="text-[10px] font-bold tracking-wider text-text-tertiary uppercase mb-2 px-3">Menu</div>}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${isActive ? 'bg-accent/10 text-accent ring-1 ring-accent/20 shadow-sm' : 'text-text-secondary hover:bg-bg-surface2 hover:text-text-primary'}`}>
            {({ isActive }) => (
              <>
                <Icon size={18} className={`transition-colors ${isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: user + theme toggle + collapse toggle */}
      <div className="p-4 border-t border-border-default flex flex-col gap-3 shrink-0 bg-bg-surface2/30">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full px-1">
            {user && (
              <div className="flex items-center gap-2 overflow-hidden">
                <Avatar name={user.name} color={user.avatar_color} size="sm" />
                <div className="overflow-hidden">
                  <div className="text-sm font-medium text-text-primary truncate">{user.name}</div>
                  <div className="text-xs text-text-tertiary capitalize truncate">{user.org_role}</div>
                </div>
              </div>
            )}
            <ThemeToggle size="sm" />
          </div>
        ) : (
          <div className="flex justify-center w-full mb-2">
            <ThemeToggle size="sm" />
          </div>
        )}

        <div className="flex items-center justify-center gap-1 w-full">
          {!collapsed && (
            <button className="btn btn-ghost btn-icon btn-sm flex-1 justify-center" onClick={handleLogout} title="Logout">
              <LogOut size={16} /> <span className="text-xs ml-1">Logout</span>
            </button>
          )}
          {collapsed && (
            <button className="btn btn-ghost btn-icon btn-sm mb-2" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          )}
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

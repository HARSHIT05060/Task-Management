import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import ThemeToggle from '../ui/ThemeToggle';
import Tooltip from '../ui/Tooltip';

const pageTitles = {
  '/dashboard':    'Owner Dashboard',
  '/sites':        'Branches',
  '/notifications':'Notifications',
};

function getTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.match(/\/sites\/[^/]+\/tasks/)) return 'Tasks';
  if (pathname.match(/\/sites\/[^/]+/)) return 'Branch Detail';
  return 'TaskFlow';
}

export default function TopBar({ collapsed, onMenuClick }) {
  const location = useLocation();
  const { user, org } = useAuth();
  const [unread, setUnread] = useState(0);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!user || !org) return;
    api.get('/notifications').then(r => setUnread(r.data.unreadCount || 0)).catch(() => {});
  }, [user, org]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className={`fixed top-0 right-0 h-[60px] bg-bg-surface/80 backdrop-blur-md border-b border-border-default z-30 transition-all duration-300 flex items-center justify-between md:justify-end px-4 md:px-6 w-full md:w-[calc(100%-248px)] ${collapsed ? 'md:w-[calc(100%-68px)]' : ''}`}>
      {/* Mobile Menu Toggle */}
      <button className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-bg-surface2 rounded-lg transition-colors" onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <Tooltip content={<>Search tasks <kbd className="ml-2 font-mono text-[10px] bg-white/20 px-1 rounded">/</kbd></>} side="bottom">
          <div className="flex items-center gap-2 bg-bg-surface2 border border-border-default rounded-lg px-3 py-2 w-64 transition-colors focus-within:border-accent ring-accent/20">
            <Search size={16} className="text-text-tertiary" />
            <input 
              ref={searchRef}
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-text-primary text-sm w-full placeholder:text-text-tertiary" 
            />
            <div className="text-[10px] font-mono font-medium text-text-tertiary bg-bg-surface p-1 rounded min-w-[20px] text-center border border-border-default shadow-[0_2px_0_0_var(--border-strong)] transform -translate-y-[1px]">
              /
            </div>
          </div>
        </Tooltip>

        <div className="flex items-center gap-1 border-l border-border-default pl-2 md:pl-4 ml-1 md:ml-0">
          {/* Notification bell */}
          <Tooltip content="Notifications" side="bottom">
            <Link to="/notifications" className="relative inline-flex p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors">
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute top-0 right-0 min-w-[16px] h-[16px] rounded-full bg-red text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-bg-surface transform translate-x-1/4 -translate-y-1/4 animate-bounce">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          </Tooltip>
        </div>

        {/* User avatar */}
        {user && (
          <div className="flex items-center pl-2 ml-1 cursor-pointer hover:opacity-80 transition-opacity">
            <Avatar name={user.name} color={user.avatar_color} size="md" />
          </div>
        )}
      </div>
    </header>
  );
}

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, size = 'md', footer }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#0F1119]/50 backdrop-blur-sm transition-opacity" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`bg-bg-surface border border-border-default rounded-2xl w-full shadow-xl flex flex-col max-h-[90vh] transition-all transform slide-in-bottom ${sizeClasses[size] || sizeClasses.md}`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <span className="text-lg font-semibold text-text-primary tracking-tight">{title}</span>
          <button className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-surface2 hover:text-text-primary transition-colors" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-border-default bg-bg-surface/50 rounded-b-2xl backdrop-blur-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

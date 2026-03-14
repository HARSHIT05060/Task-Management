import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ title, message, onConfirm, onClose, confirmText = 'Confirm' }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0F1119]/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 slide-in-bottom-2"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-light flex items-center justify-center text-red mb-4 border border-red/20">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary mb-2">{title}</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="px-6 py-4 bg-bg-surface2/50 border-t border-border-default flex gap-3 justify-end items-center">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn bg-red text-white hover:bg-[#B91C1C] border-transparent shadow-sm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

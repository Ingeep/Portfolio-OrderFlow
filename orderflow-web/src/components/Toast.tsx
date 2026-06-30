import { useEffect } from 'react'
import { Check, X, Clipboard } from 'lucide-react'
import type { Toast as ToastType } from '../types';

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className="toast" style={{ borderLeftColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#8b5cf6' }}>
      {toast.type === 'success' && <Check size={18} style={{ color: '#10b981' }} />}
      {toast.type === 'error' && <X size={18} style={{ color: '#ef4444' }} />}
      {toast.type === 'info' && <Clipboard size={18} style={{ color: '#8b5cf6' }} />}
      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{toast.message}</span>
    </div>
  );
}

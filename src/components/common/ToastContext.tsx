import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, RotateCcw, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info' | 'reset';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { ...toast, id };
    setToasts(prev => [...prev.slice(-3), item]); // keep at most 3

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
    reset: <RotateCcw className="w-4 h-4 text-slate-300 shrink-0" />
  };

  const borderColors: Record<ToastType, string> = {
    success: 'border-emerald-500/40 bg-[#0d1c18]',
    warning: 'border-amber-500/40 bg-[#1c180e]',
    info: 'border-blue-500/40 bg-[#0e1628]',
    reset: 'border-slate-600/40 bg-[#141822]'
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Container in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none select-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto border rounded-xl p-3 shadow-2xl flex items-start justify-between gap-3 text-xs animate-toast-enter ${borderColors[t.type]}`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {icons[t.type]}
              <div className="min-w-0">
                <div className="font-semibold text-slate-100">{t.title}</div>
                {t.message && (
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {t.message}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

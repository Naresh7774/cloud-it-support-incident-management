import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    info: (msg) => showToast(msg, 'info'),
    warning: (msg) => showToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const typeConfig = {
            success: {
              icon: CheckCircle2,
              border: 'border-emerald-500/40',
              bg: 'bg-dark-card/95',
              iconColor: 'text-emerald-400',
              bar: 'bg-emerald-500',
            },
            error: {
              icon: AlertCircle,
              border: 'border-rose-500/40',
              bg: 'bg-dark-card/95',
              iconColor: 'text-rose-400',
              bar: 'bg-rose-500',
            },
            warning: {
              icon: AlertTriangle,
              border: 'border-amber-500/40',
              bg: 'bg-dark-card/95',
              iconColor: 'text-amber-400',
              bar: 'bg-amber-500',
            },
            info: {
              icon: Info,
              border: 'border-cyan-500/40',
              bg: 'bg-dark-card/95',
              iconColor: 'text-cyan-400',
              bar: 'bg-cyan-500',
            },
          }[t.type] || {
            icon: Info,
            border: 'border-brand-primary/40',
            bg: 'bg-dark-card/95',
            iconColor: 'text-brand-accent',
            bar: 'bg-brand-primary',
          };

          const IconComponent = typeConfig.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${typeConfig.border} ${typeConfig.bg} shadow-2xl backdrop-blur-md text-sm text-dark-light transition-all transform animate-in slide-in-from-bottom-5`}
            >
              <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${typeConfig.iconColor}`} />
              <div className="flex-1 font-medium leading-snug">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-dark-muted hover:text-white transition p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

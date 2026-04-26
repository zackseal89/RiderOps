'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// ── Single Toast ───────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const ICON_COLORS: Record<ToastType, string> = {
  success: 'var(--accent)',
  error:   'var(--danger)',
  warning: 'var(--warning)',
  info:    'var(--primary-light)',
};

function ToastEntry({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  useEffect(() => {
    const t = setTimeout(dismiss, 3500);
    return () => clearTimeout(t);
  }, [dismiss]);

  return (
    <div
      className={`toast toast-${item.type}${exiting ? ' exiting' : ''}`}
      onClick={dismiss}
      style={{ cursor: 'pointer' }}
    >
      <span style={{ color: ICON_COLORS[item.type], fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
        {ICONS[item.type]}
      </span>
      <span style={{ flex: 1 }}>{item.message}</span>
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <ToastEntry key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

import React, { useEffect, useState } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah } from '../utils/printer';
import { CheckCircle2, AlertTriangle, RefreshCw, X, Bell } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notifications, markNotificationRead } = usePOS();
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
    type: string;
    amount?: number;
  } | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.read) {
        setActiveToast({
          id: latest.id,
          title: latest.title,
          message: latest.message,
          type: latest.type,
          amount: latest.amount,
        });

        const timer = setTimeout(() => {
          setActiveToast(null);
          markNotificationRead(latest.id);
        }, 4500);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications, markNotificationRead]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-16 right-4 z-50 max-w-sm w-full animate-bounce-short select-none">
      <div className="bg-stone-900 text-white border border-stone-700 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {activeToast.type === 'sale' && (
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          {activeToast.type === 'stock' && (
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          {activeToast.type === 'sync' && (
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
          )}
          {activeToast.type === 'shift' && (
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <h4 className="font-bold text-xs text-white leading-tight">{activeToast.title}</h4>
          <p className="text-[11px] text-stone-300 mt-1 leading-snug line-clamp-2">
            {activeToast.message}
          </p>
          {activeToast.amount && (
            <p className="text-xs font-black text-amber-400 font-mono mt-1">
              +{formatRupiah(activeToast.amount)}
            </p>
          )}
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="text-stone-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { usePOS } from '../context/POSContext';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, syncQueueCount, toggleOfflineSimulation } = usePOS();

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-stone-950 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-amber-700 shadow-sm z-30 select-none">
      <div className="flex items-center gap-2 max-w-2xl">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>
          <strong>Mode Offline Aktif:</strong> Operasional kasir tetap berjalan lancar. Semua pesanan tersimpan aman di memori lokal ({syncQueueCount} transaksi dalam antrean sinkronisasi).
        </span>
      </div>

      <button
        onClick={toggleOfflineSimulation}
        className="px-3 py-1 bg-stone-950 text-white rounded-lg text-[11px] font-bold hover:bg-stone-800 transition-colors shrink-0 ml-2"
      >
        Sambungkan Kembali
      </button>
    </div>
  );
};

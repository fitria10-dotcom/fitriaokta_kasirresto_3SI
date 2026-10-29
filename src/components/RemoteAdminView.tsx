import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah, formatDateTime } from '../utils/printer';
import {
  Radio,
  Tv,
  Wifi,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';

export const RemoteAdminView: React.FC = () => {
  const {
    transactions,
    menuItems,
    currentShift,
    currentCashier,
    isOnline,
    syncQueueCount,
    draftOrders,
  } = usePOS();

  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString('id-ID'));
  const [liveHighlightId, setLiveHighlightId] = useState<string | null>(null);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // When a new transaction arrives
  useEffect(() => {
    if (transactions.length > 0) {
      setLiveHighlightId(transactions[0].id);
      const t = setTimeout(() => setLiveHighlightId(null), 3000);
      return () => clearTimeout(t);
    }
  }, [transactions]);

  // Today's completed transactions
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayTransactions = transactions.filter(t => t.timestamp.startsWith(todayDate) && t.status === 'completed');
  const todayRevenue = todayTransactions.reduce((acc, t) => acc + t.total, 0);
  const lowStockItems = menuItems.filter(m => m.stock <= m.minStock);

  return (
    <div className="flex-1 overflow-y-auto bg-stone-900 text-stone-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Remote Monitor Banner */}
      <div className="bg-stone-850 border border-stone-700/80 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-4 h-4" />
              Monitoring Jarak Jauh (Live Cloud Stream)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Dashboard Pemilik Restoran / Web Admin
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Sinkronisasi data real-time dari seluruh kasir tablet & mobile POS toko secara live tanpa refresh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-stone-800 border border-stone-700 px-3.5 py-2 rounded-2xl text-xs space-y-0.5">
            <div className="flex items-center gap-2 text-stone-400">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Status Koneksi:</span>
              <span className="font-bold text-emerald-400">
                {isOnline ? 'Tersinkron Real-Time' : 'Offline Mode'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 font-mono">
              Sinkronisasi Terakhir: {lastSyncTime} · Antrean: {syncQueueCount}
            </p>
          </div>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-stone-800/80 border border-stone-700/70 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Omset Real-Time Hari Ini</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {formatRupiah(todayRevenue)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {todayTransactions.length} transaksi selesai hari ini
          </p>
        </div>

        <div className="bg-stone-800/80 border border-stone-700/70 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Pesanan Meja Aktif (Running)</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{draftOrders.length} Meja</p>
          <p className="text-[11px] text-stone-400 mt-1">Sedang menikmati hidangan</p>
        </div>

        <div className="bg-stone-800/80 border border-stone-700/70 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Kasir Bertugas Saat Ini</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-white truncate">{currentCashier.name}</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">
            {currentShift ? 'Shift Sedang Berjalan' : 'Shift Belum Dibuka'}
          </p>
        </div>

        <div className="bg-stone-800/80 border border-stone-700/70 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">Peringatan Stok Kritis</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{lowStockItems.length} Menu</p>
          <p className="text-[11px] text-stone-400 mt-1">Perlu pengadaan bahan segera</p>
        </div>
      </div>

      {/* Real-time Order Stream Table */}
      <div className="bg-stone-800/80 border border-stone-700/70 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-700/70">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white">
              Live Order Feed (Aliran Transaksi Masuk Terkini)
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            Terhubung otomatis via WebSocket / BroadcastSync
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-900/60 text-stone-400 font-semibold uppercase tracking-wider border-b border-stone-700">
                <th className="py-3 px-3">No. Nota</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Pelanggan & Meja</th>
                <th className="py-3 px-3">Kasir</th>
                <th className="py-3 px-3">Menu Dipesan</th>
                <th className="py-3 px-3 text-right">Total Tagihan</th>
                <th className="py-3 px-3 text-center">Metode</th>
                <th className="py-3 px-3 text-center">Status Sinkron</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-700/50">
              {transactions.slice(0, 8).map((trx) => {
                const isHighlight = liveHighlightId === trx.id;

                return (
                  <tr
                    key={trx.id}
                    className={`transition-colors ${
                      isHighlight
                        ? 'bg-amber-500/20 text-white animate-pulse'
                        : 'hover:bg-stone-750'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {trx.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-stone-400 whitespace-nowrap">
                      {formatDateTime(trx.timestamp)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-stone-200">{trx.customerName}</span>
                      {trx.tableNumber && (
                        <span className="text-stone-400 text-[11px] block">{trx.tableNumber}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-stone-300">{trx.cashierName}</td>
                    <td className="py-3 px-3 text-stone-400 max-w-xs truncate">
                      {trx.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="py-3 px-3 text-right font-black font-mono text-emerald-400">
                      {formatRupiah(trx.total)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-700 text-stone-200">
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {trx.syncStatus === 'synced' ? 'Tersinkron' : 'Antre'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Stock Alert Drawer */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-extrabold text-sm text-white">
              Pemberitahuan Mendesak: {lowStockItems.length} Stok Bahan/Menu di Bawah Ambang Batas
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="bg-stone-900/80 p-3 rounded-2xl border border-rose-900/50 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white">{item.name}</p>
                  <p className="text-[10px] text-stone-400 font-mono">{item.code} · Min: {item.minStock} {item.unit}</p>
                </div>
                <span className="font-black text-rose-400 font-mono text-sm">
                  {item.stock} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

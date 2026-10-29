import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah, executeThermalPrint } from '../utils/printer';
import {
  CalendarDays,
  Printer,
  TrendingUp,
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  Users,
  Clock,
  Award,
  AlertCircle,
} from 'lucide-react';

export const DailyReportView: React.FC = () => {
  const {
    transactions,
    currentShift,
    currentCashier,
  } = usePOS();

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Filter transactions by selected date (completed only for sales)
  const daysTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = t.timestamp.slice(0, 10);
      return tDate === selectedDate;
    });
  }, [transactions, selectedDate]);

  const completedTrx = useMemo(() => {
    return daysTransactions.filter(t => t.status === 'completed');
  }, [daysTransactions]);

  const voidedTrx = useMemo(() => {
    return daysTransactions.filter(t => t.status === 'voided');
  }, [daysTransactions]);

  // Totals
  const totalGrossRevenue = useMemo(() => {
    return completedTrx.reduce((acc, t) => acc + t.total, 0);
  }, [completedTrx]);

  const totalCogs = useMemo(() => {
    return completedTrx.reduce((acc, t) => {
      const itemsCogs = t.items.reduce((sum, i) => sum + i.cogs * i.quantity, 0);
      return acc + itemsCogs;
    }, 0);
  }, [completedTrx]);

  const grossProfit = totalGrossRevenue - totalCogs;
  const averageBasket = completedTrx.length > 0 ? Math.round(totalGrossRevenue / completedTrx.length) : 0;

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const cash = completedTrx.filter(t => t.paymentMethod === 'cash').reduce((a, b) => a + b.total, 0);
    const qris = completedTrx.filter(t => t.paymentMethod === 'qris').reduce((a, b) => a + b.total, 0);
    const card = completedTrx.filter(t => t.paymentMethod === 'card').reduce((a, b) => a + b.total, 0);

    return {
      cash,
      qris,
      card,
      cashCount: completedTrx.filter(t => t.paymentMethod === 'cash').length,
      qrisCount: completedTrx.filter(t => t.paymentMethod === 'qris').length,
      cardCount: completedTrx.filter(t => t.paymentMethod === 'card').length,
    };
  }, [completedTrx]);

  // Hourly Distribution
  const hourlyData = useMemo(() => {
    const hoursMap: Record<number, { count: number; total: number }> = {};
    for (let h = 8; h <= 22; h++) {
      hoursMap[h] = { count: 0, total: 0 };
    }

    completedTrx.forEach(t => {
      const hour = new Date(t.timestamp).getHours();
      if (hoursMap[hour]) {
        hoursMap[hour].count += 1;
        hoursMap[hour].total += t.total;
      }
    });

    const maxVal = Math.max(...Object.values(hoursMap).map(v => v.total), 1);

    return Object.entries(hoursMap).map(([hour, val]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      count: val.count,
      total: val.total,
      percentage: Math.round((val.total / maxVal) * 100),
    }));
  }, [completedTrx]);

  // Top Selling Items Today
  const topItems = useMemo(() => {
    const itemMap: Record<string, { name: string; qty: number; revenue: number; image: string }> = {};

    completedTrx.forEach(t => {
      t.items.forEach(i => {
        if (!itemMap[i.name]) {
          itemMap[i.name] = { name: i.name, qty: 0, revenue: 0, image: i.image };
        }
        itemMap[i.name].qty += i.quantity;
        itemMap[i.name].revenue += i.lineTotal;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [completedTrx]);

  const handlePrintZReport = () => {
    executeThermalPrint();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-500" />
            <span>Laporan Penjualan Harian (Z-Report)</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Rekap omset harian kasir, performa menu terlaris, dan rincian transaksi QRIS & Tunai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 shadow-2xs"
          />

          <button
            onClick={handlePrintZReport}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak Slip Rekap Kasir</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Total Omset Penjualan</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-stone-900">
            {formatRupiah(totalGrossRevenue)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">{completedTrx.length} transaksi selesai</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Estimasi Laba Kotor</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">
            {formatRupiah(grossProfit)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Margin: {totalGrossRevenue > 0 ? Math.round((grossProfit / totalGrossRevenue) * 100) : 0}%
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Rata-rata Belanja / Tamu</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-stone-900">
            {formatRupiah(averageBasket)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Average order value</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Pembatalan (Void)</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{voidedTrx.length}</p>
          <p className="text-[11px] text-stone-500 mt-1">
            {voidedTrx.length > 0 ? 'Stok otomatis dikembalikan' : 'Nol pembatalan'}
          </p>
        </div>
      </div>

      {/* Row 2: Payment Methods & Shift Drawer Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Breakdown Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span>Rincian Metode Pembayaran</span>
          </h3>

          <div className="space-y-3">
            {/* QRIS */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-rose-600" />
                  <span>QRIS Dinamis</span>
                </span>
                <span className="font-black text-stone-900">{formatRupiah(paymentBreakdown.qris)}</span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{
                    width: `${totalGrossRevenue > 0 ? (paymentBreakdown.qris / totalGrossRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1.5 flex justify-between">
                <span>{paymentBreakdown.qrisCount} Transaksi</span>
                <span>
                  {totalGrossRevenue > 0
                    ? Math.round((paymentBreakdown.qris / totalGrossRevenue) * 100)
                    : 0}
                  % dari total
                </span>
              </p>
            </div>

            {/* Tunai */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Uang Tunai (Cash)</span>
                </span>
                <span className="font-black text-stone-900">{formatRupiah(paymentBreakdown.cash)}</span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${totalGrossRevenue > 0 ? (paymentBreakdown.cash / totalGrossRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1.5 flex justify-between">
                <span>{paymentBreakdown.cashCount} Transaksi</span>
                <span>
                  {totalGrossRevenue > 0
                    ? Math.round((paymentBreakdown.cash / totalGrossRevenue) * 100)
                    : 0}
                  % dari total
                </span>
              </p>
            </div>

            {/* Kartu Debit */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Kartu Debit / EDC</span>
                </span>
                <span className="font-black text-stone-900">{formatRupiah(paymentBreakdown.card)}</span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${totalGrossRevenue > 0 ? (paymentBreakdown.card / totalGrossRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1.5 flex justify-between">
                <span>{paymentBreakdown.cardCount} Transaksi</span>
                <span>
                  {totalGrossRevenue > 0
                    ? Math.round((paymentBreakdown.card / totalGrossRevenue) * 100)
                    : 0}
                  % dari total
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Shift Cash Drawer Status */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>Rekonsiliasi Kas Laci Kasir (Cash Drawer)</span>
          </h3>

          {currentShift ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 bg-stone-50 rounded-xl">
                <span className="text-stone-600">Kasir Aktif:</span>
                <span className="font-bold text-stone-900">{currentShift.cashierName}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-stone-50 rounded-xl">
                <span className="text-stone-600">Modal Awal Kas:</span>
                <span className="font-bold font-mono text-stone-900">
                  {formatRupiah(currentShift.startingCash)}
                </span>
              </div>
              <div className="flex justify-between p-2.5 bg-stone-50 rounded-xl">
                <span className="text-stone-600">Penjualan Tunai Hari Ini:</span>
                <span className="font-bold font-mono text-emerald-600">
                  +{formatRupiah(currentShift.totalCashSales)}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-950">Target Kas Fisik di Laci:</span>
                <span className="font-black font-mono text-emerald-700 text-sm">
                  {formatRupiah(currentShift.expectedCash)}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 italic">
                * Pastikan menghitung uang fisik sebelum menutup shift di menu Karyawan & Shift.
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-stone-400 text-xs">
              Belum ada shift yang dibuka saat ini.
            </div>
          )}
        </div>

        {/* Top 5 Best Sellers Today */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Menu Terlaris Hari Ini</span>
          </h3>

          <div className="space-y-2.5">
            {topItems.length === 0 ? (
              <p className="text-center py-8 text-stone-400 text-xs">
                Belum ada penjualan di tanggal ini.
              </p>
            ) : (
              topItems.map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs text-stone-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-stone-500">{item.qty} porsi terjual</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs text-stone-900 font-mono shrink-0">
                    {formatRupiah(item.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hourly Sales Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Distribusi Penjualan per Jam Operasional (08:00 - 22:00)</span>
          </h3>
          <span className="text-xs text-stone-500">Membantu antisipasi jam ramai restoran</span>
        </div>

        <div className="grid grid-cols-8 sm:grid-cols-15 gap-1.5 items-end h-40 pt-6">
          {hourlyData.map((h) => (
            <div key={h.hour} className="flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[10px] p-1.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                {h.hour}: {formatRupiah(h.total)} ({h.count} trx)
              </div>

              {/* Bar */}
              <div
                className={`w-full max-w-[28px] rounded-t-md transition-all ${
                  h.total > 0
                    ? 'bg-amber-500 group-hover:bg-amber-400'
                    : 'bg-stone-100'
                }`}
                style={{ height: `${Math.max(h.percentage, 4)}%` }}
              />

              <span className="text-[9px] font-mono text-stone-500 mt-2 truncate w-full text-center">
                {h.hour.slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

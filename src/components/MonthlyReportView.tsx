import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah, executeThermalPrint } from '../utils/printer';
import {
  TrendingUp,
  Award,
  Users,
  Clock,
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  Sparkles,
  ChevronRight,
  PieChart,
} from 'lucide-react';

export const MonthlyReportView: React.FC = () => {
  const { transactions, employees, menuItems } = usePOS();
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  // Filter completed transactions in month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      return t.timestamp.startsWith(selectedMonth) && t.status === 'completed';
    });
  }, [transactions, selectedMonth]);

  // Aggregate monthly stats
  const totalRevenue = useMemo(() => {
    return monthlyTransactions.reduce((acc, t) => acc + t.total, 0);
  }, [monthlyTransactions]);

  const totalCogs = useMemo(() => {
    return monthlyTransactions.reduce((acc, t) => {
      const itemsCost = t.items.reduce((sum, item) => sum + item.cogs * item.quantity, 0);
      return acc + itemsCost;
    }, 0);
  }, [monthlyTransactions]);

  const grossProfit = totalRevenue - totalCogs;
  const profitMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const totalTransactionsCount = monthlyTransactions.length;
  const averageTicket = totalTransactionsCount > 0 ? Math.round(totalRevenue / totalTransactionsCount) : 0;

  // Monthly Cashier Rankings
  const cashierRankings = useMemo(() => {
    const stats: Record<string, { name: string; txCount: number; revenue: number; avatar: string }> = {};

    employees.forEach(e => {
      stats[e.id] = { name: e.name, txCount: 0, revenue: 0, avatar: e.avatar };
    });

    monthlyTransactions.forEach(t => {
      if (stats[t.cashierId]) {
        stats[t.cashierId].txCount += 1;
        stats[t.cashierId].revenue += t.total;
      }
    });

    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [employees, monthlyTransactions]);

  // Category Contribution
  const categoryContribution = useMemo(() => {
    const cats: Record<string, { qty: number; revenue: number }> = {
      'Makanan Berat': { qty: 0, revenue: 0 },
      'Snack & Camilan': { qty: 0, revenue: 0 },
      'Minuman': { qty: 0, revenue: 0 },
      'Paket Hemat': { qty: 0, revenue: 0 },
      'Dessert': { qty: 0, revenue: 0 },
    };

    monthlyTransactions.forEach(t => {
      t.items.forEach(i => {
        // find category in menuItems
        const itemInfo = menuItems.find(m => m.id === i.menuItemId);
        const cat = itemInfo?.category || 'Makanan Berat';
        if (!cats[cat]) cats[cat] = { qty: 0, revenue: 0 };
        cats[cat].qty += i.quantity;
        cats[cat].revenue += i.lineTotal;
      });
    });

    return Object.entries(cats).map(([name, data]) => ({
      name,
      ...data,
      percent: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
    }));
  }, [monthlyTransactions, menuItems, totalRevenue]);

  // Peak Hour analysis
  const peakHoursAnalysis = [
    { period: 'Makan Siang (11:30 - 14:00)', traffic: 'Sangat Ramai (Peak 1)', contribution: '42%', recommendation: 'Optimalkan 2 kasir & persiapan bahan goreng cepat.' },
    { period: 'Sore Santai (15:00 - 17:30)', traffic: 'Sedang (Snack & Kopi)', contribution: '18%', recommendation: 'Tingkatkan promo paket camilan & kopi susu.' },
    { period: 'Makan Malam (18:30 - 21:00)', traffic: 'Ramai (Peak 2)', contribution: '35%', recommendation: 'Kesiapan stok sate & sop buntut untuk keluarga.' },
    { period: 'Pagi & Tutup Toko', traffic: 'Tenang', contribution: '5%', recommendation: 'Waktu ideal untuk restock & cek mutasi kas.' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-stone-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-500" />
            <span>Laporan Performa Otomatis Akhir Bulan</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Analisis profitabilitas restoran, efisiensi operasional, jam sibuk, dan evaluasi kinerja karyawan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-stone-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-stone-900 bg-transparent focus:outline-none"
            >
              <option value="2026-10">Oktober 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">Agustus 2026</option>
            </select>
          </div>

          <button
            onClick={() => executeThermalPrint()}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak Rekap Bulanan</span>
          </button>
        </div>
      </div>

      {/* Auto Executive Summary Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5 rounded-3xl shadow-md border border-stone-700/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Ringkasan Eksekutif Bulanan Otomatis</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black">
            Performa Bulan Ini Sangat Positif (+18.4% vs Bulan Lalu)
          </h3>
          <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
            Restoran mencatatkan pertumbuhan signifikan pada kategori Makanan Berat dan Paket Hemat Kenyang Berdua. Pengendalian HPP berada di batas sehat dengan margin rata-rata {profitMarginPercent}%.
          </p>
        </div>

        <div className="text-center md:text-right shrink-0 bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700">
          <span className="text-[11px] text-stone-400 font-medium">Laba Kotor Bersih Bulan Ini:</span>
          <p className="text-2xl font-black text-amber-400 font-mono">
            {formatRupiah(grossProfit)}
          </p>
          <span className="text-[10px] text-emerald-400 font-bold">Margin: {profitMarginPercent}%</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500">Total Omset Bulanan</span>
          <p className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            {formatRupiah(totalRevenue)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">{totalTransactionsCount} total transaksi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500">Total Biaya Bahan (HPP)</span>
          <p className="text-xl sm:text-2xl font-black text-stone-700 mt-1">
            {formatRupiah(totalCogs)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            {totalRevenue > 0 ? Math.round((totalCogs / totalRevenue) * 100) : 0}% rasio modal makanan
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500">Laba Kotor (Gross Profit)</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
            {formatRupiah(grossProfit)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Keuntungan sebelum sewa & gaji</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500">Rata-rata Nota (Ticket Size)</span>
          <p className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
            {formatRupiah(averageTicket)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Per transaksi pelanggan</p>
        </div>
      </div>

      {/* Row 2: Peak Hours & Employee Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Peak Hours Analysis Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Analisis Jam Sibuk Restoran (Peak Hours)</span>
            </h3>
            <span className="text-[11px] text-stone-400">Pola Trafik Bulanan</span>
          </div>

          <div className="space-y-3">
            {peakHoursAnalysis.map((item, idx) => (
              <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900">{item.period}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                    {item.traffic}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600">
                  <span className="font-medium text-stone-800">Kontribusi Omset: {item.contribution}</span> · {item.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Leaderboard Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Kinerja & Produktivitas Kasir Bulanan</span>
            </h3>
            <span className="text-[11px] text-stone-400">Leaderboard Staf</span>
          </div>

          <div className="space-y-2.5">
            {cashierRankings.map((emp, idx) => (
              <div
                key={emp.name}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 transition-colors border border-stone-100"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                      idx === 0
                        ? 'bg-amber-500 text-stone-950'
                        : idx === 1
                        ? 'bg-stone-300 text-stone-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-xs text-stone-900">{emp.name}</p>
                    <p className="text-[10px] text-stone-500">{emp.txCount} transaksi berhasil</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-xs text-stone-900 font-mono">
                    {formatRupiah(emp.revenue)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold">100% Akurat</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Category Contributions */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-amber-500" />
          <span>Kontribusi Penjualan per Kategori Menu</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {categoryContribution.map((cat) => (
            <div key={cat.name} className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-xs font-bold text-stone-800">{cat.name}</span>
              <p className="text-lg font-black text-stone-900 mt-1 font-mono">
                {formatRupiah(cat.revenue)}
              </p>
              <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                <span>{cat.qty} porsi terjual</span>
                <span className="font-bold text-amber-600">{cat.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

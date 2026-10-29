import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  UtensilsCrossed,
  LayoutGrid,
  Package,
  CalendarDays,
  TrendingUp,
  Users,
  Receipt,
  Radio,
  Wifi,
  WifiOff,
  Printer,
  Bell,
  UserCheck,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    currentCashier,
    currentShift,
    isOnline,
    offlineSimulated,
    toggleOfflineSimulation,
    syncQueueCount,
    printer,
    autoPrintReceipt,
    setAutoPrintReceipt,
    notifications,
    markNotificationRead,
    clearNotifications,
    requestNotificationPermission,
    switchCashier,
    employees,
  } = usePOS();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const handleSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = switchCashier(selectedEmpId, pinInput);
    if (result.success) {
      setShowCashierModal(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError(result.message);
    }
  };

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40 select-none shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Top brand and status bar */}
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Logo & Store Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-sm">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">RasaPOS</span>
                <span className="text-[11px] text-amber-400 font-medium hidden sm:inline">Dapur Rasa Nusantara</span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono hidden md:block">
                Terminal #01 · {currentShift ? `Shift Buka (${currentShift.cashierName})` : 'Shift Belum Dibuka'}
              </p>
            </div>
          </div>

          {/* Quick Controls & Indicators */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Online / Offline Simulator Pill */}
            <button
              onClick={toggleOfflineSimulation}
              title={isOnline ? 'Koneksi online aktif. Klik untuk uji coba offline mode.' : 'Mode offline aktif. Klik untuk sambungkan kembali.'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                isOnline
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-950/70 border-amber-600 text-amber-200 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Online (Cloud Sync)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline ({syncQueueCount} Antre)</span>
                </>
              )}
            </button>

            {/* Thermal Printer Quick Toggle */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700 text-stone-300">
              <Printer className="w-3.5 h-3.5 text-stone-400" />
              <span>{printer.paperWidth}</span>
              <label className="flex items-center gap-1 cursor-pointer ml-1 text-[11px] text-stone-400">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-amber-400 w-3 h-3"
                />
                Auto-Cetak
              </label>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  requestNotificationPermission();
                }}
                className="relative p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                title="Notifikasi Transaksi & Sistem"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-3 z-50 text-stone-200">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                    <span className="font-semibold text-xs text-white">Notifikasi Masuk ({notifications.length})</span>
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] text-stone-400 hover:text-amber-400"
                    >
                      Hapus Semua
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 mt-2 divide-y divide-stone-800/60">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-stone-500 text-xs">Belum ada notifikasi transaksi.</p>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`pt-2 text-xs cursor-pointer hover:bg-stone-800/50 p-1.5 rounded transition-colors ${
                            !notif.read ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-200">{notif.title}</span>
                            <span className="text-[10px] text-stone-500">
                              {new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-stone-400 text-[11px] mt-0.5">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Cashier Profile Switcher */}
            <button
              onClick={() => setShowCashierModal(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
            >
              <img
                src={currentCashier.avatar}
                alt={currentCashier.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="font-medium max-w-[90px] truncate hidden sm:inline">{currentCashier.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>

        {/* Navigation Bar / Views Selector */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none border-t border-stone-800/80 text-xs">
          <button
            onClick={() => setActiveView('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeView === 'pos'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kasir POS</span>
          </button>

          <button
            onClick={() => setActiveView('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeView === 'inventory'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventaris Barang</span>
          </button>

          <button
            onClick={() => setActiveView('daily_report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeView === 'daily_report'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Laporan Harian</span>
          </button>

          <button
            onClick={() => setActiveView('monthly_report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeView === 'monthly_report'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Performa Bulanan</span>
          </button>

          <button
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeView === 'history'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Riwayat Transaksi</span>
          </button>

          <button
            onClick={() => setActiveView('staff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeView === 'staff'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Karyawan & Shift</span>
          </button>

          {/* Real-time remote cloud monitor tab */}
          <button
            onClick={() => setActiveView('remote_admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ml-auto ${
              activeView === 'remote_admin'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm ring-2 ring-indigo-400'
                : 'text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/50'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Monitoring Jarak Jauh (Admin)</span>
          </button>
        </nav>
      </div>

      {/* Switch Cashier PIN Modal */}
      {showCashierModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-sm p-6 text-stone-100 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base">Ganti Akun Kasir Aktif</h3>
            </div>
            <form onSubmit={handleSwitchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">Pilih Karyawan</label>
                <div className="grid grid-cols-2 gap-2">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmpId(emp.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-colors ${
                        selectedEmpId === emp.id
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-stone-800 bg-stone-800/50 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      <img src={emp.avatar} alt={emp.name} className="w-7 h-7 rounded-full object-cover" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold truncate">{emp.name}</p>
                        <p className="text-[10px] text-stone-400">{emp.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">
                  Masukkan PIN Kasir (Default: 1234, 2345, 9999, 8888)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN 4 Digit"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-center text-lg tracking-widest text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {pinError && <p className="text-xs text-red-400 mt-1">{pinError}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCashierModal(false);
                    setPinError('');
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-medium text-xs hover:bg-stone-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400"
                >
                  Masuk Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

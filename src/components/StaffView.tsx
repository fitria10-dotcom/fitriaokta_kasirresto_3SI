import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah } from '../utils/printer';
import { Employee, EmployeeRole } from '../types/pos';
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Banknote,
  AlertTriangle,
  RotateCcw,
  X,
  Phone,
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const {
    employees,
    currentCashier,
    currentShift,
    openShift,
    closeShift,
    switchCashier,
    addEmployee,
  } = usePOS();

  // Shift Modal State
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [startingCashInput, setStartingCashInput] = useState('300000');

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

  // Add Employee Modal
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmp, setNewEmp] = useState({
    name: '',
    role: 'Kasir' as EmployeeRole,
    pin: '1234',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isActive: true,
  });

  // Switch Cashier Modal
  const [switchingEmp, setSwitchingEmp] = useState<Employee | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(startingCashInput) || 0;
    openShift(amount);
    setShowOpenShiftModal(false);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseInt(actualCashInput) || 0;
    closeShift(actual, shiftNotes);
    setShowCloseShiftModal(false);
  };

  const handleSwitchCashierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchingEmp) return;
    const result = switchCashier(switchingEmp.id, pinInput);
    if (result.success) {
      setSwitchingEmp(null);
      setPinInput('');
      setPinError('');
    } else {
      setPinError(result.message);
    }
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.pin) return;
    addEmployee(newEmp);
    setShowAddEmpModal(false);
    setNewEmp({
      name: '',
      role: 'Kasir',
      pin: '1234',
      phone: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      isActive: true,
    });
  };

  const expectedCashInDrawer = currentShift ? currentShift.expectedCash : 0;
  const countedActual = parseInt(actualCashInput) || 0;
  const cashDifference = countedActual - expectedCashInDrawer;

  return (
    <div className="flex-1 overflow-y-auto bg-stone-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <span>Manajemen Karyawan & Shift Kasir</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Kelola hak akses staf, serah terima laci kasir (opening/closing cash), dan pencatatan shift operasional.
          </p>
        </div>

        <button
          onClick={() => setShowAddEmpModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Active Shift Management Card */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-stone-900">Status Shift Kasir</span>
                {currentShift ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    🟢 Sedang Dibuka
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600">
                    ⚪ Belum Dibuka
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Kasir Bertugas: <span className="font-bold text-stone-800">{currentCashier.name}</span> ({currentCashier.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentShift ? (
              <button
                onClick={() => {
                  setActualCashInput(currentShift.expectedCash.toString());
                  setShowCloseShiftModal(true);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Banknote className="w-4 h-4" />
                <span>Tutup Shift & Rekonsiliasi Kas</span>
              </button>
            ) : (
              <button
                onClick={() => setShowOpenShiftModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Buka Shift Baru Sekarang</span>
              </button>
            )}
          </div>
        </div>

        {/* Shift Details Grid */}
        {currentShift && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
              <span className="text-stone-500 font-medium">Modal Awal Kasir:</span>
              <p className="text-base font-extrabold text-stone-900 mt-1 font-mono">
                {formatRupiah(currentShift.startingCash)}
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Dibuka: {new Date(currentShift.startTime).toLocaleTimeString('id-ID')}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
              <span className="text-stone-500 font-medium">Penjualan Tunai Shift:</span>
              <p className="text-base font-extrabold text-emerald-600 mt-1 font-mono">
                +{formatRupiah(currentShift.totalCashSales)}
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5">Masuk ke laci kas</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
              <span className="text-stone-500 font-medium">Penjualan QRIS & EDC:</span>
              <p className="text-base font-extrabold text-blue-600 mt-1 font-mono">
                +{formatRupiah(currentShift.totalQrisSales + currentShift.totalCardSales)}
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5">Masuk langsung ke rekening</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-amber-900 font-bold">Target Uang Kas di Laci:</span>
              <p className="text-lg font-black text-amber-700 mt-1 font-mono">
                {formatRupiah(currentShift.expectedCash)}
              </p>
              <p className="text-[10px] text-amber-800 mt-0.5">Modal awal + uang tunai masuk</p>
            </div>
          </div>
        )}
      </div>

      {/* Staff Roster */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-stone-900">
          Daftar Karyawan Restoran ({employees.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {employees.map((emp) => {
            const isCurrentlyActive = currentCashier.id === emp.id;

            return (
              <div
                key={emp.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  isCurrentlyActive
                    ? 'border-amber-500 ring-2 ring-amber-300 shadow-md'
                    : 'border-stone-200/80 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
                    />
                    {isCurrentlyActive ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-stone-950 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        AKTIF KASIR
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600">
                        {emp.role}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-stone-900 text-sm leading-tight">{emp.name}</h4>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                    <span>{emp.role}</span>
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{emp.phone || '-'}</span>
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono mt-1">
                    PIN Akses: ••••
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100">
                  {isCurrentlyActive ? (
                    <button
                      disabled
                      className="w-full py-2 bg-stone-100 text-stone-400 font-bold text-xs rounded-xl cursor-default"
                    >
                      Sedang Digunakan
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSwitchingEmp(emp);
                        setPinInput('');
                        setPinError('');
                      }}
                      className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Masuk Kasir Akun Ini</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Switch Cashier PIN Dialog */}
      {switchingEmp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-sm">Verifikasi PIN: {switchingEmp.name}</h3>
              <button
                onClick={() => setSwitchingEmp(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSwitchCashierSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Masukkan PIN Karyawan
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN 4 Digit"
                  className="w-full text-center text-xl font-bold tracking-widest p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {pinError && <p className="text-xs text-red-500 mt-1">{pinError}</p>}
                <p className="text-[10px] text-stone-400 mt-1 text-center">
                  (Default PIN: 1234 untuk Fitria, 2345 untuk Dimas, 9999 untuk Budi, 8888 untuk Ahmad)
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSwitchingEmp(null)}
                  className="px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl shadow-xs"
                >
                  Konfirmasi Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl text-stone-900">
            <h3 className="font-bold text-base mb-1">Buka Shift Kasir Baru</h3>
            <p className="text-xs text-stone-500 mb-4">
              Hitung dan masukkan modal awal kas (floating cash) yang dimasukkan ke laci uang.
            </p>

            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Modal Awal Kas (Rp)
                </label>
                <input
                  type="number"
                  value={startingCashInput}
                  onChange={(e) => setStartingCashInput(e.target.value)}
                  className="w-full text-lg font-bold p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  {[200000, 300000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStartingCashInput(amt.toString())}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(false)}
                  className="px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Mulai Shift Kasir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift & Cash Drawer Reconciliation Modal */}
      {showCloseShiftModal && currentShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl text-stone-900 space-y-4">
            <h3 className="font-black text-lg">Tutup Shift & Rekonsiliasi Kas Fisik</h3>
            <p className="text-xs text-stone-500">
              Lakukan perhitungan fisik uang tunai di laci kasir untuk mencocokkan dengan catatan sistem.
            </p>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-600">Modal Awal:</span>
                <span className="font-mono">{formatRupiah(currentShift.startingCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Penjualan Tunai:</span>
                <span className="font-mono text-emerald-600">+{formatRupiah(currentShift.totalCashSales)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-stone-200 pt-1 text-sm">
                <span>Target Kas Seharusnya di Laci:</span>
                <span className="font-mono text-amber-700">{formatRupiah(currentShift.expectedCash)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Jumlah Uang Fisik yang Dihitung di Laci (Rp)
                </label>
                <input
                  type="number"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="Masukkan nominal hasil hitung..."
                  className="w-full text-lg font-bold p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              {/* Variance indicator */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  cashDifference === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : cashDifference > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div>
                  <span className="font-bold">
                    {cashDifference === 0
                      ? 'Kas Seimbang (Sesuai 100%)'
                      : cashDifference > 0
                      ? 'Selisih Lebih (Kas Berlebih)'
                      : 'Selisih Kurang (Kas Kurang)'}
                  </span>
                  <p className="font-mono text-sm font-black">
                    {cashDifference > 0 ? `+${formatRupiah(cashDifference)}` : formatRupiah(cashDifference)}
                  </p>
                </div>
                {cashDifference !== 0 && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Catatan Serah Terima (Opsional)
                </label>
                <input
                  type="text"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="cth: Diserahkan ke kasir shift sore / Setor ke brankas"
                  className="w-full p-2.5 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-sm"
                >
                  Tutup Shift & Cetak Berita Acara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl text-stone-900">
            <h3 className="font-bold text-base mb-3">Tambah Data Karyawan Baru</h3>
            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  placeholder="Nama karyawan..."
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Peran / Jabatan</label>
                <select
                  value={newEmp.role}
                  onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value as EmployeeRole })}
                  className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="Kasir">Kasir</option>
                  <option value="Koki / Dapur">Koki / Dapur</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Owner / Admin">Owner / Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">PIN Masuk Kasir (4-6 Digit)</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newEmp.pin}
                  onChange={(e) => setNewEmp({ ...newEmp, pin: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-lg tracking-widest text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  value={newEmp.phone}
                  onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg shadow-xs"
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Transaction } from '../types/pos';
import { formatRupiah, formatDateTime, generateWhatsAppReceiptText } from '../utils/printer';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Share2,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  XCircle,
  QrCode,
  Banknote,
  CreditCard,
  X,
} from 'lucide-react';

interface TransactionHistoryViewProps {
  onReprint: (trx: Transaction) => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  onReprint,
}) => {
  const { transactions, voidTransaction } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

  // Void modal
  const [voidingTrx, setVoidingTrx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('Pelanggan salah pesan / minta ganti menu');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.orderNumber.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        (t.tableNumber && t.tableNumber.toLowerCase().includes(q)) ||
        t.cashierName.toLowerCase().includes(q);

      const matchMethod = methodFilter === 'all' || t.paymentMethod === methodFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchSearch && matchMethod && matchStatus;
    });
  }, [transactions, searchQuery, methodFilter, statusFilter]);

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (voidingTrx) {
      voidTransaction(voidingTrx.id, voidReason);
      setVoidingTrx(null);
      setSelectedTrx(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-500" />
            <span>Riwayat Transaksi & Nota Kasir</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Daftar lengkap seluruh transaksi penjualan, cetak ulang nota pembeli, dan pembatalan nota (void).
          </p>
        </div>

        <div className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 shadow-2xs">
          Total Terdaftar: <span className="font-bold text-stone-900">{transactions.length} Nota</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor nota (TRX-...), nama tamu, meja, atau kasir..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none"
            >
              <option value="all">Semua Metode</option>
              <option value="qris">QRIS</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="card">Debit / EDC</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="voided">Dibatalkan (Void)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">No. Nota</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Tipe & Meja</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3">Kasir</th>
                <th className="py-3 px-3">Item Pesanan</th>
                <th className="py-3 px-3 text-right">Total Bayar</th>
                <th className="py-3 px-3 text-center">Metode</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-stone-400">
                    Tidak ada transaksi yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isVoided = trx.status === 'voided';

                  return (
                    <tr
                      key={trx.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isVoided ? 'bg-rose-50/30 line-through opacity-75' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold font-mono text-stone-900">
                        {trx.orderNumber}
                      </td>
                      <td className="py-3 px-3 text-stone-500 whitespace-nowrap">
                        {formatDateTime(trx.timestamp)}
                      </td>
                      <td className="py-3 px-3 font-medium">
                        <span className="capitalize">{trx.orderType.replace('_', ' ')}</span>
                        {trx.tableNumber && (
                          <span className="text-stone-400"> ({trx.tableNumber})</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-800">{trx.customerName}</td>
                      <td className="py-3 px-3 text-stone-500">{trx.cashierName}</td>
                      <td className="py-3 px-3 text-stone-600 max-w-xs truncate">
                        {trx.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td className="py-3 px-3 text-right font-black font-mono text-stone-900">
                        {formatRupiah(trx.total)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            trx.paymentMethod === 'qris'
                              ? 'bg-rose-100 text-rose-800'
                              : trx.paymentMethod === 'cash'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {trx.paymentMethod === 'qris' && <QrCode className="w-3 h-3" />}
                          {trx.paymentMethod === 'cash' && <Banknote className="w-3 h-3" />}
                          {trx.paymentMethod === 'card' && <CreditCard className="w-3 h-3" />}
                          <span>{trx.paymentMethod}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isVoided ? (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px] inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            VOID
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            SELESAI
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedTrx(trx)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg text-xs"
                          >
                            Rincian
                          </button>

                          <button
                            onClick={() => onReprint(trx)}
                            className="p-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-lg"
                            title="Cetak Ulang Struk"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Drawer / Modal */}
      {selectedTrx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl text-stone-900 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-black text-base">Rincian Nota: {selectedTrx.orderNumber}</h3>
                <p className="text-xs text-stone-500">{formatDateTime(selectedTrx.timestamp)}</p>
              </div>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-stone-50 rounded-2xl">
                <div>
                  <span className="text-stone-400">Tipe Pesanan:</span>
                  <p className="font-bold capitalize">{selectedTrx.orderType.replace('_', ' ')} {selectedTrx.tableNumber ? `(${selectedTrx.tableNumber})` : ''}</p>
                </div>
                <div>
                  <span className="text-stone-400">Pelanggan:</span>
                  <p className="font-bold">{selectedTrx.customerName}</p>
                </div>
                <div>
                  <span className="text-stone-400">Kasir:</span>
                  <p className="font-bold">{selectedTrx.cashierName}</p>
                </div>
                <div>
                  <span className="text-stone-400">Metode Bayar:</span>
                  <p className="font-bold uppercase text-amber-700">{selectedTrx.paymentMethod}</p>
                </div>
              </div>

              {selectedTrx.status === 'voided' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Nota Ini Dibatalkan (Void)</span>
                  </p>
                  <p className="text-[11px] mt-0.5">Alasan: {selectedTrx.voidReason || '-'}</p>
                </div>
              )}

              {/* Items List */}
              <div className="border border-stone-200 rounded-2xl p-3 divide-y divide-stone-100">
                <span className="font-bold text-[11px] text-stone-500 uppercase tracking-wider block mb-2">
                  Daftar Makanan & Minuman
                </span>
                {selectedTrx.items.map((i, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-900">{i.name}</p>
                      <p className="text-stone-500 text-[11px]">
                        {i.quantity} x {formatRupiah(i.price)}
                        {i.discount > 0 && ` (Disc: -${formatRupiah(i.discount)})`}
                      </p>
                      {i.note && <p className="text-[10px] text-amber-700 italic">Catatan: {i.note}</p>}
                    </div>
                    <span className="font-bold font-mono text-stone-900">
                      {formatRupiah(i.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="p-3 bg-stone-50 rounded-2xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal:</span>
                  <span className="font-mono">{formatRupiah(selectedTrx.subtotal)}</span>
                </div>
                {selectedTrx.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedTrx.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-600">PB1 (10%):</span>
                  <span className="font-mono">{formatRupiah(selectedTrx.tax)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-stone-200 text-stone-900">
                  <span>Total Transaksi:</span>
                  <span className="font-mono text-amber-600">{formatRupiah(selectedTrx.total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
              {selectedTrx.status !== 'voided' && (
                <button
                  onClick={() => setVoidingTrx(selectedTrx)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Void (Batalkan Nota)</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <a
                  href={`https://wa.me/?text=${generateWhatsAppReceiptText(selectedTrx)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => onReprint(selectedTrx)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cetak Struk</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Void Reason Confirmation Modal */}
      {voidingTrx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-stone-900 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-black text-base text-stone-900">Batalkan Nota (Void)?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Nota <span className="font-bold">{voidingTrx.orderNumber}</span> akan dibatalkan. Seluruh porsi makanan & stok akan otomatis dikembalikan ke inventaris.
              </p>
            </div>

            <form onSubmit={handleConfirmVoid} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Alasan Pembatalan</label>
                <textarea
                  required
                  rows={2}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Ketik alasan pembatalan..."
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidingTrx(null)}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Konfirmasi Void & Kembalikan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

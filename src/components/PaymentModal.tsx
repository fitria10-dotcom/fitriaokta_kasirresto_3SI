import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah, generateWhatsAppReceiptText, executeThermalPrint } from '../utils/printer';
import { generateQRISData, QRISDetails } from '../utils/qris';
import { PaymentMethod, Transaction } from '../types/pos';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Banknote,
  CreditCard,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  X,
  Timer,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (trx: Transaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onViewReceipt,
}) => {
  const {
    cart,
    cartTotal,
    cartSubtotal,
    cartTax,
    cartDiscount,
    orderType,
    selectedTable,
    customerName,
    completeTransaction,
    autoPrintReceipt,
    setAutoPrintReceipt,
    printer,
  } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [cashReceived, setCashReceived] = useState<number>(cartTotal);
  const [cashInputString, setCashInputString] = useState<string>(cartTotal.toString());
  const [cardBank, setCardBank] = useState('BCA');
  const [cardTraceNo, setCardTraceNo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTrx, setCompletedTrx] = useState<Transaction | null>(null);

  // QRIS state
  const [qrisDetails, setQrisDetails] = useState<QRISDetails | null>(null);
  const [qrisTimer, setQrisTimer] = useState(300); // 5 minutes countdown
  const [qrisStatus, setQrisStatus] = useState<'waiting' | 'paid'>('waiting');

  // Generate QRIS code on mount / when cartTotal changes
  useEffect(() => {
    if (isOpen && cartTotal > 0) {
      const orderRef = `ORD${Date.now().toString().slice(-6)}`;
      generateQRISData(cartTotal, orderRef).then((data) => {
        setQrisDetails(data);
      });
      setQrisTimer(300);
      setQrisStatus('waiting');
      setCompletedTrx(null);
      setCashReceived(cartTotal);
      setCashInputString(cartTotal.toString());
    }
  }, [isOpen, cartTotal]);

  // QRIS timer countdown
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'qris' || completedTrx) return;
    const interval = setInterval(() => {
      setQrisTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, paymentMethod, completedTrx]);

  if (!isOpen) return null;

  const handleCashInputChange = (val: string) => {
    setCashInputString(val);
    const num = parseInt(val) || 0;
    setCashReceived(num);
  };

  const setPresetCash = (amount: number) => {
    setCashReceived(amount);
    setCashInputString(amount.toString());
  };

  const cashChange = Math.max(0, cashReceived - cartTotal);
  const isCashInsufficient = cashReceived < cartTotal;

  // Execute checkout
  const handleCheckout = async (simulatedQRIS = false) => {
    if (cart.length === 0 || isProcessing) return;

    if (paymentMethod === 'cash' && isCashInsufficient) {
      return;
    }

    setIsProcessing(true);

    try {
      let qrisRef = undefined;
      if (paymentMethod === 'qris') {
        qrisRef = `QRIS-${Date.now().toString().slice(-8)}`;
      }

      const trx = await completeTransaction(paymentMethod, {
        cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
        cashChange: paymentMethod === 'cash' ? cashChange : undefined,
        qrisRef,
      });

      setCompletedTrx(trx);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Checkout error', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format timer MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 select-none">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              Rp
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {completedTrx ? 'Pembayaran Berhasil' : 'Pembayaran Kasir'}
              </h3>
              <p className="text-xs text-stone-400">
                {orderType.toUpperCase()} {selectedTable ? `· ${selectedTable}` : ''} · {customerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Screen */}
        {completedTrx ? (
          <div className="p-6 text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-xl font-black text-stone-900">Transaksi Selesai!</h4>
              <p className="text-xs text-stone-500 font-mono mt-1">
                No. Nota: <span className="font-bold text-stone-800">{completedTrx.orderNumber}</span>
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-2">
                {formatRupiah(completedTrx.total)}
              </p>
              <p className="text-xs text-stone-500">
                Metode: <span className="font-semibold uppercase">{completedTrx.paymentMethod}</span>
                {completedTrx.paymentMethod === 'cash' && (
                  <span> · Kembalian: {formatRupiah(completedTrx.cashChange || 0)}</span>
                )}
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onViewReceipt(completedTrx)}
                  className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
                >
                  <Printer className="w-4 h-4 text-stone-600" />
                  <span>Lihat / Cetak Struk</span>
                </button>

                <a
                  href={`https://wa.me/?text=${generateWhatsAppReceiptText(completedTrx)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim WhatsApp</span>
                </a>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm"
              >
                Selesai & Buat Pesanan Baru
              </button>
            </div>
          </div>
        ) : (
          /* Payment Processing Form */
          <div className="flex-1 overflow-y-auto flex flex-col">
            
            {/* Amount Banner */}
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Total Tagihan
                </p>
                <p className="text-2xl font-black text-stone-900">
                  {formatRupiah(cartTotal)}
                </p>
              </div>
              <div className="text-right text-xs text-stone-500">
                <p>{cart.reduce((a, b) => a + b.quantity, 0)} Item</p>
                <p className="font-mono text-[10px]">PPN 10%: {formatRupiah(cartTax)}</p>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="p-3 bg-stone-100 border-b border-stone-200 grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('qris')}
                className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'qris'
                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>QRIS Dinamis</span>
              </button>

              <button
                onClick={() => setPaymentMethod('cash')}
                className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Uang Tunai (Cash)</span>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`py-2.5 px-2 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Debit / EDC</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="p-4 sm:p-5 flex-1">
              
              {/* 1. QRIS TAB */}
              {paymentMethod === 'qris' && (
                <div className="flex flex-col items-center text-center space-y-3">
                  
                  {/* Standard QRIS Card Shell */}
                  <div className="bg-white border-2 border-stone-800 rounded-2xl p-4 shadow-lg w-full max-w-xs">
                    {/* QRIS Header */}
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-rose-600 text-sm tracking-wider">QRIS</span>
                        <span className="text-[9px] bg-rose-100 text-rose-800 px-1 font-bold rounded">
                          GPN
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-stone-500 font-mono">
                        NMID: ID1020023456789
                      </span>
                    </div>

                    <p className="font-extrabold text-xs text-stone-900 uppercase">
                      Dapur Rasa Nusantara
                    </p>
                    <p className="text-[10px] text-stone-500">Jakarta Selatan</p>

                    {/* QR Image */}
                    <div className="my-2 p-2 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-center">
                      {qrisDetails?.dataUrl ? (
                        <img
                          src={qrisDetails.dataUrl}
                          alt="QRIS Code"
                          className="w-48 h-48 object-contain"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-stone-400 text-xs">
                          Membuat QRIS...
                        </div>
                      )}
                    </div>

                    {/* Nominal & Timer */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200">
                      <span className="font-black text-stone-900 text-sm">
                        {formatRupiah(cartTotal)}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <Timer className="w-3 h-3 animate-spin" />
                        <span>{formatTimer(qrisTimer)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 max-w-xs">
                    Dapat discan memakai BCA Mobile, Livin Mandiri, GoPay, OVO, ShopeePay, DANA, dan semua aplikasi perbankan.
                  </p>

                  {/* Simulate customer paid button */}
                  <button
                    onClick={() => handleCheckout(true)}
                    disabled={isProcessing}
                    className="w-full max-w-xs py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isProcessing ? 'Memproses...' : 'Simulasi Scan & Bayar Sukses'}</span>
                  </button>
                </div>
              )}

              {/* 2. CASH TAB */}
              {paymentMethod === 'cash' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Uang Diterima dari Pelanggan (Rp)
                    </label>
                    <input
                      type="number"
                      value={cashInputString}
                      onChange={(e) => handleCashInputChange(e.target.value)}
                      placeholder="Masukkan jumlah uang tunai"
                      className="w-full text-xl font-bold p-3 border border-stone-300 rounded-xl focus:outline-none focus:border-emerald-500 text-stone-900"
                      autoFocus
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <span className="text-[11px] font-medium text-stone-500 block mb-1.5">
                      Pilihan Uang Cepat:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      <button
                        type="button"
                        onClick={() => setPresetCash(cartTotal)}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-200"
                      >
                        Uang Pas
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCash(50000)}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-200"
                      >
                        50.000
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCash(100000)}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-200"
                      >
                        100.000
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCash(200000)}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-200"
                      >
                        200.000
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCash(cartTotal + 10000 - (cartTotal % 10000 || 10000))}
                        className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-200"
                      >
                        Genap
                      </button>
                    </div>
                  </div>

                  {/* Change Calculation Box */}
                  <div
                    className={`p-4 rounded-2xl border transition-colors ${
                      isCashInsufficient
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold">
                          {isCashInsufficient ? 'Uang Kurang' : 'Kembalian'}
                        </span>
                        <p className="text-2xl font-black">
                          {isCashInsufficient
                            ? formatRupiah(cartTotal - cashReceived)
                            : formatRupiah(cashChange)}
                        </p>
                      </div>
                      {isCashInsufficient ? (
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      )}
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={() => handleCheckout()}
                    disabled={isCashInsufficient || isProcessing}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold rounded-xl shadow-md text-sm transition-all"
                  >
                    {isProcessing ? 'Menyimpan Transaksi...' : 'Konfirmasi Pembayaran Tunai'}
                  </button>
                </div>
              )}

              {/* 3. CARD / EDC TAB */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Pilih Mesin EDC / Bank
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['BCA', 'Mandiri', 'BRI', 'BNI'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setCardBank(bank)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            cardBank === bank
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-300'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      No. Referensi / Trace No (Opsional)
                    </label>
                    <input
                      type="text"
                      value={cardTraceNo}
                      onChange={(e) => setCardTraceNo(e.target.value)}
                      placeholder="cth: 009821"
                      className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => handleCheckout()}
                    disabled={isProcessing}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md text-sm transition-all"
                  >
                    {isProcessing ? 'Menyimpan...' : 'Konfirmasi Gesek Kartu Selesai'}
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Options (Auto print toggle) */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-400 w-4 h-4"
                />
                <span>Cetak struk fisik otomatis ke printer thermal ({printer.paperWidth})</span>
              </label>

              <button
                type="button"
                onClick={executeThermalPrint}
                className="text-stone-500 hover:text-stone-800 underline text-[11px] flex items-center gap-1"
              >
                <Printer className="w-3 h-3" />
                Tes Cetak
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

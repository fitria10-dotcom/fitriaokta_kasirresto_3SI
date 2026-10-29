import React from 'react';
import { Transaction } from '../types/pos';
import { formatRupiah, formatDateTime, generateWhatsAppReceiptText, executeThermalPrint } from '../utils/printer';
import { Printer, Share2, Copy, X, Check } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!transaction) return null;

  const handleCopy = () => {
    const text = decodeURIComponent(generateWhatsAppReceiptText(transaction));
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 select-none">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Action Header */}
        <div className="p-3 bg-stone-900 text-white flex items-center justify-between">
          <span className="font-bold text-xs flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Struk Kasir (Thermal 58mm)</span>
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-stone-100 flex justify-center">
          
          {/* Printable Element with 58mm thermal styling */}
          <div
            id="thermal-receipt-printable"
            className="bg-white text-stone-900 p-4 rounded-lg shadow-sm border border-stone-200 w-full max-w-[320px] font-receipt text-xs leading-relaxed"
          >
            {/* Header Store Info */}
            <div className="text-center pb-2 border-b border-dashed border-stone-400">
              <h2 className="font-extrabold text-sm uppercase tracking-wider">
                DAPUR RASA NUSANTARA
              </h2>
              <p className="text-[10px] text-stone-600">
                Jl. Senopati No. 45, Kebayoran Baru
              </p>
              <p className="text-[10px] text-stone-600">
                Jakarta Selatan · Telp: 0812-9988-7766
              </p>
              <p className="text-[10px] text-stone-500 font-mono mt-0.5">NPWP: 81.234.567.8-012.000</p>
            </div>

            {/* Transaction Metadata */}
            <div className="py-2 border-b border-dashed border-stone-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>No. Nota</span>
                <span className="font-bold">{transaction.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal</span>
                <span>{formatDateTime(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe</span>
                <span>
                  {transaction.orderType === 'dine_in'
                    ? `Dine In (${transaction.tableNumber || '-'})`
                    : transaction.orderType === 'take_away'
                    ? 'Take Away'
                    : 'Delivery'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan</span>
                <span>{transaction.customerName}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-2 border-b border-dashed border-stone-400 space-y-1.5">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="flex justify-between font-bold">
                    <span className="line-clamp-1">{item.name}</span>
                    <span>{formatRupiah(item.lineTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-600">
                    <span>
                      {item.quantity} x {formatRupiah(item.price)}
                    </span>
                    {item.discount > 0 && <span>Disc: -{formatRupiah(item.discount)}</span>}
                  </div>
                  {item.note && (
                    <div className="text-[9px] text-stone-500 italic">* {item.note}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Calculation Totals */}
            <div className="py-2 border-b border-dashed border-stone-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon Promo</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Pajak Restoran (PB1 10%)</span>
                <span>{formatRupiah(transaction.tax)}</span>
              </div>
              {transaction.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span>Biaya Layanan</span>
                  <span>{formatRupiah(transaction.serviceCharge)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-stone-300">
                <span>TOTAL BAYAR</span>
                <span>{formatRupiah(transaction.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-stone-400 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>Metode Bayar</span>
                <span className="uppercase">{transaction.paymentMethod}</span>
              </div>
              {transaction.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between">
                    <span>Tunai Diterima</span>
                    <span>{formatRupiah(transaction.cashReceived || transaction.total)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Kembalian</span>
                    <span>{formatRupiah(transaction.cashChange || 0)}</span>
                  </div>
                </>
              )}
              {transaction.paymentMethod === 'qris' && (
                <div className="flex justify-between">
                  <span>Ref QRIS</span>
                  <span className="font-mono text-[10px]">{transaction.qrisRef || 'SUCCESS'}</span>
                </div>
              )}
            </div>

            {/* Footer / Barcode simulation */}
            <div className="text-center pt-3 text-[10px] text-stone-600 space-y-1">
              <p className="font-bold">*** TERIMA KASIH ***</p>
              <p>Selamat menikmati hidangan kami!</p>
              <p className="text-[9px]">Kritik & Saran WA: 0812-9988-7766</p>
              <p className="text-[9px]">Follow IG: @dapurrasa.id</p>

              {/* Barcode representation */}
              <div className="pt-2 flex justify-center">
                <div className="font-mono tracking-widest text-[9px] bg-stone-100 px-3 py-1 rounded">
                  ||| | |||| || ||| |||| | ||
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-stone-200 grid grid-cols-3 gap-2">
          <button
            onClick={() => executeThermalPrint()}
            className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>

          <a
            href={`https://wa.me/?text=${generateWhatsAppReceiptText(transaction)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          <button
            onClick={handleCopy}
            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

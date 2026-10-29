import { Transaction } from '../types/pos';
import { sound } from './sound';

export interface ThermalPrinterDevice {
  id: string;
  name: string;
  type: 'bluetooth' | 'usb' | 'network';
  paperWidth: '58mm' | '80mm';
  status: 'connected' | 'disconnected' | 'printing';
  batteryLevel?: number;
}

export const DEFAULT_PRINTER: ThermalPrinterDevice = {
  id: 'printer-bt-01',
  name: 'Iware C-58BT Thermal Printer (Mobile BT)',
  type: 'bluetooth',
  paperWidth: '58mm',
  status: 'connected',
  batteryLevel: 94,
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateWhatsAppReceiptText(trx: Transaction): string {
  const lines: string[] = [
    `*🧾 STRUK PEMBELIAN - DAPUR RASA NUSANTARA*`,
    `Jl. Senopati No. 45, Jakarta Selatan`,
    `Telp: 0812-9988-7766`,
    `--------------------------------`,
    `No. Nota: *${trx.orderNumber}*`,
    `Waktu   : ${formatDateTime(trx.timestamp)}`,
    `Kasir   : ${trx.cashierName}`,
    `Tipe    : ${trx.orderType === 'dine_in' ? `Dine In (${trx.tableNumber || '-'})` : trx.orderType === 'take_away' ? 'Bawa Pulang (Take Away)' : 'Delivery'}`,
    `Pelanggan: ${trx.customerName}`,
    `--------------------------------`,
    `*RINCIAN PESANAN:*`,
  ];

  trx.items.forEach((item) => {
    lines.push(`• ${item.name}`);
    lines.push(`  ${item.quantity}x @${formatRupiah(item.price)} = *${formatRupiah(item.lineTotal)}*`);
    if (item.note) lines.push(`  (Catatan: ${item.note})`);
  });

  lines.push(`--------------------------------`);
  lines.push(`Subtotal : ${formatRupiah(trx.subtotal)}`);
  if (trx.discount > 0) {
    lines.push(`Diskon   : -${formatRupiah(trx.discount)}`);
  }
  lines.push(`Pajak PB1 (10%): ${formatRupiah(trx.tax)}`);
  if (trx.serviceCharge > 0) {
    lines.push(`Layanan  : ${formatRupiah(trx.serviceCharge)}`);
  }
  lines.push(`*TOTAL BAYAR: ${formatRupiah(trx.total)}*`);
  lines.push(`Metode   : ${trx.paymentMethod.toUpperCase()}`);
  if (trx.paymentMethod === 'cash') {
    lines.push(`Tunai    : ${formatRupiah(trx.cashReceived || trx.total)}`);
    lines.push(`Kembalian: ${formatRupiah(trx.cashChange || 0)}`);
  } else if (trx.paymentMethod === 'qris') {
    lines.push(`Ref QRIS : ${trx.qrisRef || 'SUCCESS'}`);
  }

  lines.push(`--------------------------------`);
  lines.push(`Terima kasih atas kunjungan Anda!`);
  lines.push(`Simpan struk ini sebagai bukti pembayaran yang sah.`);
  lines.push(`Follow IG: @dapurrasa.id`);

  return encodeURIComponent(lines.join('\n'));
}

export function executeThermalPrint(): void {
  sound.playPrinterSound();
  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      console.warn('Print dialog aborted or unsupported', e);
    }
  }, 150);
}

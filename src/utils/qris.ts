import QRCode from 'qrcode';

export interface QRISDetails {
  merchantName: string;
  merchantCity: string;
  nmid: string;
  amount: number;
  qrString: string;
  dataUrl: string;
}

export async function generateQRISData(amount: number, orderNumber: string): Promise<QRISDetails> {
  const merchantName = 'DAPUR RASA NUSANTARA';
  const merchantCity = 'JAKARTA SELATAN';
  const nmid = 'ID1020023456789';
  
  // Format standard QRIS-like payload with tags
  const sanitizedAmount = Math.max(0, Math.round(amount));
  const qrString = `00020101021226590014ID.GO.QRIS.WWW01189360099900010200230215ID1020023456789520458125303360540${sanitizedAmount.toString().length}${sanitizedAmount}5802ID5920${merchantName.padEnd(20, ' ').substring(0, 20)}6015${merchantCity.padEnd(15, ' ').substring(0, 15)}62${(orderNumber.length + 4).toString().padStart(2, '0')}01${orderNumber.length.toString().padStart(2, '0')}${orderNumber}6304`;

  try {
    const dataUrl = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    return {
      merchantName,
      merchantCity,
      nmid,
      amount: sanitizedAmount,
      qrString,
      dataUrl,
    };
  } catch (err) {
    console.error('Failed to generate QRIS QR code', err);
    return {
      merchantName,
      merchantCity,
      nmid,
      amount: sanitizedAmount,
      qrString,
      dataUrl: '',
    };
  }
}

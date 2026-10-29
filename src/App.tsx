import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { NotificationToast } from './components/NotificationToast';
import { POSView } from './components/POSView';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { InventoryView } from './components/InventoryView';
import { DailyReportView } from './components/DailyReportView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { StaffView } from './components/StaffView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { RemoteAdminView } from './components/RemoteAdminView';
import { Transaction } from './types/pos';

const MainLayout: React.FC = () => {
  const { activeView, lastCompletedTransaction } = usePOS();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [viewingReceiptTrx, setViewingReceiptTrx] = useState<Transaction | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans selection:bg-amber-200">
      <Header />
      <OfflineBanner />
      <NotificationToast />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'pos' && (
          <POSView onOpenPayment={() => setIsPaymentOpen(true)} />
        )}
        {activeView === 'inventory' && <InventoryView />}
        {activeView === 'daily_report' && <DailyReportView />}
        {activeView === 'monthly_report' && <MonthlyReportView />}
        {activeView === 'staff' && <StaffView />}
        {activeView === 'history' && (
          <TransactionHistoryView
            onReprint={(trx) => setViewingReceiptTrx(trx)}
          />
        )}
        {activeView === 'remote_admin' && <RemoteAdminView />}
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onViewReceipt={(trx) => {
          setIsPaymentOpen(false);
          setViewingReceiptTrx(trx);
        }}
      />

      {/* Receipt Preview & Thermal Print Modal */}
      <ReceiptModal
        transaction={viewingReceiptTrx}
        onClose={() => setViewingReceiptTrx(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <MainLayout />
    </POSProvider>
  );
}

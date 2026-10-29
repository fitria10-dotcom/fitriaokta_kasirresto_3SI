import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  MenuItem,
  CartItem,
  Transaction,
  Employee,
  CashierShift,
  OrderType,
  PaymentMethod,
  NotificationItem,
  InventoryLog,
} from '../types/pos';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_EMPLOYEES,
  SAMPLE_HISTORICAL_TRANSACTIONS,
} from '../data/initialData';
import { sound } from '../utils/sound';
import { executeThermalPrint, DEFAULT_PRINTER, ThermalPrinterDevice } from '../utils/printer';

export interface DraftOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName: string;
  items: CartItem[];
  total: number;
}

interface POSContextType {
  menuItems: MenuItem[];
  transactions: Transaction[];
  employees: Employee[];
  currentCashier: Employee;
  currentShift: CashierShift | null;
  cart: CartItem[];
  orderType: OrderType;
  selectedTable: string;
  customerName: string;
  isOnline: boolean;
  offlineSimulated: boolean;
  syncQueueCount: number;
  notifications: NotificationItem[];
  autoPrintReceipt: boolean;
  printer: ThermalPrinterDevice;
  draftOrders: DraftOrder[];
  lastCompletedTransaction: Transaction | null;
  activeView: 'pos' | 'inventory' | 'daily_report' | 'monthly_report' | 'staff' | 'history' | 'remote_admin';
  inventoryLogs: InventoryLog[];
  
  // Setters & Actions
  setActiveView: (view: 'pos' | 'inventory' | 'daily_report' | 'monthly_report' | 'staff' | 'history' | 'remote_admin') => void;
  setOrderType: (type: OrderType) => void;
  setSelectedTable: (table: string) => void;
  setCustomerName: (name: string) => void;
  setAutoPrintReceipt: (val: boolean) => void;
  setPrinter: (p: ThermalPrinterDevice) => void;
  
  // Cart Actions
  addToCart: (item: MenuItem, qty?: number) => void;
  updateCartQty: (menuItemId: string, delta: number) => void;
  setCartItemDiscount: (menuItemId: string, discount: number) => void;
  setCartItemNote: (menuItemId: string, note: string) => void;
  removeFromCart: (menuItemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartTax: number;
  cartService: number;
  cartTotal: number;

  // Checkout & Transactions
  completeTransaction: (
    paymentMethod: PaymentMethod,
    details: { cashReceived?: number; cashChange?: number; qrisRef?: string }
  ) => Promise<Transaction>;
  voidTransaction: (transactionId: string, reason: string) => void;
  reprintReceipt: (trx: Transaction) => void;
  setLastCompletedTransaction: (trx: Transaction | null) => void;

  // Drafts
  saveDraft: () => void;
  loadDraft: (draftId: string) => void;
  deleteDraft: (draftId: string) => void;

  // Inventory
  addStock: (itemId: string, qty: number, note?: string) => void;
  addNewMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;

  // Staff & Shift
  openShift: (startingCash: number) => void;
  closeShift: (actualCash: number, notes?: string) => void;
  switchCashier: (employeeId: string, pin: string) => { success: boolean; message: string };
  addEmployee: (emp: Omit<Employee, 'id'>) => void;

  // Offline & Notifications
  toggleOfflineSimulation: () => void;
  triggerPushNotification: (title: string, message: string, type?: NotificationItem['type'], amount?: number) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'rasapos_sync_channel';

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local storage hydrated states
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('rasapos_menu_items');
      return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('rasapos_transactions');
      return saved ? JSON.parse(saved) : SAMPLE_HISTORICAL_TRANSACTIONS;
    } catch {
      return SAMPLE_HISTORICAL_TRANSACTIONS;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('rasapos_employees');
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [currentCashier, setCurrentCashier] = useState<Employee>(() => {
    return employees[0] || INITIAL_EMPLOYEES[0];
  });

  const [currentShift, setCurrentShift] = useState<CashierShift | null>(() => {
    try {
      const saved = localStorage.getItem('rasapos_active_shift');
      if (saved) return JSON.parse(saved);
      // Auto open initial shift for smooth start
      const newShift: CashierShift = {
        id: `shift-${Date.now()}`,
        cashierId: employees[0].id,
        cashierName: employees[0].name,
        startTime: new Date().toISOString(),
        startingCash: 300000,
        totalCashSales: 130900,
        totalQrisSales: 179300,
        totalCardSales: 0,
        expectedCash: 430900,
        status: 'open',
      };
      return newShift;
    } catch {
      return null;
    }
  });

  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(() => {
    try {
      const saved = localStorage.getItem('rasapos_inventory_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>(() => {
    try {
      const saved = localStorage.getItem('rasapos_draft_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('Meja 1');
  const [customerName, setCustomerName] = useState<string>('Pelanggan Umum');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);
  const [printer, setPrinter] = useState<ThermalPrinterDevice>(DEFAULT_PRINTER);
  const [offlineSimulated, setOfflineSimulated] = useState<boolean>(false);
  const [networkOnline, setNetworkOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastCompletedTransaction, setLastCompletedTransaction] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<'pos' | 'inventory' | 'daily_report' | 'monthly_report' | 'staff' | 'history' | 'remote_admin'>('pos');

  // Effective online state
  const isOnline = networkOnline && !offlineSimulated;

  // Persist items
  useEffect(() => {
    localStorage.setItem('rasapos_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('rasapos_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('rasapos_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    if (currentShift) {
      localStorage.setItem('rasapos_active_shift', JSON.stringify(currentShift));
    } else {
      localStorage.removeItem('rasapos_active_shift');
    }
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem('rasapos_inventory_logs', JSON.stringify(inventoryLogs));
  }, [inventoryLogs]);

  useEffect(() => {
    localStorage.setItem('rasapos_draft_orders', JSON.stringify(draftOrders));
  }, [draftOrders]);

  // Sync queue count
  const syncQueueCount = useMemo(() => {
    return transactions.filter(t => t.syncStatus === 'pending_sync').length;
  }, [transactions]);

  // Push notification trigger
  const triggerPushNotification = useCallback((
    title: string,
    message: string,
    type: NotificationItem['type'] = 'sale',
    amount?: number
  ) => {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false,
      amount,
    };

    setNotifications(prev => [newItem, ...prev.slice(0, 49)]);

    // Try HTML5 Web Notification API if permitted
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if ('Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Broadcast Channel for live multi-window / multi-tab real-time sync
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        if (data.type === 'NEW_TRANSACTION') {
          const newTrx: Transaction = data.payload;
          setTransactions(prev => {
            if (prev.some(t => t.id === newTrx.id)) return prev;
            return [newTrx, ...prev];
          });
          // Also notify admin
          triggerPushNotification(
            `💰 Transaksi Baru: ${newTrx.orderNumber}`,
            `Metode: ${newTrx.paymentMethod.toUpperCase()} · Total: Rp ${newTrx.total.toLocaleString('id-ID')} · ${newTrx.customerName}`,
            'sale',
            newTrx.total
          );
          sound.playCashChime();
        } else if (data.type === 'STOCK_UPDATED') {
          setMenuItems(data.payload);
        } else if (data.type === 'SYNC_ALL') {
          setTransactions(data.payload);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    return () => {
      channel?.close();
    };
  }, [triggerPushNotification]);

  // Network listener
  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true);
    };
    const handleOffline = () => {
      setNetworkOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto flush sync queue when back online
  useEffect(() => {
    if (isOnline) {
      setTransactions(prev => {
        const hasPending = prev.some(t => t.syncStatus === 'pending_sync');
        if (!hasPending) return prev;

        const updated = prev.map(t => ({
          ...t,
          syncStatus: 'synced' as const,
        }));

        triggerPushNotification(
          '🔄 Sinkronisasi Berhasil',
          `Data transaksi offline telah tersinkron otomatis ke server cloud pusat.`,
          'sync'
        );

        return updated;
      });
    }
  }, [isOnline, triggerPushNotification]);

  const toggleOfflineSimulation = useCallback(() => {
    setOfflineSimulated(prev => {
      const next = !prev;
      if (next) {
        triggerPushNotification(
          '📡 Mode Offline Aktif',
          'Sistem beroperasi mandiri secara lokal. Semua transaksi akan disimpan di antrean sinkronisasi.',
          'sync'
        );
      } else {
        triggerPushNotification(
          '⚡ Kembali Online',
          'Koneksi internet terhubung. Memulai sinkronisasi real-time...',
          'sync'
        );
      }
      return next;
    });
  }, [triggerPushNotification]);

  // Cart logic
  const addToCart = useCallback((item: MenuItem, qty = 1) => {
    sound.playAddSound();
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i =>
          i.menuItemId === item.id
            ? {
                ...i,
                quantity: i.quantity + qty,
                lineTotal: Math.max(0, (i.quantity + qty) * i.price - i.discount),
              }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          cogs: item.cogs,
          quantity: qty,
          discount: 0,
          lineTotal: item.price * qty,
          image: item.image,
        },
      ];
    });
  }, []);

  const updateCartQty = useCallback((menuItemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...i,
              quantity: newQty,
              lineTotal: Math.max(0, newQty * i.price - i.discount),
            };
          }
          return i;
        })
        .filter((i): i is CartItem => i !== null);
    });
  }, []);

  const setCartItemDiscount = useCallback((menuItemId: string, discount: number) => {
    setCart(prev =>
      prev.map(i =>
        i.menuItemId === menuItemId
          ? {
              ...i,
              discount: Math.max(0, discount),
              lineTotal: Math.max(0, i.quantity * i.price - Math.max(0, discount)),
            }
          : i
      )
    );
  }, []);

  const setCartItemNote = useCallback((menuItemId: string, note: string) => {
    setCart(prev =>
      prev.map(i => (i.menuItemId === menuItemId ? { ...i, note } : i))
    );
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    return cart.reduce((acc, i) => acc + (i.discount || 0), 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    // PB1 10%
    const taxable = Math.max(0, cartSubtotal - cartDiscount);
    return Math.round(taxable * 0.1);
  }, [cartSubtotal, cartDiscount]);

  const cartService = useMemo(() => {
    // Optional 0% or dine_in service fee (0 by default)
    return 0;
  }, []);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - cartDiscount + cartTax + cartService);
  }, [cartSubtotal, cartDiscount, cartTax, cartService]);

  // Save Draft Order
  const saveDraft = useCallback(() => {
    if (cart.length === 0) return;
    const newDraft: DraftOrder = {
      id: `draft-${Date.now()}`,
      orderNumber: `DRF-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      orderType,
      tableNumber: orderType === 'dine_in' ? selectedTable : undefined,
      customerName: customerName || 'Pelanggan',
      items: [...cart],
      total: cartTotal,
    };
    setDraftOrders(prev => [newDraft, ...prev]);
    setCart([]);
    triggerPushNotification(
      '📝 Draft Tersimpan',
      `Pesanan ${newDraft.orderNumber} untuk ${newDraft.customerName} berhasil disimpan.`,
      'sale'
    );
  }, [cart, orderType, selectedTable, customerName, cartTotal, triggerPushNotification]);

  const loadDraft = useCallback((draftId: string) => {
    const draft = draftOrders.find(d => d.id === draftId);
    if (!draft) return;
    setCart(draft.items);
    setOrderType(draft.orderType);
    if (draft.tableNumber) setSelectedTable(draft.tableNumber);
    setCustomerName(draft.customerName);
    setDraftOrders(prev => prev.filter(d => d.id !== draftId));
  }, [draftOrders]);

  const deleteDraft = useCallback((draftId: string) => {
    setDraftOrders(prev => prev.filter(d => d.id !== draftId));
  }, []);

  // Complete Transaction
  const completeTransaction = useCallback(
    async (
      paymentMethod: PaymentMethod,
      details: { cashReceived?: number; cashChange?: number; qrisRef?: string }
    ): Promise<Transaction> => {
      const now = new Date();
      const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
      const serial = (transactions.length + 1).toString().padStart(4, '0');
      const orderNumber = `TRX-${dateCode}-${serial}`;

      const newTransaction: Transaction = {
        id: `trx-${Date.now()}`,
        orderNumber,
        timestamp: now.toISOString(),
        cashierId: currentCashier.id,
        cashierName: currentCashier.name,
        orderType,
        tableNumber: orderType === 'dine_in' ? selectedTable : undefined,
        customerName: customerName.trim() || 'Pelanggan Umum',
        items: [...cart],
        subtotal: cartSubtotal,
        discount: cartDiscount,
        tax: cartTax,
        serviceCharge: cartService,
        total: cartTotal,
        paymentMethod,
        cashReceived: details.cashReceived,
        cashChange: details.cashChange,
        qrisRef: details.qrisRef,
        status: 'completed',
        syncStatus: isOnline ? 'synced' : 'pending_sync',
      };

      // Deduct inventory stock & log
      const newInventoryLogs: InventoryLog[] = [];
      const updatedMenuItems = menuItems.map(menuItem => {
        const cartMatch = cart.find(c => c.menuItemId === menuItem.id);
        if (cartMatch) {
          const oldStock = menuItem.stock;
          const newStock = Math.max(0, oldStock - cartMatch.quantity);
          newInventoryLogs.push({
            id: `inv-${Date.now()}-${menuItem.id}`,
            itemId: menuItem.id,
            itemName: menuItem.name,
            change: -cartMatch.quantity,
            previousStock: oldStock,
            newStock,
            reason: 'sale',
            timestamp: now.toISOString(),
            operator: currentCashier.name,
            note: `Penjualan ${orderNumber}`,
          });

          // Check for low stock warning
          if (newStock <= menuItem.minStock) {
            triggerPushNotification(
              '⚠️ Peringatan Stok Menipis',
              `Stok ${menuItem.name} tersisa ${newStock} ${menuItem.unit}. Segera lakukan restock!`,
              'stock'
            );
          }

          return {
            ...menuItem,
            stock: newStock,
          };
        }
        return menuItem;
      });

      setMenuItems(updatedMenuItems);
      setInventoryLogs(prev => [...newInventoryLogs, ...prev]);

      // Update Shift totals
      setCurrentShift(prev => {
        if (!prev) return null;
        let addCash = 0;
        let addQris = 0;
        let addCard = 0;

        if (paymentMethod === 'cash') addCash = cartTotal;
        else if (paymentMethod === 'qris') addQris = cartTotal;
        else if (paymentMethod === 'card') addCard = cartTotal;

        return {
          ...prev,
          totalCashSales: prev.totalCashSales + addCash,
          totalQrisSales: prev.totalQrisSales + addQris,
          totalCardSales: prev.totalCardSales + addCard,
          expectedCash: prev.expectedCash + addCash,
        };
      });

      // Append transaction
      setTransactions(prev => [newTransaction, ...prev]);
      setLastCompletedTransaction(newTransaction);

      // Play audio chime
      sound.playCashChime();

      // Broadcast to other tabs / remote monitoring dashboard
      try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage({ type: 'NEW_TRANSACTION', payload: newTransaction });
        channel.close();
      } catch {
        // ignore
      }

      // In-app push notification
      triggerPushNotification(
        `✅ Transaksi Berhasil: ${orderNumber}`,
        `Total: Rp ${cartTotal.toLocaleString('id-ID')} (${paymentMethod.toUpperCase()}) - ${newTransaction.customerName}`,
        'sale',
        cartTotal
      );

      // Auto print thermal receipt if enabled
      if (autoPrintReceipt) {
        executeThermalPrint();
      }

      // Reset cart and customer
      setCart([]);
      setCustomerName('Pelanggan Umum');

      return newTransaction;
    },
    [
      transactions.length,
      currentCashier,
      orderType,
      selectedTable,
      customerName,
      cart,
      cartSubtotal,
      cartDiscount,
      cartTax,
      cartService,
      cartTotal,
      isOnline,
      menuItems,
      autoPrintReceipt,
      triggerPushNotification,
    ]
  );

  // Void Transaction
  const voidTransaction = useCallback(
    (transactionId: string, reason: string) => {
      const target = transactions.find(t => t.id === transactionId);
      if (!target || target.status === 'voided') return;

      // Restore inventory
      const restoreLogs: InventoryLog[] = [];
      const updatedMenu = menuItems.map(menuItem => {
        const itemMatch = target.items.find(i => i.menuItemId === menuItem.id);
        if (itemMatch) {
          const oldStock = menuItem.stock;
          const newStock = oldStock + itemMatch.quantity;
          restoreLogs.push({
            id: `inv-void-${Date.now()}-${menuItem.id}`,
            itemId: menuItem.id,
            itemName: menuItem.name,
            change: itemMatch.quantity,
            previousStock: oldStock,
            newStock,
            reason: 'void_return',
            timestamp: new Date().toISOString(),
            operator: currentCashier.name,
            note: `Pembatalan nota ${target.orderNumber}: ${reason}`,
          });
          return { ...menuItem, stock: newStock };
        }
        return menuItem;
      });

      setMenuItems(updatedMenu);
      setInventoryLogs(prev => [...restoreLogs, ...prev]);

      // Mark transaction voided
      setTransactions(prev =>
        prev.map(t =>
          t.id === transactionId
            ? { ...t, status: 'voided', voidReason: reason }
            : t
        )
      );

      // Adjust shift if it was cash
      setCurrentShift(prev => {
        if (!prev) return null;
        if (target.paymentMethod === 'cash') {
          return {
            ...prev,
            totalCashSales: Math.max(0, prev.totalCashSales - target.total),
            expectedCash: Math.max(0, prev.expectedCash - target.total),
          };
        }
        return prev;
      });

      triggerPushNotification(
        '🚫 Transaksi Dibatalkan (Void)',
        `Nota ${target.orderNumber} dibatalkan. Stok barang telah dikembalikan.`,
        'sale'
      );
    },
    [transactions, menuItems, currentCashier.name, triggerPushNotification]
  );

  const reprintReceipt = useCallback((trx: Transaction) => {
    setLastCompletedTransaction(trx);
    executeThermalPrint();
  }, []);

  // Inventory actions
  const addStock = useCallback(
    (itemId: string, qty: number, note = 'Restock barang') => {
      const item = menuItems.find(m => m.id === itemId);
      if (!item) return;

      const oldStock = item.stock;
      const newStock = oldStock + qty;

      setMenuItems(prev =>
        prev.map(m => (m.id === itemId ? { ...m, stock: newStock } : m))
      );

      setInventoryLogs(prev => [
        {
          id: `inv-restock-${Date.now()}`,
          itemId,
          itemName: item.name,
          change: qty,
          previousStock: oldStock,
          newStock,
          reason: 'restock',
          timestamp: new Date().toISOString(),
          operator: currentCashier.name,
          note,
        },
        ...prev,
      ]);

      triggerPushNotification(
        '📦 Restock Berhasil',
        `Stok ${item.name} ditambah +${qty} ${item.unit}. Total sekarang: ${newStock} ${item.unit}.`,
        'stock'
      );
    },
    [menuItems, currentCashier.name, triggerPushNotification]
  );

  const addNewMenuItem = useCallback(
    (item: Omit<MenuItem, 'id'>) => {
      const newItem: MenuItem = {
        ...item,
        id: `menu-${Date.now()}`,
      };
      setMenuItems(prev => [newItem, ...prev]);
      triggerPushNotification(
        '✨ Menu Baru Ditambahkan',
        `${newItem.name} siap dijual di kasir.`,
        'stock'
      );
    },
    [triggerPushNotification]
  );

  const updateMenuItem = useCallback(
    (item: MenuItem) => {
      setMenuItems(prev => prev.map(m => (m.id === item.id ? item : m)));
      triggerPushNotification(
        '✏️ Menu Diperbarui',
        `Perubahan data ${item.name} berhasil disimpan.`,
        'stock'
      );
    },
    [triggerPushNotification]
  );

  const deleteMenuItem = useCallback(
    (itemId: string) => {
      setMenuItems(prev => prev.filter(m => m.id !== itemId));
    },
    []
  );

  // Staff & Shifts
  const openShift = useCallback((startingCash: number) => {
    const newShift: CashierShift = {
      id: `shift-${Date.now()}`,
      cashierId: currentCashier.id,
      cashierName: currentCashier.name,
      startTime: new Date().toISOString(),
      startingCash,
      totalCashSales: 0,
      totalQrisSales: 0,
      totalCardSales: 0,
      expectedCash: startingCash,
      status: 'open',
    };
    setCurrentShift(newShift);
    triggerPushNotification(
      '🟢 Shift Kasir Dibuka',
      `Kasir ${currentCashier.name} telah membuka shift dengan modal awal Rp ${startingCash.toLocaleString('id-ID')}`,
      'shift'
    );
  }, [currentCashier, triggerPushNotification]);

  const closeShift = useCallback(
    (actualCash: number, notes?: string) => {
      if (!currentShift) return;
      const expected = currentShift.expectedCash;
      const diff = actualCash - expected;

      const closed: CashierShift = {
        ...currentShift,
        endTime: new Date().toISOString(),
        actualCash,
        cashDifference: diff,
        status: 'closed',
        notes,
      };

      setCurrentShift(null);
      triggerPushNotification(
        '🔴 Shift Kasir Ditutup',
        `Total Kas Diterima: Rp ${actualCash.toLocaleString('id-ID')} · Selisih: Rp ${diff.toLocaleString('id-ID')}`,
        'shift'
      );
    },
    [currentShift, triggerPushNotification]
  );

  const switchCashier = useCallback(
    (employeeId: string, pin: string) => {
      const emp = employees.find(e => e.id === employeeId);
      if (!emp) return { success: false, message: 'Karyawan tidak ditemukan' };
      if (emp.pin !== pin) return { success: false, message: 'PIN salah' };

      setCurrentCashier(emp);
      triggerPushNotification(
        '👤 Pergantian Kasir',
        `Kasir aktif beralih ke ${emp.name} (${emp.role})`,
        'shift'
      );
      return { success: true, message: 'Berhasil beralih kasir' };
    },
    [employees, triggerPushNotification]
  );

  const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [...prev, newEmp]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <POSContext.Provider
      value={{
        menuItems,
        transactions,
        employees,
        currentCashier,
        currentShift,
        cart,
        orderType,
        selectedTable,
        customerName,
        isOnline,
        offlineSimulated,
        syncQueueCount,
        notifications,
        autoPrintReceipt,
        printer,
        draftOrders,
        lastCompletedTransaction,
        activeView,
        inventoryLogs,
        setActiveView,
        setOrderType,
        setSelectedTable,
        setCustomerName,
        setAutoPrintReceipt,
        setPrinter,
        addToCart,
        updateCartQty,
        setCartItemDiscount,
        setCartItemNote,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartDiscount,
        cartTax,
        cartService,
        cartTotal,
        completeTransaction,
        voidTransaction,
        reprintReceipt,
        setLastCompletedTransaction,
        saveDraft,
        loadDraft,
        deleteDraft,
        addStock,
        addNewMenuItem,
        updateMenuItem,
        deleteMenuItem,
        openShift,
        closeShift,
        switchCashier,
        addEmployee,
        toggleOfflineSimulation,
        triggerPushNotification,
        markNotificationRead,
        clearNotifications,
        requestNotificationPermission,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};

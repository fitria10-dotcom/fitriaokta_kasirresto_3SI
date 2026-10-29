export type OrderType = 'dine_in' | 'take_away' | 'delivery';
export type PaymentMethod = 'qris' | 'cash' | 'card';
export type PaymentStatus = 'completed' | 'voided' | 'draft';
export type EmployeeRole = 'Kasir' | 'Koki / Dapur' | 'Supervisor' | 'Owner / Admin';

export interface MenuItem {
  id: string;
  name: string;
  code: string;
  category: 'Makanan Berat' | 'Snack & Camilan' | 'Minuman' | 'Paket Hemat' | 'Dessert';
  price: number;
  cogs: number; // Cost of Goods Sold (HPP)
  stock: number;
  minStock: number;
  unit: string;
  image: string;
  isPopular?: boolean;
  description?: string;
  isAvailable: boolean;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  cogs: number;
  quantity: number;
  note?: string;
  discount: number; // in rupiah
  lineTotal: number;
  image: string;
}

export interface Transaction {
  id: string;
  orderNumber: string;
  timestamp: string; // ISO date
  cashierId: string;
  cashierName: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number; // e.g. PB1 10%
  serviceCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  cashChange?: number;
  qrisRef?: string;
  status: PaymentStatus;
  voidReason?: string;
  syncStatus: 'synced' | 'pending_sync';
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  pin: string;
  phone: string;
  avatar: string;
  isActive: boolean;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  totalCashSales: number;
  totalQrisSales: number;
  totalCardSales: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  change: number;
  previousStock: number;
  newStock: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'waste' | 'void_return';
  timestamp: string;
  operator: string;
  note?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'sale' | 'stock' | 'sync' | 'shift';
  read: boolean;
  amount?: number;
}

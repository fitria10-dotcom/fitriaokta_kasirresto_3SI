import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah } from '../utils/printer';
import { MenuItem } from '../types/pos';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  ArrowUpDown,
  History,
  TrendingUp,
  DollarSign,
  Edit3,
  X,
  CheckCircle,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    menuItems,
    inventoryLogs,
    addStock,
    addNewMenuItem,
    updateMenuItem,
    currentCashier,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals
  const [restockItem, setRestockItem] = useState<MenuItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [restockNote, setRestockNote] = useState('Restock pengadaan dapur');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // New item form
  const [newItemData, setNewItemData] = useState({
    code: '',
    name: '',
    category: 'Makanan Berat' as MenuItem['category'],
    price: 30000,
    cogs: 13000,
    stock: 25,
    minStock: 8,
    unit: 'porsi',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    description: '',
    isPopular: false,
    isAvailable: true,
  });

  const categories = ['Semua', 'Makanan Berat', 'Snack & Camilan', 'Minuman', 'Paket Hemat', 'Dessert'];

  // Metrics
  const totalItemsCount = menuItems.length;
  const lowStockCount = menuItems.filter(i => i.stock <= i.minStock).length;
  const outOfStockCount = menuItems.filter(i => i.stock <= 0).length;
  const totalCogsAssetValue = menuItems.reduce((acc, i) => acc + i.stock * i.cogs, 0);
  const totalRetailPotentialValue = menuItems.reduce((acc, i) => acc + i.stock * i.price, 0);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q);
      const matchLowStock = onlyLowStock ? item.stock <= item.minStock : true;
      return matchCat && matchSearch && matchLowStock;
    });
  }, [menuItems, selectedCategory, searchQuery, onlyLowStock]);

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restockItem && restockQty > 0) {
      addStock(restockItem.id, restockQty, restockNote);
      setRestockItem(null);
      setRestockQty(20);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name || !newItemData.code) return;

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        ...newItemData,
      });
      setEditingItem(null);
    } else {
      addNewMenuItem(newItemData);
    }

    setShowAddModal(false);
    // Reset form
    setNewItemData({
      code: '',
      name: '',
      category: 'Makanan Berat',
      price: 30000,
      cogs: 13000,
      stock: 25,
      minStock: 8,
      unit: 'porsi',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      description: '',
      isPopular: false,
      isAvailable: true,
    });
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setNewItemData({
      code: item.code,
      name: item.name,
      category: item.category,
      price: item.price,
      cogs: item.cogs,
      stock: item.stock,
      minStock: item.minStock,
      unit: item.unit,
      image: item.image,
      description: item.description || '',
      isPopular: !!item.isPopular,
      isAvailable: item.isAvailable,
    });
    setShowAddModal(true);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            <span>Manajemen Inventaris & Stok Barang</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Pantau stok bahan & porsi makanan secara akurat, cegah kehabisan stok saat jam operasional sibuk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Total Menu Aktif</span>
            <Package className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl font-black text-stone-900">{totalItemsCount}</p>
          <p className="text-[11px] text-stone-500 mt-1">Tersedia di sistem POS</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Stok Kritis / Menipis</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{lowStockCount}</p>
          <p className="text-[11px] text-stone-500 mt-1">{outOfStockCount} menu saat ini kosong</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Nilai Aset Modal (HPP)</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-stone-900">
            {formatRupiah(totalCogsAssetValue)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Modal terikat di gudang</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Potensi Nilai Jual</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">
            {formatRupiah(totalRetailPotentialValue)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Jika seluruh stok terjual</p>
        </div>
      </div>

      {/* Tabs Switcher: Stok vs Riwayat Log */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'border-amber-500 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog & Status Stok ({menuItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-amber-500 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Mutasi & Penyesuaian ({inventoryLogs.length})</span>
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode atau nama makanan..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 cursor-pointer font-semibold whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={onlyLowStock}
                  onChange={(e) => setOnlyLowStock(e.target.checked)}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <span>Hanya Stok Menipis</span>
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Menu & Kode</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Stok Saat Ini</th>
                    <th className="py-3 px-3">Min. Stok</th>
                    <th className="py-3 px-3 text-right">Modal (HPP)</th>
                    <th className="py-3 px-3 text-right">Harga Jual</th>
                    <th className="py-3 px-3 text-center">Margin %</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredItems.map((item) => {
                    const isOut = item.stock <= 0;
                    const isLow = item.stock > 0 && item.stock <= item.minStock;
                    const margin = Math.round(((item.price - item.cogs) / item.price) * 100);

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-stone-900">{item.name}</p>
                              <p className="text-[10px] text-stone-400 font-mono">{item.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-stone-600">{item.category}</td>
                        <td className="py-3 px-3 font-bold text-stone-900">
                          {item.stock} <span className="font-normal text-stone-500">{item.unit}</span>
                        </td>
                        <td className="py-3 px-3 text-stone-500">{item.minStock} {item.unit}</td>
                        <td className="py-3 px-3 text-right text-stone-600 font-mono">
                          {formatRupiah(item.cogs)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-stone-900 font-mono">
                          {formatRupiah(item.price)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                            {margin}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                              Habis
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              Menipis
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Aman
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setRestockItem(item);
                                setRestockQty(20);
                              }}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs"
                              title="Restock Cepat"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Restock</span>
                            </button>

                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                              title="Edit Detail"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Inventory Logs Table */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <span className="font-bold text-xs text-stone-800">
              Catatan Rekam Jejak Penambahan, Pengurangan, & Penjualan Stok
            </span>
            <span className="text-[11px] text-stone-500">{inventoryLogs.length} Entri</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-3">Nama Menu</th>
                  <th className="py-3 px-3 text-center">Perubahan</th>
                  <th className="py-3 px-3 text-center">Stok Awal ➔ Akhir</th>
                  <th className="py-3 px-3">Tipe Mutasi</th>
                  <th className="py-3 px-3">Operator</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inventoryLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-stone-400">
                      Belum ada mutasi stok tercatat. Lakukan transaksi atau restock untuk melihat riwayat.
                    </td>
                  </tr>
                ) : (
                  inventoryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 font-bold text-stone-900">{log.itemName}</td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span
                          className={log.change > 0 ? 'text-emerald-600' : 'text-rose-600'}
                        >
                          {log.change > 0 ? `+${log.change}` : log.change}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-stone-600">
                        {log.previousStock} ➔ {log.newStock}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-stone-100 text-stone-700">
                          {log.reason === 'sale'
                            ? 'Penjualan Kasir'
                            : log.reason === 'restock'
                            ? 'Restock Masuk'
                            : log.reason === 'void_return'
                            ? 'Kembali Void'
                            : log.reason}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-600">{log.operator}</td>
                      <td className="py-3 px-4 text-stone-500 italic">{log.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-500" />
                <span>Restock: {restockItem.name}</span>
              </h3>
              <button
                onClick={() => setRestockItem(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 pt-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between text-xs">
                <div>
                  <span className="text-stone-500">Stok Saat Ini:</span>
                  <p className="text-base font-bold text-stone-900">
                    {restockItem.stock} {restockItem.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-stone-500">Setelah Restock:</span>
                  <p className="text-base font-bold text-emerald-600">
                    {restockItem.stock + restockQty} {restockItem.unit}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Jumlah Tambahan Stok ({restockItem.unit})
                </label>
                <input
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-base font-bold focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {/* Preset buttons */}
                <div className="flex gap-2 mt-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRestockQty(amt)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Catatan / Sumber Supplier
                </label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="cth: Pengadaan pasar induk / Supplier daging"
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl shadow-xs"
                >
                  Konfirmasi Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl text-stone-900 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-base">
                {editingItem ? 'Edit Data Menu' : 'Tambah Menu Makanan / Minuman Baru'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 py-3 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Kode Menu / SKU</label>
                  <input
                    type="text"
                    required
                    value={newItemData.code}
                    onChange={(e) => setNewItemData({ ...newItemData, code: e.target.value.toUpperCase() })}
                    placeholder="cth: NSG-99"
                    className="w-full p-2 border border-stone-300 rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Kategori</label>
                  <select
                    value={newItemData.category}
                    onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value as MenuItem['category'] })}
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  >
                    {categories.filter(c => c !== 'Semua').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                  placeholder="Nama hidangan..."
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newItemData.price}
                    onChange={(e) => setNewItemData({ ...newItemData, price: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-stone-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Harga Modal / HPP (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newItemData.cogs}
                    onChange={(e) => setNewItemData({ ...newItemData, cogs: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-stone-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={newItemData.stock}
                    onChange={(e) => setNewItemData({ ...newItemData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Batas Min. Stok</label>
                  <input
                    type="number"
                    value={newItemData.minStock}
                    onChange={(e) => setNewItemData({ ...newItemData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                    placeholder="porsi / cup"
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">URL Foto Makanan</label>
                <input
                  type="text"
                  value={newItemData.image}
                  onChange={(e) => setNewItemData({ ...newItemData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Deskripsi Hidangan</label>
                <textarea
                  value={newItemData.description}
                  onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={newItemData.isPopular}
                    onChange={(e) => setNewItemData({ ...newItemData, isPopular: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span>Tandai Menu Terlaris / Favorit</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-xs"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah } from '../utils/printer';
import { TABLES } from '../data/initialData';
import { MenuItem } from '../types/pos';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Utensils,
  ShoppingBag,
  Truck,
  RotateCcw,
  FileText,
  CreditCard,
  Layers,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Tag,
  Check,
  X,
} from 'lucide-react';

interface POSViewProps {
  onOpenPayment: () => void;
}

export const POSView: React.FC<POSViewProps> = ({ onOpenPayment }) => {
  const {
    menuItems,
    cart,
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
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    customerName,
    setCustomerName,
    currentCashier,
    draftOrders,
    saveDraft,
    loadDraft,
    deleteDraft,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [editingItemNoteId, setEditingItemNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [editingItemDiscountId, setEditingItemDiscountId] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState('');

  const categories = ['Semua', 'Makanan Berat', 'Snack & Camilan', 'Minuman', 'Paket Hemat', 'Dessert'];

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleOpenNoteModal = (menuItemId: string, currentNote?: string) => {
    setEditingItemNoteId(menuItemId);
    setNoteInput(currentNote || '');
  };

  const handleSaveNote = () => {
    if (editingItemNoteId) {
      setCartItemNote(editingItemNoteId, noteInput.trim());
      setEditingItemNoteId(null);
    }
  };

  const handleOpenDiscountModal = (menuItemId: string, currentDiscount?: number) => {
    setEditingItemDiscountId(menuItemId);
    setDiscountInput(currentDiscount ? currentDiscount.toString() : '');
  };

  const handleSaveDiscount = () => {
    if (editingItemDiscountId) {
      const disc = Math.max(0, parseInt(discountInput) || 0);
      setCartItemDiscount(editingItemDiscountId, disc);
      setEditingItemDiscountId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] overflow-hidden bg-stone-100">
      {/* LEFT SECTION: Bill & Cart Panel (Tablet POS layout) */}
      <div className="w-full lg:w-[480px] xl:w-[540px] flex flex-col bg-white border-r border-stone-200 shadow-sm z-10 shrink-0">
        
        {/* Top Control Bar: Running Orders & Order Type buttons */}
        <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2 text-xs">
          {/* Running Orders Button */}
          <button
            onClick={() => setShowDraftModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm transition-colors shrink-0"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Running Orders</span>
            {draftOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-rose-600 text-[10px] font-extrabold flex items-center justify-center">
                {draftOrders.length}
              </span>
            )}
          </button>

          {/* Order Type Segmented Buttons */}
          <div className="flex items-center bg-stone-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                orderType === 'dine_in'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>Dine In</span>
            </button>
            <button
              onClick={() => setOrderType('take_away')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                orderType === 'take_away'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>Take Away</span>
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors ${
                orderType === 'delivery'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Delivery</span>
            </button>
          </div>
        </div>

        {/* Secondary Bar: Table & Customer Inputs */}
        <div className="px-3 py-2 bg-stone-100/60 border-b border-stone-200 flex items-center gap-2 text-xs">
          {orderType === 'dine_in' && (
            <div className="w-1/3">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                aria-label="Pilih Meja Restoran"
                className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                {TABLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <span className="text-stone-400 font-medium">Tamu:</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Pelanggan Umum"
              className="w-full text-xs font-medium text-stone-900 focus:outline-none bg-transparent"
            />
          </div>

          <div className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-semibold text-[11px] shrink-0">
            {currentCashier.name.split(' ')[0]}
          </div>
        </div>

        {/* Order Items List Header */}
        <div className="px-3 py-2 bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500 grid grid-cols-12 gap-1 uppercase tracking-wider">
          <div className="col-span-5">Item Menu</div>
          <div className="col-span-2 text-right">Harga</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1 text-center">Aksi</div>
        </div>

        {/* Order Items Scrollable Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2 space-y-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-300 mb-3">
                <Utensils className="w-7 h-7" />
              </div>
              <p className="font-semibold text-stone-700 text-sm">Pesanan Masih Kosong</p>
              <p className="text-xs text-stone-500 max-w-xs mt-1">
                Pilih menu di panel kanan untuk menambahkan makanan atau minuman ke daftar kasir.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menuItemId}
                className="p-2 rounded-xl hover:bg-stone-50/80 transition-colors border border-transparent hover:border-stone-200/60"
              >
                <div className="grid grid-cols-12 gap-1 items-center">
                  {/* Name and notes preview */}
                  <div className="col-span-5 pr-1">
                    <p className="font-bold text-xs text-stone-900 leading-snug line-clamp-2">
                      {item.name}
                    </p>
                    {item.note && (
                      <p className="text-[10px] text-amber-700 italic flex items-center gap-1 mt-0.5">
                        <span>📝 {item.note}</span>
                      </p>
                    )}
                    {item.discount > 0 && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                        Diskon: -{formatRupiah(item.discount)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleOpenNoteModal(item.menuItemId, item.note)}
                        className="text-[10px] text-stone-400 hover:text-amber-600 underline flex items-center gap-0.5"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        Catatan
                      </button>
                      <button
                        onClick={() => handleOpenDiscountModal(item.menuItemId, item.discount)}
                        className="text-[10px] text-stone-400 hover:text-amber-600 underline flex items-center gap-0.5"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        Diskon
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right text-xs text-stone-600 font-medium">
                    {formatRupiah(item.price)}
                  </div>

                  {/* Qty +/- Stepper */}
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <button
                      onClick={() => updateCartQty(item.menuItemId, -1)}
                      className="w-6 h-6 rounded-md bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-700 flex items-center justify-center transition-transform"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.menuItemId, 1)}
                      className="w-6 h-6 rounded-md bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-700 flex items-center justify-center transition-transform"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="col-span-2 text-right text-xs font-bold text-stone-900">
                    {formatRupiah(item.lineTotal)}
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="text-stone-300 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Calculation Footer (Inspired by reference UI) */}
        <div className="bg-stone-50 border-t border-stone-200 p-3.5 space-y-2">
          {/* Detailed summary */}
          <div className="text-xs space-y-1 text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal Pesanan</span>
              <span className="font-medium text-stone-900">{formatRupiah(cartSubtotal)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Total Diskon</span>
                <span>-{formatRupiah(cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pajak Restoran (PB1 10%)</span>
              <span className="font-medium text-stone-900">{formatRupiah(cartTax)}</span>
            </div>
            {cartService > 0 && (
              <div className="flex justify-between">
                <span>Biaya Layanan</span>
                <span className="font-medium text-stone-900">{formatRupiah(cartService)}</span>
              </div>
            )}
          </div>

          {/* Grand Total Big Display */}
          <div className="p-3 bg-stone-900 rounded-xl text-white flex items-center justify-between shadow-md">
            <div>
              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Total Harus Dibayar</p>
              <p className="text-xl font-extrabold text-amber-400 tracking-tight">
                {formatRupiah(cartTotal)}
              </p>
            </div>
            <div className="text-right text-[11px] text-stone-400">
              <p>{cart.reduce((a, b) => a + b.quantity, 0)} Porsi/Item</p>
              <p className="text-stone-300 font-medium">{orderType.toUpperCase()}</p>
            </div>
          </div>

          {/* Action Buttons Row (Cancel, Draft, Quick, Place Order) */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-xs">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="py-2.5 px-2 bg-stone-200 hover:bg-stone-300 disabled:opacity-50 text-stone-700 font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>

            <button
              onClick={saveDraft}
              disabled={cart.length === 0}
              className="py-2.5 px-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Draft</span>
            </button>

            <button
              onClick={onOpenPayment}
              disabled={cart.length === 0}
              className="py-2.5 px-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-colors shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Bayar Cepat</span>
            </button>

            <button
              onClick={onOpenPayment}
              disabled={cart.length === 0}
              className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl flex items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all animate-none active:scale-95"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Bayar (Place)</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Menu Catalog & Categories */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-100">
        
        {/* Search & Category Filter Toolbar */}
        <div className="p-3 bg-white border-b border-stone-200 space-y-2.5">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari makanan, minuman, atau kode menu (cth: NSG-01)..."
                className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Total items badge */}
            <div className="px-3 py-2 bg-stone-100 rounded-xl text-stone-600 font-semibold text-xs shrink-0">
              {filteredMenuItems.length} Menu
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredMenuItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
              <AlertCircle className="w-8 h-8 text-stone-300 mb-2" />
              <p className="font-semibold text-stone-700 text-sm">Menu tidak ditemukan</p>
              <p className="text-xs text-stone-500">Coba gunakan kata kunci pencarian atau kategori lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredMenuItems.map((item) => {
                const isOutOfStock = item.stock <= 0;
                const isLowStock = item.stock > 0 && item.stock <= item.minStock;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    className={`group bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col cursor-pointer select-none relative ${
                      isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'active:scale-98'
                    }`}
                  >
                    {/* Item Image with realistic aspect ratio */}
                    <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Popular tag */}
                      {item.isPopular && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 font-black text-[10px] shadow-xs flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          FAVORIT
                        </div>
                      )}

                      {/* Stock Status Badge */}
                      <div className="absolute bottom-2 right-2">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-bold text-[10px]">
                            Sisa {item.stock}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-stone-900/80 backdrop-blur-xs text-white font-medium text-[10px]">
                            Stok {item.stock}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-0.5">
                          <span>{item.code}</span>
                          <span>{item.category}</span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
                          {item.name}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="font-extrabold text-sm text-stone-900">
                          {formatRupiah(item.price)}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors shadow-2xs">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Note Editing Modal */}
      {editingItemNoteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl text-stone-900">
            <h4 className="font-bold text-sm mb-2">Tambahkan Catatan Khusus</h4>
            <p className="text-xs text-stone-500 mb-3">
              Contoh: Pedas level 3, jangan pakai seledri, es sedikit, pisahkan saus.
            </p>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Ketik catatan di sini..."
              rows={3}
              className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setEditingItemNoteId(null)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 text-stone-950 rounded-lg hover:bg-amber-400"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Editing Modal */}
      {editingItemDiscountId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl text-stone-900">
            <h4 className="font-bold text-sm mb-2">Potongan Diskon Item (Rp)</h4>
            <input
              type="number"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="Jumlah diskon (Rp)"
              className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingItemDiscountId(null)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSaveDiscount}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 text-stone-950 rounded-lg hover:bg-amber-400"
              >
                Terapkan Diskon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Running Orders / Drafts Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl text-stone-900 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base">Running Orders / Pesanan Tertunda ({draftOrders.length})</h3>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 py-2 space-y-2">
              {draftOrders.length === 0 ? (
                <div className="text-center py-10 text-stone-400">
                  <p className="text-xs">Tidak ada running order saat ini.</p>
                </div>
              ) : (
                draftOrders.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-3 rounded-xl border border-stone-200 hover:border-amber-400 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">{draft.orderNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 font-medium text-stone-600">
                          {draft.orderType.toUpperCase()} {draft.tableNumber ? `· ${draft.tableNumber}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Tamu: <span className="font-medium text-stone-800">{draft.customerName}</span> ·{' '}
                        {draft.items.length} item
                      </p>
                      <p className="font-extrabold text-xs text-amber-700 mt-1">
                        {formatRupiah(draft.total)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Hapus Draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          loadDraft(draft.id);
                          setShowDraftModal(false);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg"
                      >
                        Buka Pesanan
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

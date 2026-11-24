'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  History,
  CreditCard,
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { calculateCartTotals, formatCurrency, formatShortDate } from '../utils/calculations';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { getPaymentMethodLabel } from '../components/common/StatusDisplay';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import type { PaymentMethod, ProductCategory, Sale, SaleItem } from '../types/workshop';

const CATEGORIES: ('Todas' | ProductCategory)[] = [
  'Todas',
  'Lubricantes',
  'Frenos',
  'Transmisión',
  'Filtros',
  'Eléctrico',
  'Neumáticos',
  'Accesorios',
];

export const SalesPosPage: React.FC = () => {
  const { products, customers, sales, settings, completeSale } = useWorkshop();
  const sym = settings.currencySymbol;

  const [activeTab, setActiveTab] = useState<'pos' | 'historial'>('pos');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'Todas' | ProductCategory>('Todas');

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [customerId, setCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');

  const [confirmedSale, setConfirmedSale] = useState<Sale | null>(null);
  const [selectedHistorySale, setSelectedHistorySale] = useState<Sale | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'Todas' && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    });
  }, [products, search, category]);

  const cartTotals = useMemo(
    () => calculateCartTotals(cart, discount),
    [cart, discount]
  );

  const addToCart = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || prod.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        if (existing.quantity >= prod.stock) return prev;
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          quantity: 1,
          unitPrice: prod.salePrice,
          unitCost: prod.costPrice,
        },
      ];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    const maxStock = prod?.stock ?? 99;
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = Math.min(maxStock, item.quantity + delta);
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const customer = customers.find((c) => c.id === customerId);
    const sale = completeSale({
      customerName: customer ? customer.name : 'Cliente Mostrador',
      customerId: customer?.id,
      items: cart,
      discount: cartTotals.discountAmount,
      total: cartTotals.total,
      paymentMethod,
    });
    setCart([]);
    setDiscount(0);
    setCustomerId('');
    setMobileCartOpen(false);
    setConfirmedSale(sale);
  };

  const renderCartPanel = () => (
    <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-rose-600" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Carrito de venta ({cartTotals.itemCount})
          </h2>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => setCart([])}
            className="text-xs font-medium text-slate-500 hover:text-rose-600"
          >
            Vaciar
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[380px]">
        {cart.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
            Selecciona repuestos o lubricantes del catálogo para iniciar una venta rápida.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {cart.map((item) => (
              <li key={item.productId} className="py-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {item.name}
                  </p>
                  <p className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatCurrency(item.unitPrice, sym)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, -1)}
                    aria-label={`Disminuir cantidad de ${item.name}`}
                    className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Minus className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <span className="font-mono-num text-xs font-bold w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, 1)}
                    aria-label={`Aumentar cantidad de ${item.name}`}
                    className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, -item.quantity)}
                    aria-label={`Eliminar ${item.name} del carrito`}
                    className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F141C] space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="pos-customer" className="block text-[11px] font-medium text-slate-500 mb-1">
              Cliente
            </label>
            <select
              id="pos-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="">Mostrador</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pos-discount" className="block text-[11px] font-medium text-slate-500 mb-1">
              Descuento ({sym})
            </label>
            <input
              id="pos-discount"
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-slate-500 mb-1.5">
            Método de pago
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {settings.paymentMethods
              .filter((m) => m.enabled)
              .map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`px-2.5 py-2 text-[11px] font-semibold rounded-lg border transition-colors whitespace-nowrap truncate ${
                    paymentMethod === method.id
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-rose-600 dark:border-rose-600'
                      : 'bg-white dark:bg-[#131822] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {getPaymentMethodLabel(method.id)}
                </button>
              ))}
          </div>
        </div>

        <dl className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <dt>Subtotal</dt>
            <dd className="font-mono-num">{formatCurrency(cartTotals.subtotal, sym)}</dd>
          </div>
          {cartTotals.discountAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <dt>Descuento</dt>
              <dd className="font-mono-num">-{formatCurrency(cartTotals.discountAmount, sym)}</dd>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1">
            <dt>Total a cobrar</dt>
            <dd className="font-mono-num">{formatCurrency(cartTotals.total, sym)}</dd>
          </div>
        </dl>

        <button
          type="button"
          disabled={cart.length === 0}
          onClick={handleCheckout}
          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-45 disabled:cursor-not-allowed rounded-lg inline-flex items-center justify-center gap-2 transition-colors min-h-[42px]"
        >
          <CreditCard className="w-4 h-4" aria-hidden="true" />
          Confirmar venta ({formatCurrency(cartTotals.total, sym)})
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Vistas del módulo de ventas"
          className="inline-flex items-center p-1 bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pos'}
            onClick={() => setActiveTab('pos')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'pos'
                ? 'bg-slate-900 text-white dark:bg-rose-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
            Punto de venta (POS)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'historial'}
            onClick={() => setActiveTab('historial')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'historial'
                ? 'bg-slate-900 text-white dark:bg-rose-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            Historial de ventas ({sales.length})
          </button>
        </div>

        {activeTab === 'pos' && (
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-rose-600 rounded-lg"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            Carrito ({cartTotals.itemCount}) · {formatCurrency(cartTotals.total, sym)}
          </button>
        )}
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Product Selection Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <label htmlFor="pos-search" className="sr-only">
                  Buscar repuesto por nombre, marca o SKU
                </label>
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="pos-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto, marca o código SKU..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="inline-flex items-center gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      category === cat
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-rose-600 dark:border-rose-600'
                        : 'bg-white dark:bg-[#131822] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <EmptyState
                title="Sin resultados en catálogo"
                description="Prueba con otro término de búsqueda o selecciona 'Todas' las categorías."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredProducts.map((prod) => {
                  const inCart = cart.find((c) => c.productId === prod.id);
                  const outOfStock = prod.stock <= 0;
                  return (
                    <div
                      key={prod.id}
                      className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900 overflow-hidden">
                        <ImageWithFallback
                          src={prod.imageUrl}
                          alt={prod.name}
                          fallbackLabel={prod.brand}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {prod.category} · <span className="font-mono-num">{prod.sku}</span>
                          </p>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-2">
                            {prod.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="font-mono-num text-sm font-bold text-slate-900 dark:text-white">
                              {formatCurrency(prod.salePrice, sym)}
                            </p>
                            <p
                              className={`text-[11px] font-mono-num ${
                                prod.stock <= prod.minStock
                                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              Stock: {prod.stock} u.
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() => addToCart(prod.id)}
                            aria-label={`Agregar ${prod.name} al carrito`}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            {inCart ? `Añadir (${inCart.quantity})` : 'Añadir'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Sticky Cart */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            {renderCartPanel()}
          </aside>
        </div>
      ) : (
        /* Sales History View */
        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F141C] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Comprobante</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Artículos</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-5 font-mono-num font-bold text-rose-600 dark:text-rose-400">
                      <button
                        type="button"
                        onClick={() => setSelectedHistorySale(sale)}
                        className="hover:underline"
                      >
                        {sale.code}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatShortDate(sale.date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {sale.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {sale.items.reduce((s, i) => s + i.quantity, 0)} producto(s)
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </td>
                    <td className="py-3 px-5 text-right font-mono-num font-bold text-slate-900 dark:text-white">
                      {formatCurrency(sale.total, sym)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {sales.map((sale) => (
              <button
                key={sale.id}
                type="button"
                onClick={() => setSelectedHistorySale(sale)}
                className="w-full text-left p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-mono-num text-xs font-bold text-rose-600 dark:text-rose-400">
                    {sale.code}
                  </p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                    {sale.customerName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatShortDate(sale.date)} · {getPaymentMethodLabel(sale.paymentMethod)}
                  </p>
                </div>
                <span className="font-mono-num text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(sale.total, sym)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Cart Modal */}
      <Modal
        open={mobileCartOpen}
        onClose={() => setMobileCartOpen(false)}
        title="Resumen de venta rápida"
      >
        {renderCartPanel()}
      </Modal>

      {/* Sale Confirmation Modal */}
      <Modal
        open={Boolean(confirmedSale)}
        onClose={() => setConfirmedSale(null)}
        title="Venta registrada con éxito"
        subtitle="Comprobante demostrativo generado en sesión local"
      >
        {confirmedSale && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
              <div className="text-xs">
                <p className="font-bold">Comprobante {confirmedSale.code}</p>
                <p>Stock actualizado y agregado al historial de ventas.</p>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente</span>
                <span className="font-semibold">{confirmedSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Método de pago</span>
                <span className="font-semibold">
                  {getPaymentMethodLabel(confirmedSale.paymentMethod)}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1">
                {confirmedSale.items.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono-num">
                      {formatCurrency(item.unitPrice * item.quantity, sym)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total pagado</span>
                <span className="font-mono-num">{formatCurrency(confirmedSale.total, sym)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmedSale(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-rose-600 rounded-lg"
              >
                Nueva venta
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* History Detail Modal */}
      <Modal
        open={Boolean(selectedHistorySale)}
        onClose={() => setSelectedHistorySale(null)}
        title={`Detalle de venta · ${selectedHistorySale?.code ?? ''}`}
      >
        {selectedHistorySale && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha</span>
              <span>{formatShortDate(selectedHistorySale.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente</span>
              <span className="font-semibold">{selectedHistorySale.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vendedor</span>
              <span>{selectedHistorySale.sellerName}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1.5">
              {selectedHistorySale.items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-mono-num font-semibold">
                    {formatCurrency(item.unitPrice * item.quantity, sym)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Total</span>
              <span className="font-mono-num">{formatCurrency(selectedHistorySale.total, sym)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

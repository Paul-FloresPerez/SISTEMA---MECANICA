'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Edit3,
  Package,
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { formatCurrency, formatShortDate } from '../utils/calculations';
import { MovementTypeText } from '../components/common/StatusDisplay';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import type { MovementType, Product, ProductCategory } from '../types/workshop';

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

export const InventoryPage: React.FC = () => {
  const {
    products,
    movements,
    settings,
    addProduct,
    updateProduct,
    registerStockMovement,
  } = useWorkshop();
  const sym = settings.currencySymbol;

  const [activeTab, setActiveTab] = useState<'catalogo' | 'movimientos'>('catalogo');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'Todas' | ProductCategory>('Todas');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Create/Edit Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Lubricantes');
  const [formCost, setFormCost] = useState(10);
  const [formPrice, setFormPrice] = useState(20);
  const [formStock, setFormStock] = useState(5);
  const [formMinStock, setFormMinStock] = useState(5);
  const [formLocation, setFormLocation] = useState('Estante A-1');

  // Stock Movement Modal
  const [movModalOpen, setMovModalOpen] = useState(false);
  const [movProductId, setMovProductId] = useState(products[0]?.id ?? '');
  const [movType, setMovType] = useState<MovementType>('entrada');
  const [movQty, setMovQty] = useState(1);
  const [movReason, setMovReason] = useState('');

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'Todas' && p.category !== category) return false;
      if (onlyLowStock && p.stock > p.minStock) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    });
  }, [products, search, category, onlyLowStock]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).length,
    [products]
  );

  const openCreateProduct = () => {
    setEditingProduct(null);
    setFormSku(`ZR-REP-${100 + products.length}`);
    setFormName('');
    setFormBrand('');
    setFormCategory('Lubricantes');
    setFormCost(12);
    setFormPrice(22);
    setFormStock(6);
    setFormMinStock(settings.lowStockAlertDefault);
    setFormLocation('Estante A-1');
    setProductModalOpen(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormSku(prod.sku);
    setFormName(prod.name);
    setFormBrand(prod.brand);
    setFormCategory(prod.category);
    setFormCost(prod.costPrice);
    setFormPrice(prod.salePrice);
    setFormStock(prod.stock);
    setFormMinStock(prod.minStock);
    setFormLocation(prod.location);
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) return;
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        sku: formSku.trim(),
        name: formName.trim(),
        brand: formBrand.trim() || 'Genérico',
        category: formCategory,
        costPrice: Math.max(0, formCost),
        salePrice: Math.max(0, formPrice),
        minStock: Math.max(0, formMinStock),
        location: formLocation.trim() || 'Almacén',
      });
    } else {
      addProduct({
        sku: formSku.trim(),
        name: formName.trim(),
        brand: formBrand.trim() || 'Genérico',
        category: formCategory,
        costPrice: Math.max(0, formCost),
        salePrice: Math.max(0, formPrice),
        stock: Math.max(0, formStock),
        minStock: Math.max(0, formMinStock),
        location: formLocation.trim() || 'Almacén',
      });
    }
    setProductModalOpen(false);
  };

  const openMovementModal = (productId?: string, type: MovementType = 'entrada') => {
    setMovProductId(productId ?? products[0]?.id ?? '');
    setMovType(type);
    setMovQty(1);
    setMovReason('');
    setMovModalOpen(true);
  };

  const handleRegisterMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movProductId || !movReason.trim()) return;
    registerStockMovement({
      productId: movProductId,
      type: movType,
      quantity: movQty,
      reason: movReason.trim(),
    });
    setMovModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Vistas de inventario"
          className="inline-flex items-center p-1 bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'catalogo'}
            onClick={() => setActiveTab('catalogo')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'catalogo'
                ? 'bg-slate-900 text-white dark:bg-rose-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Catálogo ({products.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'movimientos'}
            onClick={() => setActiveTab('movimientos')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'movimientos'
                ? 'bg-slate-900 text-white dark:bg-rose-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Movimientos ({movements.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openMovementModal(undefined, 'entrada')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg whitespace-nowrap"
          >
            <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
            Entrada / ajuste stock
          </button>
          <button
            type="button"
            onClick={openCreateProduct}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nuevo producto
          </button>
        </div>
      </div>

      {activeTab === 'catalogo' ? (
        <>
          {/* Search + Category + Low Stock Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <label htmlFor="inv-search" className="sr-only">
                Buscar repuesto en inventario
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="inv-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar SKU, nombre o marca..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyLowStock((v) => !v)}
              aria-pressed={onlyLowStock}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap self-start md:self-auto ${
                onlyLowStock
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-[#131822] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              Solo stock bajo ({lowStockCount})
            </button>
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
              icon={Package}
              title="No se encontraron repuestos"
              description="Cambia el filtro de categoría o registra un nuevo producto en el catálogo."
              actionLabel="Crear producto"
              onAction={openCreateProduct}
            />
          ) : (
            <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F141C] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-5">Producto</th>
                      <th className="py-3 px-4">Categoría / Ubicación</th>
                      <th className="py-3 px-4 text-right">Costo</th>
                      <th className="py-3 px-4 text-right">Precio venta</th>
                      <th className="py-3 px-4 text-right">Stock actual</th>
                      <th className="py-3 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredProducts.map((prod) => {
                      const isLow = prod.stock <= prod.minStock;
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                <ImageWithFallback
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {prod.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className="font-mono-num">{prod.sku}</span> · {prod.brand}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <p>{prod.category}</p>
                            <p className="text-[11px] text-slate-400">{prod.location}</p>
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-slate-600 dark:text-slate-300">
                            {formatCurrency(prod.costPrice, sym)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(prod.salePrice, sym)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`font-mono-num font-bold ${
                                isLow
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {prod.stock} u.
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              Mín. {prod.minStock}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right whitespace-nowrap space-x-2">
                            <button
                              type="button"
                              onClick={() => openMovementModal(prod.id, 'entrada')}
                              className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                            >
                              Movimiento
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditProduct(prod)}
                              aria-label={`Editar ${prod.name}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                            >
                              <Edit3 className="w-3 h-3" aria-hidden="true" />
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((prod) => {
                  const isLow = prod.stock <= prod.minStock;
                  return (
                    <div key={prod.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono-num text-slate-500">
                            {prod.sku} · {prod.category}
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {prod.name}
                          </p>
                        </div>
                        <span
                          className={`font-mono-num text-sm font-bold shrink-0 ${
                            isLow
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {prod.stock} u.
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/70">
                        <span className="font-mono-num font-semibold">
                          Venta: {formatCurrency(prod.salePrice, sym)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openMovementModal(prod.id, 'entrada')}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-md"
                          >
                            Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditProduct(prod)}
                            className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-md"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Movements Tab */
        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F141C] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Fecha</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4 text-right">Cantidad</th>
                  <th className="py-3 px-4 text-right">Stock final</th>
                  <th className="py-3 px-5">Motivo / Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {movements.map((mov) => (
                  <tr key={mov.id}>
                    <td className="py-3 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatShortDate(mov.date)}
                    </td>
                    <td className="py-3 px-4">
                      <MovementTypeText type={mov.type} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {mov.productName}
                      </p>
                      <p className="text-[11px] font-mono-num text-slate-400">{mov.sku}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-bold">
                      {mov.type === 'entrada' ? `+${mov.quantity}` : mov.type === 'salida' ? `-${mov.quantity}` : mov.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num">
                      {mov.newStock} u.
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-slate-700 dark:text-slate-300">{mov.reason}</p>
                      <p className="text-[11px] text-slate-400">Por {mov.user}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {movements.map((mov) => (
              <div key={mov.id} className="p-4 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <MovementTypeText type={mov.type} />
                  <span className="text-[11px] text-slate-400">{formatShortDate(mov.date)}</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{mov.productName}</p>
                <p className="text-slate-500 dark:text-slate-400">{mov.reason}</p>
                <p className="font-mono-num text-[11px] text-slate-600 dark:text-slate-300">
                  Stock: {mov.previousStock} → <strong>{mov.newStock} u.</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Producto */}
      <Modal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? 'Editar repuesto' : 'Nuevo producto en inventario'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="prod-sku" className="block text-xs font-semibold mb-1">
                Código SKU
              </label>
              <input
                id="prod-sku"
                type="text"
                required
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="prod-cat" className="block text-xs font-semibold mb-1">
                Categoría
              </label>
              <select
                id="prod-cat"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                {CATEGORIES.filter((c) => c !== 'Todas').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prod-name" className="block text-xs font-semibold mb-1">
              Nombre del repuesto
            </label>
            <input
              id="prod-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej. Kit pastillas delanteras Brembo SA"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="prod-brand" className="block text-xs font-semibold mb-1">
                Marca
              </label>
              <input
                id="prod-brand"
                type="text"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                placeholder="Ej. Brembo / Motul"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="prod-loc" className="block text-xs font-semibold mb-1">
                Ubicación en almacén
              </label>
              <input
                id="prod-loc"
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="prod-cost" className="block text-xs font-semibold mb-1">
                Costo ({sym})
              </label>
              <input
                id="prod-cost"
                type="number"
                min={0}
                step="0.5"
                value={formCost}
                onChange={(e) => setFormCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="prod-price" className="block text-xs font-semibold mb-1">
                Venta ({sym})
              </label>
              <input
                id="prod-price"
                type="number"
                min={0}
                step="0.5"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            {!editingProduct && (
              <div>
                <label htmlFor="prod-stock" className="block text-xs font-semibold mb-1">
                  Stock inicial
                </label>
                <input
                  id="prod-stock"
                  type="number"
                  min={0}
                  value={formStock}
                  onChange={(e) => setFormStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            )}
            <div>
              <label htmlFor="prod-min" className="block text-xs font-semibold mb-1">
                Stock mínimo
              </label>
              <input
                id="prod-min"
                type="number"
                min={0}
                value={formMinStock}
                onChange={(e) => setFormMinStock(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setProductModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              {editingProduct ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Movimiento de Inventario */}
      <Modal
        open={movModalOpen}
        onClose={() => setMovModalOpen(false)}
        title="Registrar movimiento de inventario"
      >
        <form onSubmit={handleRegisterMovement} className="space-y-4">
          <div>
            <label htmlFor="mov-prod" className="block text-xs font-semibold mb-1">
              Producto
            </label>
            <select
              id="mov-prod"
              value={movProductId}
              onChange={(e) => setMovProductId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock actual: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mov-type" className="block text-xs font-semibold mb-1">
                Tipo de movimiento
              </label>
              <select
                id="mov-type"
                value={movType}
                onChange={(e) => setMovType(e.target.value as MovementType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="entrada">Entrada (sumar)</option>
                <option value="salida">Salida (restar)</option>
                <option value="ajuste">Ajuste (+/-)</option>
              </select>
            </div>
            <div>
              <label htmlFor="mov-qty" className="block text-xs font-semibold mb-1">
                Cantidad
              </label>
              <input
                id="mov-qty"
                type="number"
                required
                value={movQty}
                onChange={(e) => setMovQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="mov-reason" className="block text-xs font-semibold mb-1">
              Motivo o referencia
            </label>
            <input
              id="mov-reason"
              type="text"
              required
              value={movReason}
              onChange={(e) => setMovReason(e.target.value)}
              placeholder="Ej. Reposición proveedor o conteo físico"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMovModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Aplicar movimiento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_CUSTOMERS,
  INITIAL_MOTORCYCLES,
  INITIAL_MOVEMENTS,
  INITIAL_PRODUCTS,
  INITIAL_REPAIRS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
} from '../mocks/seedData';
import type {
  Customer,
  InventoryMovement,
  Motorcycle,
  MovementType,
  PaymentMethod,
  Product,
  PurchaseOrExpense,
  RepairOrder,
  RepairPayment,
  RepairStatus,
  Sale,
  SaleItem,
  WorkshopSettings,
} from '../types/workshop';
import { getCurrentYear, getTodayIso } from '../utils/calculations';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: 'success' | 'info' | 'warning';
}

interface WorkshopContextValue {
  products: Product[];
  customers: Customer[];
  motorcycles: Motorcycle[];
  repairs: RepairOrder[];
  sales: Sale[];
  movements: InventoryMovement[];
  transactions: PurchaseOrExpense[];
  settings: WorkshopSettings;
  toasts: ToastMessage[];
  notify: (title: string, description?: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  // Repairs
  addRepair: (order: Omit<RepairOrder, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => RepairOrder;
  updateRepair: (id: string, patch: Partial<RepairOrder>) => void;
  updateRepairStatus: (id: string, status: RepairStatus) => void;
  addRepairPayment: (repairId: string, payment: Omit<RepairPayment, 'id'>) => void;
  // Sales
  completeSale: (input: {
    customerName: string;
    customerId?: string;
    items: SaleItem[];
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
  }) => Sale;
  // Inventory
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  registerStockMovement: (input: {
    productId: string;
    type: MovementType;
    quantity: number;
    reason: string;
  }) => void;
  // Purchases & Expenses
  addTransaction: (tx: Omit<PurchaseOrExpense, 'id' | 'code'>) => PurchaseOrExpense;
  // Clients & Motorcycles
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  addMotorcycle: (moto: Omit<Motorcycle, 'id'>) => Motorcycle;
  // Settings
  updateSettings: (patch: Partial<WorkshopSettings>) => void;
  toggleTheme: () => void;
}

const WorkshopContext = createContext<WorkshopContextValue | null>(null);

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>(INITIAL_MOTORCYCLES);
  const [repairs, setRepairs] = useState<RepairOrder[]>(INITIAL_REPAIRS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [movements, setMovements] = useState<InventoryMovement[]>(INITIAL_MOVEMENTS);
  const [transactions, setTransactions] = useState<PurchaseOrExpense[]>(INITIAL_TRANSACTIONS);
  const [settings, setSettings] = useState<WorkshopSettings>(INITIAL_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const notify = (
    title: string,
    description?: string,
    tone: ToastMessage['tone'] = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addRepair: WorkshopContextValue['addRepair'] = (order) => {
    const num = 105 + repairs.length;
    const now = getTodayIso();
    const newOrder: RepairOrder = {
      ...order,
      id: `rep-${Date.now()}`,
      code: `ZR-${getCurrentYear()}-${num}`,
      createdAt: now,
      updatedAt: now,
    };

    // Deduct stock visually for warehouse parts used in this demo order
    const warehouseParts = order.parts.filter((p) => p.source === 'almacen' && p.productId);
    if (warehouseParts.length > 0) {
      setProducts((prev) =>
        prev.map((prod) => {
          const used = warehouseParts.find((wp) => wp.productId === prod.id);
          if (!used) return prod;
          return { ...prod, stock: Math.max(0, prod.stock - used.quantity) };
        })
      );
      const newMovs: InventoryMovement[] = warehouseParts.map((wp, idx) => {
        const prod = products.find((p) => p.id === wp.productId);
        const prevStock = prod?.stock ?? 0;
        return {
          id: `mov-${Date.now()}-${idx}`,
          productId: wp.productId!,
          productName: wp.name,
          sku: prod?.sku ?? 'N/A',
          type: 'salida',
          quantity: wp.quantity,
          previousStock: prevStock,
          newStock: Math.max(0, prevStock - wp.quantity),
          reason: `Asignado a orden ${newOrder.code}`,
          date: now,
          user: order.mechanicName || 'Taller',
        };
      });
      setMovements((prev) => [...newMovs, ...prev]);
    }

    setRepairs((prev) => [newOrder, ...prev]);
    notify('Reparación registrada', `Orden ${newOrder.code} creada en modo demostración.`);
    return newOrder;
  };

  const updateRepair: WorkshopContextValue['updateRepair'] = (id, patch) => {
    setRepairs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: getTodayIso() } : r))
    );
    notify('Orden actualizada', 'Los cambios de la reparación fueron guardados.');
  };

  const updateRepairStatus: WorkshopContextValue['updateRepairStatus'] = (id, status) => {
    setRepairs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, updatedAt: getTodayIso() } : r))
    );
    notify('Estado actualizado', 'El estado de la motocicleta fue actualizado.');
  };

  const addRepairPayment: WorkshopContextValue['addRepairPayment'] = (repairId, payment) => {
    const newPayment: RepairPayment = {
      ...payment,
      id: `pay-${Date.now()}`,
    };
    setRepairs((prev) =>
      prev.map((r) =>
        r.id === repairId
          ? { ...r, payments: [...r.payments, newPayment], updatedAt: getTodayIso() }
          : r
      )
    );
    notify('Abono registrado', `Se registró un pago de ${settings.currencySymbol}${payment.amount.toFixed(2)}.`);
  };

  const completeSale: WorkshopContextValue['completeSale'] = (input) => {
    const now = getTodayIso();
    const num = 42 + sales.length;
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      code: `V-${getCurrentYear()}-0${num}`,
      date: now,
      customerName: input.customerName || 'Cliente Mostrador',
      customerId: input.customerId,
      items: input.items,
      discount: input.discount,
      total: input.total,
      paymentMethod: input.paymentMethod,
      sellerName: 'Sofía Paredes',
    };

    setSales((prev) => [newSale, ...prev]);

    // Deduct stock and log inventory movement
    const movs: InventoryMovement[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = input.items.find((i) => i.productId === prod.id);
        if (!soldItem) return prod;
        const nextStock = Math.max(0, prod.stock - soldItem.quantity);
        movs.push({
          id: `mov-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'salida',
          quantity: soldItem.quantity,
          previousStock: prod.stock,
          newStock: nextStock,
          reason: `Venta rápida POS ${newSale.code}`,
          date: now,
          user: 'Sofía Paredes',
        });
        return { ...prod, stock: nextStock };
      })
    );
    if (movs.length > 0) {
      setMovements((prev) => [...movs, ...prev]);
    }

    notify('Venta confirmada', `Comprobante ${newSale.code} registrado en demostración.`);
    return newSale;
  };

  const addProduct: WorkshopContextValue['addProduct'] = (product) => {
    const created: Product = {
      ...product,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [created, ...prev]);
    if (created.stock > 0) {
      setMovements((prev) => [
        {
          id: `mov-${Date.now()}`,
          productId: created.id,
          productName: created.name,
          sku: created.sku,
          type: 'entrada',
          quantity: created.stock,
          previousStock: 0,
          newStock: created.stock,
          reason: 'Stock inicial al crear producto',
          date: getTodayIso(),
          user: 'Sofía Paredes',
        },
        ...prev,
      ]);
    }
    notify('Producto creado', `${created.name} agregado al catálogo.`);
    return created;
  };

  const updateProduct: WorkshopContextValue['updateProduct'] = (id, patch) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    notify('Producto actualizado', 'Los datos del repuesto fueron actualizados.');
  };

  const registerStockMovement: WorkshopContextValue['registerStockMovement'] = ({
    productId,
    type,
    quantity,
    reason,
  }) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const absQty = Math.abs(quantity);
    let newStock = target.stock;
    let delta = absQty;

    if (type === 'entrada') {
      newStock = target.stock + absQty;
    } else if (type === 'salida') {
      newStock = Math.max(0, target.stock - absQty);
    } else {
      // ajuste directo (puede ser positivo o negativo según quantity)
      newStock = Math.max(0, target.stock + quantity);
      delta = quantity;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      productId: target.id,
      productName: target.name,
      sku: target.sku,
      type,
      quantity: delta,
      previousStock: target.stock,
      newStock,
      reason,
      date: getTodayIso(),
      user: 'Sofía Paredes',
    };
    setMovements((prev) => [movement, ...prev]);
    notify('Movimiento registrado', `${target.name}: stock actual ${newStock} u.`);
  };

  const addTransaction: WorkshopContextValue['addTransaction'] = (tx) => {
    const num = 32 + transactions.length;
    const created: PurchaseOrExpense = {
      ...tx,
      id: `tx-${Date.now()}`,
      code: `CG-${getCurrentYear()}-0${num}`,
    };
    setTransactions((prev) => [created, ...prev]);

    // If warehouse purchase linked to product with quantity, increment stock visually
    if (tx.origin === 'compra_almacen' && tx.relatedProductId && tx.quantity && tx.quantity > 0) {
      registerStockMovement({
        productId: tx.relatedProductId,
        type: 'entrada',
        quantity: tx.quantity,
        reason: `Compra almacén ${created.code}`,
      });
    } else {
      notify('Movimiento guardado', `${created.code} registrado en Compras y Gastos.`);
    }

    return created;
  };

  const addCustomer: WorkshopContextValue['addCustomer'] = (customer) => {
    const created: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: getTodayIso(),
    };
    setCustomers((prev) => [created, ...prev]);
    notify('Cliente registrado', `${created.name} añadido al directorio.`);
    return created;
  };

  const addMotorcycle: WorkshopContextValue['addMotorcycle'] = (moto) => {
    const created: Motorcycle = {
      ...moto,
      id: `moto-${Date.now()}`,
    };
    setMotorcycles((prev) => [created, ...prev]);
    notify('Motocicleta registrada', `${created.brand} ${created.model} (${created.plate}) vinculada.`);
    return created;
  };

  const updateSettings: WorkshopContextValue['updateSettings'] = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    notify('Configuración guardada', 'Preferencias actualizadas en sesión local.');
  };

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  return (
    <WorkshopContext.Provider
      value={{
        products,
        customers,
        motorcycles,
        repairs,
        sales,
        movements,
        transactions,
        settings,
        toasts,
        notify,
        dismissToast,
        addRepair,
        updateRepair,
        updateRepairStatus,
        addRepairPayment,
        completeSale,
        addProduct,
        updateProduct,
        registerStockMovement,
        addTransaction,
        addCustomer,
        addMotorcycle,
        updateSettings,
        toggleTheme,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
};

export function useWorkshop(): WorkshopContextValue {
  const ctx = useContext(WorkshopContext);
  if (!ctx) {
    throw new Error('useWorkshop debe usarse dentro de WorkshopProvider');
  }
  return ctx;
}

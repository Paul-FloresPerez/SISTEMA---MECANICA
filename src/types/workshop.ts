export type RepairStatus =
  | 'recibida'
  | 'diagnostico'
  | 'en_proceso'
  | 'esperando_repuesto'
  | 'lista'
  | 'entregada';

export type RepairPartSource = 'almacen' | 'compra_directa' | 'cliente';

export type PaymentMethod = 'efectivo' | 'yape_plin' | 'tarjeta' | 'transferencia';

export type ProductCategory =
  | 'Lubricantes'
  | 'Frenos'
  | 'Transmisión'
  | 'Filtros'
  | 'Eléctrico'
  | 'Neumáticos'
  | 'Accesorios';

export type MovementType = 'entrada' | 'salida' | 'ajuste';

export type TransactionOrigin =
  | 'compra_almacen'
  | 'compra_reparacion'
  | 'gasto_operativo';

export type ExpenseCategory =
  | 'Repuestos e insumos'
  | 'Compra directa taller'
  | 'Servicios básicos'
  | 'Alquiler'
  | 'Herramientas'
  | 'Nómina y técnicos'
  | 'Otros operativos';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  location: string;
  imageUrl?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string; // ISO string
  user: string;
}

export interface Motorcycle {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  displacementCc: number;
  color: string;
  mileageKm: number;
  vin?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  documentId: string;
  notes?: string;
  createdAt: string;
}

export interface RepairPart {
  id: string;
  source: RepairPartSource;
  productId?: string;
  name: string;
  quantity: number;
  unitCost: number; // cost to workshop (0 if client-provided)
  unitPrice: number; // reference or included charge
  supplier?: string;
  notes?: string;
}

export interface RepairExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface RepairPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  note?: string;
}

export interface RepairOrder {
  id: string;
  code: string;
  customerId: string;
  motorcycleId: string;
  reportedProblem: string;
  diagnosisNotes: string;
  status: RepairStatus;
  mechanicName: string;
  mileageAtEntry: number;
  parts: RepairPart[];
  expenses: RepairExpense[];
  globalPrice: number;
  payments: RepairPayment[];
  createdAt: string;
  estimatedDelivery: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface Sale {
  id: string;
  code: string;
  date: string;
  customerName: string;
  customerId?: string;
  items: SaleItem[];
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  sellerName: string;
}

export interface PurchaseOrExpense {
  id: string;
  code: string;
  origin: TransactionOrigin;
  category: ExpenseCategory;
  description: string;
  supplierOrPayee: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  relatedRepairId?: string;
  relatedRepairCode?: string;
  relatedProductId?: string;
  quantity?: number;
  notes?: string;
}

export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  enabled: boolean;
  accountInfo: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'Administrador' | 'Jefe de Taller' | 'Mecánico' | 'Ventas / Caja';
  specialty: string;
  active: boolean;
  email: string;
}

export interface WorkshopSettings {
  workshopName: string;
  legalName: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  currencySymbol: string;
  workHours: string;
  lowStockAlertDefault: number;
  theme: 'light' | 'dark';
  compactTables: boolean;
  showDemoBanner: boolean;
  paymentMethods: PaymentMethodConfig[];
  team: TeamMember[];
}

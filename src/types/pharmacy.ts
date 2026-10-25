export type UserRole = "Owner" | "Manager" | "Cashier";

export type EnvironmentType = "Live" | "Test";

export interface UserPermissions {
  modules: {
    dashboard: boolean;
    pos: boolean;
    inventory: boolean;
    grn: boolean;
    sales: boolean;
    credit: boolean;
    suppliers: boolean;
    prescriptions: boolean;
    reports: boolean;
    users: boolean;
    settings: boolean;
  };
  actions: {
    allowCustomPrice: boolean;
    allowBillDiscount: boolean;
    allowCreditBilling: boolean;
    allowRefunds: boolean;
    allowStockAdjustment: boolean;
  };
}

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  displayName: string;
  role: UserRole;
  env: EnvironmentType;
  ownerName: string;
  ownerUid: string;
  superUserId?: string;
  permissions: UserPermissions;
  createdAt: string;
}

export const getDefaultPermissionsForRole = (role: UserRole): UserPermissions => {
  if (role === "Owner") {
    return {
      modules: {
        dashboard: true,
        pos: true,
        inventory: true,
        grn: true,
        sales: true,
        credit: true,
        suppliers: true,
        prescriptions: true,
        reports: true,
        users: true,
        settings: true,
      },
      actions: {
        allowCustomPrice: true,
        allowBillDiscount: true,
        allowCreditBilling: true,
        allowRefunds: true,
        allowStockAdjustment: true,
      },
    };
  }
  if (role === "Manager") {
    return {
      modules: {
        dashboard: true,
        pos: true,
        inventory: true,
        grn: true,
        sales: true,
        credit: true,
        suppliers: true,
        prescriptions: true,
        reports: true,
        users: false,
        settings: false,
      },
      actions: {
        allowCustomPrice: true,
        allowBillDiscount: true,
        allowCreditBilling: true,
        allowRefunds: true,
        allowStockAdjustment: true,
      },
    };
  }
  // Cashier
  return {
    modules: {
      dashboard: false,
      pos: true,
      inventory: false,
      grn: false,
      sales: true,
      credit: true,
      suppliers: false,
      prescriptions: true,
      reports: false,
      users: false,
      settings: false,
    },
    actions: {
      allowCustomPrice: false,
      allowBillDiscount: true,
      allowCreditBilling: true,
      allowRefunds: false,
      allowStockAdjustment: false,
    },
  };
};

export interface Batch {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  barcode: string;
  expiryDate: string; // YYYY-MM-DD
  costPrice: number;
  sellPrice: number;
  quantity: number;
  receivedDate: string;
  supplierId?: string;
  supplierName?: string;
  status: "active" | "low" | "expiring_soon" | "expired";
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  genericName?: string;
  category: "Pain Relief" | "Antibiotics" | "Vitamins" | "Respiratory" | "Stomach Care" | "Other";
  unit: "Tablet" | "Capsule" | "Bottle" | "Sachet" | "Inhaler" | "Tube" | "Strip";
  lowStockLimit: number;
  costPrice: number; // default cost
  sellPrice: number; // default selling price
  totalStock: number;
  primarySupplierId?: string;
  primarySupplierName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GRNLineItem {
  productId: string;
  productName: string;
  barcode: string;
  batchNumber: string;
  expiryDate: string;
  receivedQuantity: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  lineTotal: number;
}

export interface GRN {
  id: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber: string;
  invoiceDate: string;
  attachmentUrl?: string;
  lineItems: GRNLineItem[];
  totalCost: number;
  receivedAt: string;
  receivedBy: string;
  notes?: string;
}

export interface POSCartItem {
  cartItemId: string;
  product: Product;
  batch: Batch;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  costPriceSnapshot: number;
}

export interface PaymentBreakdown {
  cash?: number;
  card?: number;
  credit?: number;
  bank?: number;
  qr?: number;
}

export type PaymentMethod = "Cash" | "Card" | "Credit" | "Bank Transfer" | "QR Payment" | "Split Payment";

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName: string;
  customerType: "walk_in" | "online" | "credit";
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  onlinePrescriptionId?: string;
  prescriptionUrl?: string;
  items: POSCartItem[];
  subtotal: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
  netTotal: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown: PaymentBreakdown;
  tenderAmount?: number;
  changeAmount?: number;
  notes?: string;
  createdAt: string;
  status: "completed" | "refunded" | "exchanged";
}

export interface SaleReturn {
  id: string;
  returnNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName: string;
  customerName: string;
  type: "refund" | "exchange";
  items: {
    productId: string;
    productName: string;
    batchId: string;
    batchNumber: string;
    returnedQuantity: number;
    unitPrice: number;
    refundAmount: number;
  }[];
  totalRefundAmount: number;
  reason: string;
  refundMethod: "Cash" | "Credit Adjustment" | "Original Payment";
  createdAt: string;
}

export interface CreditCustomer {
  id: string;
  name: string;
  nic: string;
  phone: string;
  address: string;
  creditLimit: number;
  outstandingBalance: number;
  createdAt: string;
  notes?: string;
}

export interface CreditLedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  type: "charge" | "payment";
  amount: number;
  reference: string; // Invoice number or Receipt number
  balanceAfter: number;
  createdAt: string;
  paymentMethod?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  productsCount?: number;
  totalGRNs?: number;
  totalSpend?: number;
  createdAt: string;
}

export interface OnlinePrescription {
  id: string;
  referenceId: string; // e.g. RX-2026-8921
  customerName: string;
  address: string;
  contactNumber: string;
  notes?: string;
  fileUrl: string; // Base64 data url or storage URL
  fileName?: string;
  submittedAt: string;
  status: "pending" | "in_pos" | "completed" | "rejected";
  linkedInvoiceId?: string;
  handledBy?: string;
}

export interface SystemSettings {
  pharmacyName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  receiptFooter: string;
  enableSoundAlerts: boolean;
  lowStockThresholdDefault: number;
  expiryWarningDays: number; // default 20 days
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  type: "add" | "remove_damaged" | "expiry_writeoff";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

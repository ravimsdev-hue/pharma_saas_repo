import { z } from "zod";

export const onlinePrescriptionSchema = z.object({
  customerName: z
    .string()
    .min(2, "Customer full name must be at least 2 characters")
    .max(100, "Name is too long"),
  address: z
    .string()
    .min(5, "Delivery / Residential address must be at least 5 characters"),
  contactNumber: z
    .string()
    .min(9, "Contact number must be at least 9 digits")
    .regex(/^[0-9+\s\-()]{9,15}$/, "Invalid phone number format"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().or(z.literal("")),
  fileUrl: z.string().min(1, "Prescription document image or PDF is required"),
  fileName: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Medicine name is required"),
  genericName: z.string().optional(),
  barcode: z.string().min(3, "Barcode must be at least 3 characters"),
  category: z.enum([
    "Pain Relief",
    "Antibiotics",
    "Vitamins",
    "Respiratory",
    "Stomach Care",
    "Other",
  ]),
  unit: z.enum([
    "Tablet",
    "Capsule",
    "Bottle",
    "Sachet",
    "Inhaler",
    "Tube",
    "Strip",
  ]),
  lowStockLimit: z.number().int().min(1, "Low stock threshold must be at least 1"),
  costPrice: z.number().positive("Cost price must be greater than zero"),
  sellPrice: z.number().positive("Selling price must be greater than zero"),
  openingStock: z.number().int().min(0, "Opening stock cannot be negative"),
  initialBatchNumber: z.string().min(2, "Batch number is required"),
  batchExpiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be in YYYY-MM-DD format"),
  primarySupplierId: z.string().optional(),
  primarySupplierName: z.string().optional(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product selection is required"),
  batchId: z.string().min(1, "Batch selection is required"),
  type: z.enum(["add", "remove_damaged", "expiry_writeoff"]),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  reason: z
    .string()
    .min(5, "Audit reason notes must be at least 5 characters for compliance"),
});

export const grnSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier"),
  supplierInvoiceNumber: z.string().min(1, "Supplier Invoice / GRN reference is required"),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid invoice date required"),
  lineItems: z
    .array(
      z.object({
        productId: z.string().min(1, "Product required"),
        productName: z.string(),
        barcode: z.string(),
        batchNumber: z.string().min(1, "Batch number required"),
        expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid expiry date required"),
        receivedQuantity: z.number().int().positive("Quantity must be > 0"),
        unitCostPrice: z.number().positive("Cost must be > 0"),
        unitSellingPrice: z.number().positive("Selling price must be > 0"),
        lineTotal: z.number().positive(),
      })
    )
    .min(1, "At least one batch line item is required"),
  notes: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export const creditCustomerSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  nic: z.string().min(9, "Valid National Identity Card (NIC) required"),
  phone: z.string().min(9, "Valid phone number required"),
  address: z.string().min(3, "Address is required"),
  creditLimit: z.number().min(0, "Credit limit must be a positive amount"),
  notes: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier company name is required"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  phone: z.string().min(9, "Valid contact number required"),
  email: z.string().email("Valid email required").or(z.literal("")),
  address: z.string().min(3, "Location / Address required"),
});

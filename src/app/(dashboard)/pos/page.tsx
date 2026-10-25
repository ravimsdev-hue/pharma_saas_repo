"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { usePharmacy } from "@/context/PharmacyContext";
import {
  Product,
  Batch,
  POSCartItem,
  PaymentMethod,
  PaymentBreakdown,
  SaleInvoice,
} from "@/types/pharmacy";
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  FileText,
  CreditCard,
  Printer,
  X,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Eye,
  Percent,
  Banknote,
  QrCode,
  Layers,
  Split,
  ChevronDown,
} from "lucide-react";

interface POSBill {
  id: number;
  title: string;
  customerType: "walk_in" | "online" | "credit";
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  creditCustomerId: string;
  onlinePrescriptionId: string;
  prescriptionUrl: string;
  items: POSCartItem[];
  discountType: "percent" | "fixed";
  discountValue: number;
}

const defaultBills: POSBill[] = [
  {
    id: 1,
    title: "Bill 1",
    customerType: "walk_in",
    customerName: "Walk-in Customer",
    customerPhone: "",
    customerAddress: "",
    creditCustomerId: "",
    onlinePrescriptionId: "",
    prescriptionUrl: "",
    items: [],
    discountType: "percent",
    discountValue: 0,
  },
  {
    id: 2,
    title: "Bill 2",
    customerType: "walk_in",
    customerName: "Walk-in Customer",
    customerPhone: "",
    customerAddress: "",
    creditCustomerId: "",
    onlinePrescriptionId: "",
    prescriptionUrl: "",
    items: [],
    discountType: "percent",
    discountValue: 0,
  },
  {
    id: 3,
    title: "Bill 3",
    customerType: "walk_in",
    customerName: "Walk-in Customer",
    customerPhone: "",
    customerAddress: "",
    creditCustomerId: "",
    onlinePrescriptionId: "",
    prescriptionUrl: "",
    items: [],
    discountType: "percent",
    discountValue: 0,
  },
  {
    id: 4,
    title: "Bill 4",
    customerType: "walk_in",
    customerName: "Walk-in Customer",
    customerPhone: "",
    customerAddress: "",
    creditCustomerId: "",
    onlinePrescriptionId: "",
    prescriptionUrl: "",
    items: [],
    discountType: "percent",
    discountValue: 0,
  },
];

export default function SmartPOSPage() {
  const {
    products,
    batches,
    creditCustomers,
    onlinePrescriptions,
    currentUser,
    settings,
    completeSale,
    pendingPrescriptionForPOS,
    setPendingPrescriptionForPOS,
  } = usePharmacy();

  // 4 Concurrent Bill Tabs
  const [bills, setBills] = useState<POSBill[]>(defaultBills);
  const [activeBillId, setActiveBillId] = useState<number>(1);

  // Active Bill
  const activeBill = useMemo(() => {
    return bills.find((b) => b.id === activeBillId) || bills[0];
  }, [bills, activeBillId]);

  // Product Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Multi-batch selection modal
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);

  // Modals
  const [isSpeedKeysModalOpen, setIsSpeedKeysModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>("Cash");
  const [tenderCash, setTenderCash] = useState<string>("");
  const [splitCash, setSplitCash] = useState<string>("");
  const [splitCard, setSplitCard] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");

  // Completed Invoice & Receipt Printing Modal
  const [completedInvoice, setCompletedInvoice] = useState<SaleInvoice | null>(null);

  // Notice Toast
  const [notice, setNotice] = useState<{ type: "success" | "error" | "warn"; msg: string } | null>(
    null
  );

  const showToast = useCallback((msg: string, type: "success" | "error" | "warn" = "warn") => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  }, []);

  // Check if an online prescription was transferred to POS
  useEffect(() => {
    if (pendingPrescriptionForPOS) {
      setBills((prev) =>
        prev.map((b) => {
          if (b.id === activeBillId) {
            return {
              ...b,
              customerType: "online",
              customerName: pendingPrescriptionForPOS.customerName,
              customerPhone: pendingPrescriptionForPOS.contactNumber,
              customerAddress: pendingPrescriptionForPOS.address,
              onlinePrescriptionId: pendingPrescriptionForPOS.id,
              prescriptionUrl: pendingPrescriptionForPOS.fileUrl,
            };
          }
          return b;
        })
      );
      showToast(
        `Loaded prescription ${pendingPrescriptionForPOS.referenceId} into Bill #${activeBillId}`,
        "success"
      );
      setPendingPrescriptionForPOS(null);
    }
  }, [pendingPrescriptionForPOS, activeBillId, setPendingPrescriptionForPOS, showToast]);

  // Filter products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.genericName && p.genericName.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [products, searchQuery, selectedCategory]);

  // Helper to update active bill
  const updateActiveBill = useCallback(
    (updater: (b: POSBill) => POSBill) => {
      setBills((prev) =>
        prev.map((b) => (b.id === activeBillId ? updater(b) : b))
      );
    },
    [activeBillId]
  );

  // Add Item to Active Bill Cart
  const handleSelectProduct = (product: Product) => {
    const productBatches = batches.filter(
      (b) => b.productId === product.id && b.quantity > 0
    );

    if (productBatches.length === 0) {
      showToast(`No stock available for ${product.name}!`, "error");
      return;
    }

    // If multiple active batches exist, open Multi-Batch Price Selector Modal
    if (productBatches.length > 1) {
      setSelectedProductForBatch(product);
      return;
    }

    // Single batch
    addBatchToCart(product, productBatches[0]);
  };

  const addBatchToCart = (product: Product, batch: Batch) => {
    // STRICT EXPIRY BLOCKING RULE
    if (batch.status === "expired" || new Date(batch.expiryDate) < new Date()) {
      showToast(
        `BLOCKED: Batch ${batch.batchNumber} expired on ${batch.expiryDate}! It cannot be dispensed.`,
        "error"
      );
      return;
    }

    if (batch.quantity <= 0) {
      showToast(`Batch ${batch.batchNumber} has no available stock!`, "error");
      return;
    }

    updateActiveBill((bill) => {
      const existingIndex = bill.items.findIndex(
        (item) => item.batch.id === batch.id
      );

      if (existingIndex >= 0) {
        const existing = bill.items[existingIndex];
        if (existing.quantity >= batch.quantity) {
          showToast(
            `Cannot add more! Only ${batch.quantity} units available in batch ${batch.batchNumber}.`,
            "warn"
          );
          return bill;
        }
        const updatedItems = [...bill.items];
        updatedItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
          lineTotal: (existing.quantity + 1) * existing.unitPrice,
        };
        return { ...bill, items: updatedItems };
      }

      const newItem: POSCartItem = {
        cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product,
        batch,
        quantity: 1,
        unitPrice: batch.sellPrice,
        lineTotal: batch.sellPrice,
        costPriceSnapshot: batch.costPrice,
      };

      return { ...bill, items: [...bill.items, newItem] };
    });

    setSelectedProductForBatch(null);
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    updateActiveBill((bill) => {
      const updatedItems = bill.items
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.batch.quantity) {
              showToast(
                `Maximum available stock for batch ${item.batch.batchNumber} is ${item.batch.quantity}`,
                "warn"
              );
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              lineTotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[];

      return { ...bill, items: updatedItems };
    });
  };

  const removeCartItem = (cartItemId: string) => {
    updateActiveBill((bill) => ({
      ...bill,
      items: bill.items.filter((i) => i.cartItemId !== cartItemId),
    }));
  };

  const clearActiveCart = () => {
    updateActiveBill((bill) => ({
      ...bill,
      items: [],
      discountValue: 0,
    }));
  };

  // Financial calculations for active bill
  const subtotal = useMemo(() => {
    return activeBill.items.reduce((acc, i) => acc + i.lineTotal, 0);
  }, [activeBill.items]);

  const discountAmount = useMemo(() => {
    if (activeBill.discountValue <= 0) return 0;
    if (activeBill.discountType === "percent") {
      return (subtotal * activeBill.discountValue) / 100;
    }
    return Math.min(subtotal, activeBill.discountValue);
  }, [subtotal, activeBill.discountType, activeBill.discountValue]);

  const netTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const totalCost = useMemo(() => {
    return activeBill.items.reduce(
      (acc, i) => acc + i.costPriceSnapshot * i.quantity,
      0
    );
  }, [activeBill.items]);

  const projectedGrossProfit = useMemo(() => {
    return netTotal - totalCost;
  }, [netTotal, totalCost]);

  // Open Payment Checkout with Speed Key
  const handleOpenPayment = (method: PaymentMethod) => {
    if (activeBill.items.length === 0) {
      showToast("Cannot checkout an empty cart! Add medicines first.", "warn");
      return;
    }

    // Permission checks
    if (method === "Credit" && !currentUser.permissions.actions.allowCreditBilling) {
      showToast("Permission Denied: You are not authorized for Credit Billing.", "error");
      return;
    }

    setPaymentMode(method);
    setPaymentError("");
    setPaymentNotes("");
    if (method === "Cash") {
      setTenderCash(Math.ceil(netTotal).toString());
    } else if (method === "Split Payment") {
      setSplitCash(Math.round(netTotal / 2).toString());
      setSplitCard((netTotal - Math.round(netTotal / 2)).toString());
    }
    setIsPaymentModalOpen(true);
  };

  // Execute Final Sale
  const handleProcessCheckout = async () => {
    setPaymentError("");

    let paymentBreakdown: PaymentBreakdown = {};
    let tenderAmount: number | undefined;
    let changeAmount: number | undefined;

    if (paymentMode === "Cash") {
      const tender = parseFloat(tenderCash) || 0;
      if (tender < netTotal) {
        setPaymentError(`Tendered cash (LKR ${tender}) is less than net total (LKR ${netTotal})!`);
        return;
      }
      tenderAmount = tender;
      changeAmount = tender - netTotal;
      paymentBreakdown = { cash: netTotal };
    } else if (paymentMode === "Card") {
      paymentBreakdown = { card: netTotal };
    } else if (paymentMode === "Credit") {
      if (!activeBill.creditCustomerId) {
        setPaymentError("Please link a registered Credit Customer before proceeding with credit billing!");
        return;
      }
      const customer = creditCustomers.find((c) => c.id === activeBill.creditCustomerId);
      if (!customer) {
        setPaymentError("Selected credit customer account not found!");
        return;
      }
      const availableLimit = customer.creditLimit - customer.outstandingBalance;
      if (netTotal > availableLimit) {
        setPaymentError(
          `Credit limit exceeded! Invoice LKR ${netTotal.toFixed(
            2
          )} exceeds available credit LKR ${availableLimit.toFixed(2)}.`
        );
        return;
      }
      paymentBreakdown = { credit: netTotal };
    } else if (paymentMode === "Bank Transfer") {
      paymentBreakdown = { bank: netTotal };
    } else if (paymentMode === "QR Payment") {
      paymentBreakdown = { qr: netTotal };
    } else if (paymentMode === "Split Payment") {
      const c = parseFloat(splitCash) || 0;
      const card = parseFloat(splitCard) || 0;
      if (Math.abs(c + card - netTotal) > 0.01) {
        setPaymentError(
          `Split amounts (LKR ${c + card}) must exactly match net bill total (LKR ${netTotal})!`
        );
        return;
      }
      paymentBreakdown = { cash: c, card };
    }

    try {
      const sale = await completeSale({
        cashierId: currentUser.id,
        cashierName: currentUser.displayName,
        customerType: activeBill.customerType,
        customerId: activeBill.creditCustomerId || undefined,
        customerName: activeBill.customerName || "Walk-in Customer",
        customerPhone: activeBill.customerPhone,
        customerAddress: activeBill.customerAddress,
        onlinePrescriptionId: activeBill.onlinePrescriptionId || undefined,
        prescriptionUrl: activeBill.prescriptionUrl || undefined,
        items: activeBill.items,
        subtotal,
        discountType: activeBill.discountType,
        discountValue: activeBill.discountValue,
        discountAmount,
        netTotal,
        grossProfit: projectedGrossProfit,
        paymentMethod: paymentMode,
        paymentBreakdown,
        tenderAmount,
        changeAmount,
        notes: paymentNotes,
      });

      // Clear bill
      clearActiveCart();
      setIsPaymentModalOpen(false);

      // Open Printable Receipt Modal
      setCompletedInvoice(sale);
    } catch (err) {
      console.error(err);
      setPaymentError("Checkout failed. Please retry.");
    }
  };

  // Keyboard Shortcuts (F2-F7 Speed Keys, F9-F12 Multi-Bill Tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside an active typing input (unless it's an F-key)
      if (e.key === "F2") {
        e.preventDefault();
        handleOpenPayment("Cash");
      } else if (e.key === "F3") {
        e.preventDefault();
        handleOpenPayment("Card");
      } else if (e.key === "F4") {
        e.preventDefault();
        handleOpenPayment("Credit");
      } else if (e.key === "F5") {
        e.preventDefault();
        handleOpenPayment("Bank Transfer");
      } else if (e.key === "F6") {
        e.preventDefault();
        handleOpenPayment("QR Payment");
      } else if (e.key === "F7") {
        e.preventDefault();
        handleOpenPayment("Split Payment");
      } else if (e.key === "F9") {
        e.preventDefault();
        setActiveBillId(1);
      } else if (e.key === "F10") {
        e.preventDefault();
        setActiveBillId(2);
      } else if (e.key === "F11") {
        e.preventDefault();
        setActiveBillId(3);
      } else if (e.key === "F12") {
        e.preventDefault();
        setActiveBillId(4);
      } else if (e.key === "F1") {
        e.preventDefault();
        setIsSpeedKeysModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toast Notification Banner */}
      {notice && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-150 ${
            notice.type === "error"
              ? "bg-red-500 text-white border-red-600 shadow-md"
              : notice.type === "success"
              ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
              : "bg-amber-500 text-slate-900 border-amber-600 shadow-md"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "error" ? (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{notice.msg}</span>
          </div>
          <button onClick={() => setNotice(null)} className="opacity-80 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top POS Control Bar: Multi-Bill Tabs (F9-F12) & Speed Keys Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* 4 Concurrent Active Bill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {bills.map((bill) => {
            const count = bill.items.length;
            const total = bill.items.reduce((a, b) => a + b.lineTotal, 0);
            const isActive = bill.id === activeBillId;

            return (
              <button
                key={bill.id}
                onClick={() => setActiveBillId(bill.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`speed-key-badge ${
                      isActive ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    F{bill.id + 8}
                  </span>
                  <span>{bill.title}</span>
                </div>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                      isActive ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {count}
                  </span>
                )}
                {total > 0 && (
                  <span className="hidden sm:inline text-[11px] font-mono opacity-80">
                    LKR {Math.round(total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Speed Keys Reference Shortcut Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSpeedKeysModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>Speed Keys (F1-F12)</span>
          </button>
        </div>
      </div>

      {/* Main POS Split Grid: Left Products / Right Smart Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Section: Product Catalogue & Barcode Search */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative flex items-center">
              <Barcode className="w-5 h-5 text-orange-600 absolute left-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan barcode with hardware scanner or search medicine name..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              {[
                "All",
                "Pain Relief",
                "Antibiotics",
                "Vitamins",
                "Respiratory",
                "Stomach Care",
                "Other",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-orange-600 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto p-1">
            {filteredProducts.map((p) => {
              const inStockBatches = batches.filter(
                (b) => b.productId === p.id && b.quantity > 0
              );
              const isOutOfStock = inStockBatches.length === 0;

              return (
                <button
                  key={p.id}
                  disabled={isOutOfStock}
                  onClick={() => handleSelectProduct(p)}
                  className={`text-left p-3 rounded-2xl border bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOutOfStock
                      ? "border-slate-200"
                      : "border-slate-200 hover:border-orange-500"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {p.unit}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{p.barcode}</span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-orange-600 transition-colors line-clamp-1">
                      {p.name}
                    </h4>
                    {p.genericName && (
                      <p className="text-[10px] text-slate-500 italic line-clamp-1">
                        {p.genericName}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black text-orange-600">
                      LKR {p.sellPrice.toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.totalStock > p.lowStockLimit
                          ? "text-emerald-700 bg-emerald-50"
                          : p.totalStock > 0
                          ? "text-amber-700 bg-amber-50"
                          : "text-red-700 bg-red-50"
                      }`}
                    >
                      {p.totalStock > 0 ? `${p.totalStock} left` : "Out of stock"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section: Active Bill Cart Terminal */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Bill Customer Header Selector */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Terminal: {activeBill.title}
              </span>

              {/* Customer Mode Pill Selector */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() =>
                    updateActiveBill((b) => ({
                      ...b,
                      customerType: "walk_in",
                      customerName: "Walk-in Customer",
                      creditCustomerId: "",
                      onlinePrescriptionId: "",
                    }))
                  }
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeBill.customerType === "walk_in"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600"
                  }`}
                >
                  Walk-in
                </button>

                <button
                  onClick={() => setIsPrescriptionModalOpen(true)}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeBill.customerType === "online"
                      ? "bg-orange-600 text-white shadow-2xs"
                      : "text-slate-600"
                  }`}
                >
                  Online Rx
                </button>

                <button
                  onClick={() =>
                    updateActiveBill((b) => ({
                      ...b,
                      customerType: "credit",
                      customerName: creditCustomers[0]?.name || "Credit Account",
                      creditCustomerId: creditCustomers[0]?.id || "",
                    }))
                  }
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeBill.customerType === "credit"
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "text-slate-600"
                  }`}
                >
                  Credit
                </button>
              </div>
            </div>

            {/* Customer Details Display or Dropdown */}
            {activeBill.customerType === "credit" ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Select Credit Customer Account
                </label>
                <select
                  value={activeBill.creditCustomerId}
                  onChange={(e) => {
                    const cust = creditCustomers.find((c) => c.id === e.target.value);
                    updateActiveBill((b) => ({
                      ...b,
                      creditCustomerId: e.target.value,
                      customerName: cust ? cust.name : "Credit Customer",
                    }));
                  }}
                  className="w-full text-xs font-bold p-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                >
                  {creditCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Limit: LKR {c.creditLimit.toLocaleString()} | Bal: LKR{" "}
                      {c.outstandingBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            ) : activeBill.customerType === "online" ? (
              <div className="p-2 bg-orange-50 rounded-xl border border-orange-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-orange-900">{activeBill.customerName}</p>
                  <p className="text-[10px] text-slate-600">
                    {activeBill.customerPhone} · {activeBill.customerAddress}
                  </p>
                </div>
                {activeBill.prescriptionUrl && (
                  <button
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    className="p-1 rounded bg-orange-200 text-orange-800 text-[10px] font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> View Rx
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Cart Itemized Lines List */}
          <div className="flex-1 max-h-[340px] overflow-y-auto divide-y divide-slate-100 p-2">
            {activeBill.items.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Barcode className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Cart is Empty
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click medicine cards or scan barcode to add items to Bill #{activeBillId}.
                </p>
              </div>
            ) : (
              activeBill.items.map((item) => (
                <div key={item.cartItemId} className="py-2 px-1 flex items-center justify-between gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-extrabold text-slate-900 truncate">{item.product.name}</p>
                      <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-600">
                        {item.batch.batchNumber}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      LKR {item.unitPrice.toFixed(2)} / {item.product.unit} · Exp: {item.batch.expiryDate}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-extrabold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="text-right flex items-center gap-2">
                    <span className="font-black text-slate-900 w-16">
                      LKR {item.lineTotal.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeCartItem(item.cartItemId)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Financial Summary & Speed Key Actions */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3">
            {/* Bill Discount Control (Permission Gated) */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Subtotal</span>
              <span className="font-bold text-slate-800">LKR {subtotal.toFixed(2)}</span>
            </div>

            {currentUser.permissions.actions.allowBillDiscount && (
              <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/60">
                <span className="text-slate-600 font-bold flex items-center gap-1">
                  <Percent className="w-3 h-3 text-orange-600" /> Bill Discount:
                </span>
                <div className="flex items-center gap-1">
                  <select
                    value={activeBill.discountType}
                    onChange={(e) =>
                      updateActiveBill((b) => ({
                        ...b,
                        discountType: e.target.value as "percent" | "fixed",
                      }))
                    }
                    className="p-1 text-[11px] font-bold bg-white border border-slate-300 rounded"
                  >
                    <option value="percent">%</option>
                    <option value="fixed">LKR</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={activeBill.discountValue || ""}
                    onChange={(e) =>
                      updateActiveBill((b) => ({
                        ...b,
                        discountValue: Math.max(0, parseFloat(e.target.value) || 0),
                      }))
                    }
                    placeholder="0"
                    className="w-16 p-1 text-right text-xs font-bold bg-white border border-slate-300 rounded"
                  />
                  {discountAmount > 0 && (
                    <span className="text-emerald-600 font-bold text-[11px]">
                      -LKR {discountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Net Total Display */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Net Payable Total
                </span>
                <span className="text-2xl font-black text-orange-400">
                  LKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                <span>Profit Margin</span>
                <p className="font-bold text-emerald-400">
                  +LKR {projectedGrossProfit.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Keyboard-Driven Speed Keys Settlement Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* F2 Cash */}
              <button
                type="button"
                onClick={() => handleOpenPayment("Cash")}
                className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex flex-col items-center"
              >
                <div className="flex items-center gap-1">
                  <span className="speed-key-badge bg-emerald-900 text-white">F2</span>
                  <span>Cash</span>
                </div>
              </button>

              {/* F3 Card */}
              <button
                type="button"
                onClick={() => handleOpenPayment("Card")}
                className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex flex-col items-center"
              >
                <div className="flex items-center gap-1">
                  <span className="speed-key-badge bg-blue-900 text-white">F3</span>
                  <span>Card</span>
                </div>
              </button>

              {/* F4 Credit */}
              <button
                type="button"
                onClick={() => handleOpenPayment("Credit")}
                className="py-2.5 px-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex flex-col items-center"
              >
                <div className="flex items-center gap-1">
                  <span className="speed-key-badge bg-purple-900 text-white">F4</span>
                  <span>Credit</span>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* F5 Bank */}
              <button
                type="button"
                onClick={() => handleOpenPayment("Bank Transfer")}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span className="speed-key-badge bg-slate-950 text-white text-[9px]">F5</span>
                <span>Bank</span>
              </button>

              {/* F6 QR */}
              <button
                type="button"
                onClick={() => handleOpenPayment("QR Payment")}
                className="py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span className="speed-key-badge bg-amber-900 text-white text-[9px]">F6</span>
                <span>LankaQR</span>
              </button>

              {/* F7 Split */}
              <button
                type="button"
                onClick={() => handleOpenPayment("Split Payment")}
                className="py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span className="speed-key-badge bg-slate-900 text-white text-[9px]">F7</span>
                <span>Split</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Batch Price Selector Modal */}
      {selectedProductForBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                  Multi-Batch Price Selector
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedProductForBatch.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProductForBatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              This medicine has multiple batches in inventory. Select the target batch to dispense.
              Expired batches are strictly locked.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {batches
                .filter((b) => b.productId === selectedProductForBatch.id)
                .map((batch) => {
                  const isExpired =
                    batch.status === "expired" || new Date(batch.expiryDate) < new Date();

                  return (
                    <div
                      key={batch.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isExpired
                          ? "bg-red-50/60 border-red-200 opacity-60"
                          : "bg-white border-slate-200 hover:border-orange-500 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            Batch: {batch.batchNumber}
                          </span>
                          {isExpired ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">
                              EXPIRED - BLOCKED
                            </span>
                          ) : batch.status === "expiring_soon" ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                              EXPIRING SOON
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Expiry: <strong className="text-slate-700">{batch.expiryDate}</strong> · Stock:{" "}
                          <strong>{batch.quantity} units</strong> · Cost: LKR {batch.costPrice}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-900 text-sm">
                          LKR {batch.sellPrice.toFixed(2)}
                        </span>
                        <button
                          disabled={isExpired || batch.quantity <= 0}
                          onClick={() => addBatchToCart(selectedProductForBatch, batch)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            isExpired
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
                          }`}
                        >
                          {isExpired ? "Blocked" : "Select Batch"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Speed Keys Reference Modal */}
      {isSpeedKeysModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  POS Keyboard Speed Keys Reference
                </h3>
              </div>
              <button
                onClick={() => setIsSpeedKeysModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Settlement Speed Keys
                </span>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-emerald-600 text-white">F2</span>
                  <span className="text-slate-700">Cash Tender Checkout</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-blue-600 text-white">F3</span>
                  <span className="text-slate-700">Card Terminal Charge</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-purple-600 text-white">F4</span>
                  <span className="text-slate-700">Credit Ledger Charge</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-slate-800 text-white">F5</span>
                  <span className="text-slate-700">Bank Transfer</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-amber-600 text-white">F6</span>
                  <span className="text-slate-700">LankaQR Mobile Payment</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-slate-700 text-white">F7</span>
                  <span className="text-slate-700">Split Multiple Tenders</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                  Multi-Bill Switching
                </span>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-slate-900 text-white">F9</span>
                  <span className="text-slate-700">Switch to Bill 1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-slate-900 text-white">F10</span>
                  <span className="text-slate-700">Switch to Bill 2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-slate-900 text-white">F11</span>
                  <span className="text-slate-700">Switch to Bill 3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="speed-key-badge bg-slate-900 text-white">F12</span>
                  <span className="text-slate-700">Switch to Bill 4</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="speed-key-badge bg-orange-600 text-white">Ctrl K</span>
                  <span className="text-slate-700">Global Search</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSpeedKeysModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close Reference
            </button>
          </div>
        </div>
      )}

      {/* Prescription Attachment & Online Link Modal */}
      {isPrescriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Link Prescription to Bill #{activeBillId}
                </h3>
              </div>
              <button
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Currently Linked Prescription Preview */}
            {activeBill.prescriptionUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-slate-200 shrink-0 border">
                  <Image
                    src={activeBill.prescriptionUrl}
                    alt="Prescription attached"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-xs">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">
                    ✓ Attached Digital Prescription
                  </span>
                  <p className="font-bold text-slate-900">{activeBill.customerName}</p>
                  <p className="text-slate-500">{activeBill.customerPhone}</p>
                </div>
              </div>
            )}

            {/* Select from Pending Online Prescriptions */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Or Select from Online Customer Prescriptions Queue:
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {onlinePrescriptions
                  .filter((rx) => rx.status !== "completed")
                  .map((rx) => (
                    <div
                      key={rx.id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-orange-500 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-orange-600">
                            {rx.referenceId}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                            {rx.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800">{rx.customerName}</p>
                        <p className="text-[11px] text-slate-500">{rx.contactNumber}</p>
                      </div>

                      <button
                        onClick={() => {
                          updateActiveBill((b) => ({
                            ...b,
                            customerType: "online",
                            customerName: rx.customerName,
                            customerPhone: rx.contactNumber,
                            customerAddress: rx.address,
                            onlinePrescriptionId: rx.id,
                            prescriptionUrl: rx.fileUrl,
                          }));
                          setIsPrescriptionModalOpen(false);
                          showToast(`Linked prescription ${rx.referenceId} to Bill!`, "success");
                        }}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        Link to Bill
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal (Cash Change, Split, Credit Limits) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Checkout Tender Settlement
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {paymentMode} Settlement
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Net Amount Banner */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Net Invoice Total
                </span>
                <p className="text-2xl font-black text-orange-400">
                  LKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {activeBill.items.length} Medicines
              </span>
            </div>

            {/* Mode-Specific Controls */}
            {paymentMode === "Cash" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Cash Received from Customer (LKR)
                  </label>
                  <input
                    type="number"
                    autoFocus
                    value={tenderCash}
                    onChange={(e) => setTenderCash(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Change Due Calculator */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase">
                    Customer Change Due:
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    LKR{" "}
                    {Math.max(0, (parseFloat(tenderCash) || 0) - netTotal).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 }
                    )}
                  </span>
                </div>
              </div>
            )}

            {paymentMode === "Credit" && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-2">
                <p className="font-extrabold text-purple-900">
                  Customer: {activeBill.customerName}
                </p>
                {(() => {
                  const cust = creditCustomers.find((c) => c.id === activeBill.creditCustomerId);
                  if (!cust) return <p className="text-red-600 font-bold">No credit customer selected!</p>;
                  const avail = cust.creditLimit - cust.outstandingBalance;
                  return (
                    <div className="space-y-1 text-slate-700">
                      <p>Credit Limit: LKR {cust.creditLimit.toLocaleString()}</p>
                      <p>Current Outstanding: LKR {cust.outstandingBalance.toLocaleString()}</p>
                      <p className="font-bold text-purple-800">
                        Available Credit: LKR {avail.toLocaleString()}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {paymentMode === "Split Payment" && (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Cash Portion (LKR)</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => {
                      setSplitCash(e.target.value);
                      const c = parseFloat(e.target.value) || 0;
                      setSplitCard(Math.max(0, netTotal - c).toString());
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Card Portion (LKR)</label>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={(e) => {
                      setSplitCard(e.target.value);
                      const card = parseFloat(e.target.value) || 0;
                      setSplitCash(Math.max(0, netTotal - card).toString());
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {paymentError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Submit Payment */}
            <button
              onClick={handleProcessCheckout}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Settlement &amp; Print Bill</span>
            </button>
          </div>
        </div>
      )}

      {/* Bill Receipt Preview & Thermal Printer Modal */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Payment Completed
              </span>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 80mm POS Thermal Receipt Preview Box */}
            <div
              id="thermal-receipt-print-area"
              className="bg-white border border-slate-300 rounded-xl p-4 font-mono text-[11px] text-slate-900 space-y-3 shadow-inner"
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <h2 className="text-sm font-black uppercase tracking-wider">{settings.pharmacyName}</h2>
                <p className="text-[10px] text-slate-600">{settings.address}</p>
                <p className="text-[10px] text-slate-600">Hotline: {settings.phone}</p>
              </div>

              <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <strong>{completedInvoice.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Date/Time:</span>
                  <span>{new Date(completedInvoice.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{completedInvoice.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{completedInvoice.customerName}</span>
                </div>
              </div>

              {/* Item Lines */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
                {completedInvoice.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span className="truncate max-w-[170px]">{item.product.name}</span>
                      <span>{item.lineTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>
                        {item.quantity} x {item.unitPrice.toFixed(2)} [{item.batch.batchNumber}]
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-0.5 text-xs font-bold pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>LKR {completedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {completedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-LKR {completedInvoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
                  <span>NET TOTAL:</span>
                  <span>LKR {completedInvoice.netTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                  <span>Payment:</span>
                  <span>{completedInvoice.paymentMethod}</span>
                </div>
                {completedInvoice.changeAmount !== undefined && completedInvoice.changeAmount > 0 && (
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Change Due:</span>
                    <span>LKR {completedInvoice.changeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-3 border-t border-dashed border-slate-300">
                <p>{settings.receiptFooter}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

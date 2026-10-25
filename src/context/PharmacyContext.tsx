"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  Product,
  Batch,
  Supplier,
  CreditCustomer,
  CreditLedgerEntry,
  OnlinePrescription,
  SaleInvoice,
  SaleReturn,
  SystemSettings,
  UserProfile,
  GRN,
  StockAdjustment,
  EnvironmentType,
  UserPermissions,
  PaymentMethod,
  getDefaultPermissionsForRole,
} from "@/types/pharmacy";
import {
  initialSettings,
  initialProfiles,
  initialProducts,
  initialBatches,
  initialSuppliers,
  initialCreditCustomers,
  initialCreditLedgers,
  initialOnlinePrescriptions,
  initialSales,
  initialGRNs,
} from "@/lib/seed-data";
import { rtdb, auth, firestore } from "@/lib/firebase/config";
import { ref, onValue, set, get } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

interface RegisteredOwner {
  uid: string;
  displayName: string;
  ownerName: string;
  email: string;
  env?: string;
}

interface PharmacyContextType {
  env: EnvironmentType;
  setEnv: (env: EnvironmentType) => void;
  superUserId: string;
  ownerUid: string;
  ownerName: string;
  currentUser: UserProfile;
  profiles: UserProfile[];
  switchProfile: (profileId: string) => void;
  updateUserPermissions: (userId: string, permissions: UserPermissions) => void;
  registerUserProfile: (profile: UserProfile) => Promise<void>;
  fetchRegisteredOwners: (targetEnv?: EnvironmentType) => Promise<RegisteredOwner[]>;
  signOutUser: () => Promise<void>;

  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;

  products: Product[];
  batches: Batch[];
  suppliers: Supplier[];
  creditCustomers: CreditCustomer[];
  creditLedgers: CreditLedgerEntry[];
  onlinePrescriptions: OnlinePrescription[];
  sales: SaleInvoice[];
  grns: GRN[];
  returns: SaleReturn[];
  adjustments: StockAdjustment[];

  // POS active bill transferred from online prescription
  pendingPrescriptionForPOS: OnlinePrescription | null;
  setPendingPrescriptionForPOS: (rx: OnlinePrescription | null) => void;

  // Alerts & Notifications
  pendingPrescriptionsCount: number;
  expiredBatchesCount: number;
  expiringSoonCount: number;
  lowStockCount: number;
  creditAlertCount: number;
  totalAlertsCount: number;
  soundAlert: () => void;

  // Global search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Mutations
  addOnlinePrescription: (
    payload: Omit<OnlinePrescription, "id" | "referenceId" | "submittedAt" | "status">
  ) => Promise<string>;
  updatePrescriptionStatus: (
    id: string,
    status: OnlinePrescription["status"],
    linkedInvoiceId?: string
  ) => Promise<void>;

  addProduct: (product: Omit<Product, "id" | "createdAt" | "totalStock">, initialBatch: {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    costPrice: number;
    sellPrice: number;
  }) => Promise<void>;

  adjustStock: (adjustment: Omit<StockAdjustment, "id" | "createdAt" | "adjustedBy">) => Promise<void>;

  createGRN: (
    grnData: Omit<GRN, "id" | "grnNumber" | "receivedAt" | "receivedBy">
  ) => Promise<void>;

  completeSale: (saleData: Omit<SaleInvoice, "id" | "invoiceNumber" | "createdAt" | "status">) => Promise<SaleInvoice>;

  processReturn: (returnData: Omit<SaleReturn, "id" | "returnNumber" | "createdAt">) => Promise<void>;

  receiveCreditPayment: (
    customerId: string,
    amount: number,
    paymentMethod: string,
    notes?: string
  ) => Promise<void>;

  addCreditCustomer: (customerData: Omit<CreditCustomer, "id" | "createdAt" | "outstandingBalance">) => Promise<void>;

  addSupplier: (supplierData: Omit<Supplier, "id" | "createdAt">) => Promise<void>;
  updateSupplier: (id: string, supplierData: Partial<Supplier>) => Promise<void>;

  exportBackup: () => string;
  importBackup: (jsonContent: string) => Promise<boolean>;
  resetDemoData: () => Promise<void>;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

// Web Audio API chime generator for real-time notifications
const playChimeSound = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.debug("Audio notification chime:", e);
  }
};

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [env, setEnvState] = useState<EnvironmentType>("Live");

  // User & Profiles
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);
  const [currentUserId, setCurrentUserId] = useState<string>(initialProfiles[0].id);
  const [ownerUid, setOwnerUid] = useState<string>("usr-owner-01");
  const [ownerName, setOwnerName] = useState<string>("Nimal · Owner");

  // Entities
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>(initialCreditCustomers);
  const [creditLedgers, setCreditLedgers] = useState<CreditLedgerEntry[]>(initialCreditLedgers);
  const [onlinePrescriptions, setOnlinePrescriptions] = useState<OnlinePrescription[]>(
    initialOnlinePrescriptions
  );
  const [sales, setSales] = useState<SaleInvoice[]>(initialSales);
  const [grns, setGrns] = useState<GRN[]>(initialGRNs);
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);

  // POS transfer state
  const [pendingPrescriptionForPOS, setPendingPrescriptionForPOS] = useState<OnlinePrescription | null>(null);

  // Global search modal state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Current active user object
  const currentUser = useMemo(() => {
    return (
      profiles.find((p) => p.id === currentUserId || p.uid === currentUserId) || profiles[0]
    );
  }, [profiles, currentUserId]);

  // Active resolved tenant root owner UID and name
  const activeOwnerUid = useMemo(() => {
    return currentUser.ownerUid || ownerUid || "usr-owner-01";
  }, [currentUser.ownerUid, ownerUid]);

  const activeOwnerName = useMemo(() => {
    return currentUser.ownerName || ownerName || "Nimal · Owner";
  }, [currentUser.ownerName, ownerName]);

  // Scoped path in RTDB: /{env}/{ownerUid}
  const tenantBasePath = useMemo(() => `${env}/${activeOwnerUid}`, [env, activeOwnerUid]);

  // Storage key for caching
  const storageKey = useMemo(() => `pharmacy_saas_${env}_${activeOwnerUid}`, [env, activeOwnerUid]);

  // Load from local cache on mount or tenant switch
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedEnv = localStorage.getItem("pharmacy_active_env") as EnvironmentType;
      if (savedEnv === "Live" || savedEnv === "Test") {
        setEnvState(savedEnv);
      }
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.batches) setBatches(parsed.batches);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        if (parsed.creditCustomers) setCreditCustomers(parsed.creditCustomers);
        if (parsed.creditLedgers) setCreditLedgers(parsed.creditLedgers);
        if (parsed.onlinePrescriptions) setOnlinePrescriptions(parsed.onlinePrescriptions);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.grns) setGrns(parsed.grns);
        if (parsed.returns) setReturns(parsed.returns);
        if (parsed.adjustments) setAdjustments(parsed.adjustments);
        if (parsed.profiles) setProfiles(parsed.profiles);
      }
    } catch (err) {
      console.warn("Could not load local cache:", err);
    }
  }, [storageKey]);

  // Save to local cache on changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload = {
        settings,
        products,
        batches,
        suppliers,
        creditCustomers,
        creditLedgers,
        onlinePrescriptions,
        sales,
        grns,
        returns,
        adjustments,
        profiles,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Local storage quota or private mode
    }
  }, [
    storageKey,
    settings,
    products,
    batches,
    suppliers,
    creditCustomers,
    creditLedgers,
    onlinePrescriptions,
    sales,
    grns,
    returns,
    adjustments,
    profiles,
  ]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let loadedProfile: UserProfile | null = null;

        // 1. Check RTDB /users/{userId}
        if (rtdb) {
          try {
            const userSnap = await get(ref(rtdb, `users/${firebaseUser.uid}`));
            if (userSnap.exists()) {
              loadedProfile = userSnap.val();
            }
          } catch (e) {
            console.debug("Failed reading user from RTDB:", e);
          }
        }

        // 2. Check Firestore /users/{userId}
        if (!loadedProfile && firestore) {
          try {
            const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              loadedProfile = userDoc.data() as UserProfile;
            }
          } catch (e) {
            console.debug("Failed reading user from Firestore:", e);
          }
        }

        if (loadedProfile) {
          setProfiles((prev) => {
            const exists = prev.find((p) => p.id === loadedProfile!.id || p.uid === loadedProfile!.uid);
            if (exists) {
              return prev.map((p) => (p.id === loadedProfile!.id ? loadedProfile! : p));
            }
            return [loadedProfile!, ...prev];
          });
          setCurrentUserId(loadedProfile.id || loadedProfile.uid || firebaseUser.uid);
          if (loadedProfile.ownerUid) {
            setOwnerUid(loadedProfile.ownerUid);
          }
          if (loadedProfile.ownerName) {
            setOwnerName(loadedProfile.ownerName);
          }
          if (loadedProfile.env) {
            setEnvState(loadedProfile.env);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Connect to Firebase RTDB scoped strictly to /{env}/{ownerUid}/...
  useEffect(() => {
    if (!rtdb) return;

    // Sync online prescriptions in real-time
    const rxRef = ref(rtdb, `${tenantBasePath}/onlinePrescriptions`);
    const unsubscribeRx = onValue(
      rxRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const items: OnlinePrescription[] = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.values(val);
          setOnlinePrescriptions((prev) => {
            if (items.length > prev.length) {
              playChimeSound();
            }
            return items;
          });
        }
      },
      (error) => {
        console.debug("RTDB onlinePrescriptions listener:", error.message);
      }
    );

    // Sync settings
    const settingsRef = ref(rtdb, `${tenantBasePath}/settings`);
    const unsubscribeSettings = onValue(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.val());
        }
      },
      (error) => console.debug("RTDB settings listener:", error.message)
    );

    // Sync products
    const prodRef = ref(rtdb, `${tenantBasePath}/products`);
    const unsubscribeProducts = onValue(
      prodRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const items: Product[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          setProducts(items);
        }
      },
      (error) => console.debug("RTDB products listener:", error.message)
    );

    // Sync batches
    const batchRef = ref(rtdb, `${tenantBasePath}/batches`);
    const unsubscribeBatches = onValue(
      batchRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const items: Batch[] = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          setBatches(items);
        }
      },
      (error) => console.debug("RTDB batches listener:", error.message)
    );

    return () => {
      unsubscribeRx();
      unsubscribeSettings();
      unsubscribeProducts();
      unsubscribeBatches();
    };
  }, [tenantBasePath]);

  const setEnv = useCallback((newEnv: EnvironmentType) => {
    setEnvState(newEnv);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmacy_active_env", newEnv);
    }
  }, []);

  const switchProfile = useCallback((profileId: string) => {
    setCurrentUserId(profileId);
    const target = profiles.find((p) => p.id === profileId || p.uid === profileId);
    if (target) {
      if (target.ownerUid) setOwnerUid(target.ownerUid);
      if (target.ownerName) setOwnerName(target.ownerName);
      if (target.env) setEnvState(target.env);
    }
  }, [profiles]);

  const updateUserPermissions = useCallback(
    (userId: string, permissions: UserPermissions) => {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId || p.uid === userId ? { ...p, permissions } : p))
      );
    },
    []
  );

  // Register & mirror user profile to Firestore and RTDB identically
  const registerUserProfile = useCallback(async (profile: UserProfile) => {
    const cleanProfile: UserProfile = {
      id: profile.id || profile.uid || `usr-${Date.now()}`,
      uid: profile.uid || profile.id,
      displayName: profile.displayName,
      email: profile.email,
      env: profile.env,
      role: profile.role,
      ownerName: profile.ownerName || profile.displayName,
      ownerUid: profile.ownerUid || profile.id,
      superUserId: profile.ownerUid || profile.id,
      permissions: profile.permissions || getDefaultPermissionsForRole(profile.role),
      createdAt: profile.createdAt || new Date().toISOString(),
    };

    setProfiles((prev) => {
      const exists = prev.find((p) => p.id === cleanProfile.id || p.uid === cleanProfile.uid);
      if (exists) {
        return prev.map((p) => (p.id === cleanProfile.id ? cleanProfile : p));
      }
      return [cleanProfile, ...prev];
    });

    setCurrentUserId(cleanProfile.id);
    setOwnerUid(cleanProfile.ownerUid);
    setOwnerName(cleanProfile.ownerName);
    setEnvState(cleanProfile.env);

    // 1. Mirror to Firestore (/users/{userId})
    if (firestore) {
      try {
        const userDocRef = doc(firestore, "users", cleanProfile.uid!);
        await setDoc(userDocRef, cleanProfile, { merge: true });
      } catch (err) {
        console.warn("Firestore save user profile warning:", err);
      }
    }

    // 2. Mirror to RTDB (/users/{userId})
    if (rtdb) {
      try {
        const rtdbUserRef = ref(rtdb, `users/${cleanProfile.uid}`);
        await set(rtdbUserRef, cleanProfile);
      } catch (err) {
        console.warn("RTDB save user profile warning:", err);
      }
    }
  }, []);

  // Fetch list of registered Owners for the given environment
  const fetchRegisteredOwners = useCallback(
    async (targetEnv: EnvironmentType = env): Promise<RegisteredOwner[]> => {
      const ownersList: RegisteredOwner[] = [];

      // 1. Try RTDB /users first
      if (rtdb) {
        try {
          const usersRef = ref(rtdb, "users");
          const snap = await get(usersRef);
          if (snap.exists()) {
            const data = snap.val();
            Object.values(data).forEach((u: unknown) => {
              const user = u as Record<string, string>;
              if (user && user.role === "Owner" && (!targetEnv || user.env === targetEnv)) {
                ownersList.push({
                  uid: user.uid || user.id,
                  displayName: user.displayName || user.ownerName,
                  ownerName: user.ownerName || user.displayName,
                  email: user.email,
                  env: user.env,
                });
              }
            });
          }
        } catch (e) {
          console.debug("Error fetching owners from RTDB:", e);
        }
      }

      // 2. Try Firestore /users
      if (ownersList.length === 0 && firestore) {
        try {
          const q = query(collection(firestore, "users"), where("role", "==", "Owner"));
          const querySnap = await getDocs(q);
          querySnap.forEach((docSnap) => {
            const u = docSnap.data();
            if (u && (!targetEnv || u.env === targetEnv)) {
              ownersList.push({
                uid: docSnap.id,
                displayName: u.displayName || u.ownerName,
                ownerName: u.ownerName || u.displayName,
                email: u.email,
                env: u.env,
              });
            }
          });
        } catch (e) {
          console.debug("Error fetching owners from Firestore:", e);
        }
      }

      // 3. Fallback to local profiles
      if (ownersList.length === 0) {
        profiles
          .filter((p) => p.role === "Owner" && p.env === targetEnv)
          .forEach((p) => {
            ownersList.push({
              uid: p.ownerUid || p.id,
              displayName: p.displayName,
              ownerName: p.ownerName || p.displayName,
              email: p.email,
              env: p.env,
            });
          });
      }

      return ownersList;
    },
    [env, profiles]
  );

  // Sign out user and redirect to login
  const signOutUser = useCallback(async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Sign out warning:", e);
      }
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<SystemSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        return updated;
      });

      if (rtdb) {
        try {
          const settingsRef = ref(rtdb, `${tenantBasePath}/settings`);
          await set(settingsRef, { ...settings, ...newSettings });
        } catch (e) {
          console.debug("Firebase RTDB update settings error:", e);
        }
      }
    },
    [tenantBasePath, settings]
  );

  // Recalculate batch statuses based on today's date
  useEffect(() => {
    const now = new Date();
    setBatches((prev) =>
      prev.map((batch) => {
        const exp = new Date(batch.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
        let status: Batch["status"] = "active";
        if (diffDays <= 0) {
          status = "expired";
        } else if (diffDays <= settings.expiryWarningDays) {
          status = "expiring_soon";
        } else if (batch.quantity <= settings.lowStockThresholdDefault) {
          status = "low";
        }
        if (batch.status !== status) {
          return { ...batch, status };
        }
        return batch;
      })
    );
  }, [settings.expiryWarningDays, settings.lowStockThresholdDefault]);

  // Alert Counts
  const pendingPrescriptionsCount = useMemo(() => {
    return onlinePrescriptions.filter((rx) => rx.status === "pending").length;
  }, [onlinePrescriptions]);

  const expiredBatchesCount = useMemo(() => {
    return batches.filter((b) => b.status === "expired").length;
  }, [batches]);

  const expiringSoonCount = useMemo(() => {
    return batches.filter((b) => b.status === "expiring_soon").length;
  }, [batches]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.totalStock <= p.lowStockLimit).length;
  }, [products]);

  const creditAlertCount = useMemo(() => {
    return creditCustomers.filter(
      (c) => c.outstandingBalance >= c.creditLimit * 0.75
    ).length;
  }, [creditCustomers]);

  const totalAlertsCount =
    pendingPrescriptionsCount +
    expiredBatchesCount +
    expiringSoonCount +
    lowStockCount +
    creditAlertCount;

  // Mutations
  const addOnlinePrescription = useCallback(
    async (
      payload: Omit<OnlinePrescription, "id" | "referenceId" | "submittedAt" | "status">
    ): Promise<string> => {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceId = `RX-${year}-${randomSuffix}`;
      const newPrescription: OnlinePrescription = {
        id: `rx-${Date.now()}`,
        referenceId,
        customerName: payload.customerName,
        address: payload.address,
        contactNumber: payload.contactNumber,
        notes: payload.notes || "",
        fileUrl: payload.fileUrl,
        fileName: payload.fileName || "prescription.jpg",
        submittedAt: new Date().toISOString(),
        status: "pending",
      };

      setOnlinePrescriptions((prev) => [newPrescription, ...prev]);
      playChimeSound();

      if (rtdb) {
        try {
          const itemRef = ref(
            rtdb,
            `${tenantBasePath}/onlinePrescriptions/${newPrescription.id}`
          );
          await set(itemRef, newPrescription);
        } catch (e) {
          console.debug("Firebase RTDB add online prescription:", e);
        }
      }

      return referenceId;
    },
    [tenantBasePath]
  );

  const updatePrescriptionStatus = useCallback(
    async (
      id: string,
      status: OnlinePrescription["status"],
      linkedInvoiceId?: string
    ) => {
      setOnlinePrescriptions((prev) =>
        prev.map((rx) =>
          rx.id === id
            ? {
                ...rx,
                status,
                ...(linkedInvoiceId ? { linkedInvoiceId } : {}),
                handledBy: currentUser.displayName,
              }
            : rx
        )
      );

      if (rtdb) {
        try {
          const targetRef = ref(
            rtdb,
            `${tenantBasePath}/onlinePrescriptions/${id}`
          );
          const snap = await get(targetRef);
          if (snap.exists()) {
            await set(targetRef, {
              ...snap.val(),
              status,
              ...(linkedInvoiceId ? { linkedInvoiceId } : {}),
            });
          }
        } catch (e) {
          console.debug("Firebase RTDB update prescription status:", e);
        }
      }
    },
    [tenantBasePath, currentUser.displayName]
  );

  const addProduct = useCallback(
    async (
      productData: Omit<Product, "id" | "createdAt" | "totalStock">,
      initialBatch: {
        batchNumber: string;
        expiryDate: string;
        quantity: number;
        costPrice: number;
        sellPrice: number;
      }
    ) => {
      const prodId = `prod-${Date.now()}`;
      const batchId = `bat-${Date.now()}`;

      const newProduct: Product = {
        ...productData,
        id: prodId,
        totalStock: initialBatch.quantity,
        createdAt: new Date().toISOString(),
      };

      const now = new Date();
      const exp = new Date(initialBatch.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
      let batchStatus: Batch["status"] = "active";
      if (diffDays <= 0) batchStatus = "expired";
      else if (diffDays <= settings.expiryWarningDays) batchStatus = "expiring_soon";
      else if (initialBatch.quantity <= settings.lowStockThresholdDefault) batchStatus = "low";

      const newBatch: Batch = {
        id: batchId,
        productId: prodId,
        productName: newProduct.name,
        barcode: newProduct.barcode,
        batchNumber: initialBatch.batchNumber,
        expiryDate: initialBatch.expiryDate,
        costPrice: initialBatch.costPrice,
        sellPrice: initialBatch.sellPrice,
        quantity: initialBatch.quantity,
        receivedDate: new Date().toISOString().split("T")[0],
        supplierId: newProduct.primarySupplierId,
        supplierName: newProduct.primarySupplierName,
        status: batchStatus,
      };

      setProducts((prev) => [newProduct, ...prev]);
      setBatches((prev) => [newBatch, ...prev]);

      if (rtdb) {
        try {
          await set(ref(rtdb, `${tenantBasePath}/products/${prodId}`), newProduct);
          await set(ref(rtdb, `${tenantBasePath}/batches/${batchId}`), newBatch);
        } catch (e) {
          console.debug("Firebase RTDB add product:", e);
        }
      }
    },
    [tenantBasePath, settings.expiryWarningDays, settings.lowStockThresholdDefault]
  );

  const adjustStock = useCallback(
    async (adjustmentData: Omit<StockAdjustment, "id" | "createdAt" | "adjustedBy">) => {
      const adjId = `adj-${Date.now()}`;
      const newAdjustment: StockAdjustment = {
        ...adjustmentData,
        id: adjId,
        createdAt: new Date().toISOString(),
        adjustedBy: currentUser.displayName,
      };

      setAdjustments((prev) => [newAdjustment, ...prev]);

      // Mutate batch quantity
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id === adjustmentData.batchId) {
            return { ...b, quantity: adjustmentData.newQuantity };
          }
          return b;
        })
      );

      // Mutate product totalStock
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === adjustmentData.productId) {
            const diff = adjustmentData.newQuantity - adjustmentData.previousQuantity;
            return { ...p, totalStock: Math.max(0, p.totalStock + diff) };
          }
          return p;
        })
      );

      if (rtdb) {
        try {
          await set(ref(rtdb, `${tenantBasePath}/adjustments/${adjId}`), newAdjustment);
        } catch (e) {
          console.debug("Firebase RTDB adjust stock:", e);
        }
      }
    },
    [tenantBasePath, currentUser.displayName]
  );

  const createGRN = useCallback(
    async (grnData: Omit<GRN, "id" | "grnNumber" | "receivedAt" | "receivedBy">) => {
      const year = new Date().getFullYear();
      const grnNumber = `GRN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newGRN: GRN = {
        ...grnData,
        id: `grn-${Date.now()}`,
        grnNumber,
        receivedAt: new Date().toISOString(),
        receivedBy: currentUser.displayName,
      };

      setGrns((prev) => [newGRN, ...prev]);

      const updatedBatches = [...batches];
      const productStockIncrements: Record<string, number> = {};

      for (const item of grnData.lineItems) {
        productStockIncrements[item.productId] =
          (productStockIncrements[item.productId] || 0) + item.receivedQuantity;

        const existingBatchIndex = updatedBatches.findIndex(
          (b) => b.productId === item.productId && b.batchNumber === item.batchNumber
        );

        if (existingBatchIndex >= 0) {
          const current = updatedBatches[existingBatchIndex];
          updatedBatches[existingBatchIndex] = {
            ...current,
            quantity: current.quantity + item.receivedQuantity,
            costPrice: item.unitCostPrice,
            sellPrice: item.unitSellingPrice,
            expiryDate: item.expiryDate,
          };
        } else {
          updatedBatches.push({
            id: `bat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            productId: item.productId,
            productName: item.productName,
            barcode: item.barcode,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            costPrice: item.unitCostPrice,
            sellPrice: item.unitSellingPrice,
            quantity: item.receivedQuantity,
            receivedDate: new Date().toISOString().split("T")[0],
            supplierId: grnData.supplierId,
            supplierName: grnData.supplierName,
            status: "active",
          });
        }
      }

      setBatches(updatedBatches);

      setProducts((prev) =>
        prev.map((p) => {
          const inc = productStockIncrements[p.id];
          if (inc) {
            return { ...p, totalStock: p.totalStock + inc };
          }
          return p;
        })
      );

      // Update supplier statistics
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id === grnData.supplierId) {
            return {
              ...s,
              totalGRNs: (s.totalGRNs || 0) + 1,
              totalSpend: (s.totalSpend || 0) + grnData.totalCost,
            };
          }
          return s;
        })
      );

      if (rtdb) {
        try {
          await set(ref(rtdb, `${tenantBasePath}/grns/${newGRN.id}`), newGRN);
        } catch (e) {
          console.debug("Firebase RTDB create GRN:", e);
        }
      }
    },
    [tenantBasePath, batches, currentUser.displayName]
  );

  const completeSale = useCallback(
    async (
      saleData: Omit<SaleInvoice, "id" | "invoiceNumber" | "createdAt" | "status">
    ): Promise<SaleInvoice> => {
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newSale: SaleInvoice = {
        ...saleData,
        id: `sale-${Date.now()}`,
        invoiceNumber,
        createdAt: new Date().toISOString(),
        status: "completed",
      };

      setSales((prev) => [newSale, ...prev]);

      // Deduct inventory quantities per batch & per product
      const batchDeductions: Record<string, number> = {};
      const productDeductions: Record<string, number> = {};

      newSale.items.forEach((item) => {
        batchDeductions[item.batch.id] = (batchDeductions[item.batch.id] || 0) + item.quantity;
        productDeductions[item.product.id] =
          (productDeductions[item.product.id] || 0) + item.quantity;
      });

      setBatches((prev) =>
        prev.map((b) => {
          const deduct = batchDeductions[b.id];
          if (deduct) {
            return { ...b, quantity: Math.max(0, b.quantity - deduct) };
          }
          return b;
        })
      );

      setProducts((prev) =>
        prev.map((p) => {
          const deduct = productDeductions[p.id];
          if (deduct) {
            return { ...p, totalStock: Math.max(0, p.totalStock - deduct) };
          }
          return p;
        })
      );

      // Handle Credit Customer Charge
      if (saleData.paymentMethod === "Credit" && saleData.customerId) {
        const chargedAmount = saleData.netTotal;
        setCreditCustomers((prev) =>
          prev.map((cust) => {
            if (cust.id === saleData.customerId) {
              const newBalance = cust.outstandingBalance + chargedAmount;
              return { ...cust, outstandingBalance: newBalance };
            }
            return cust;
          })
        );

        const targetCust = creditCustomers.find((c) => c.id === saleData.customerId);
        if (targetCust) {
          const newLedger: CreditLedgerEntry = {
            id: `cld-${Date.now()}`,
            customerId: targetCust.id,
            customerName: targetCust.name,
            type: "charge",
            amount: chargedAmount,
            reference: invoiceNumber,
            balanceAfter: targetCust.outstandingBalance + chargedAmount,
            createdAt: new Date().toISOString(),
            notes: `POS Credit Checkout (${saleData.items.length} items)`,
          };
          setCreditLedgers((prev) => [newLedger, ...prev]);

          if (rtdb) {
            try {
              await set(ref(rtdb, `${tenantBasePath}/creditLedger/${newLedger.id}`), newLedger);
            } catch (e) {
              console.debug("Firebase RTDB credit ledger:", e);
            }
          }
        }
      }

      // If fulfilled from an online prescription, mark it completed!
      if (saleData.onlinePrescriptionId) {
        updatePrescriptionStatus(saleData.onlinePrescriptionId, "completed", invoiceNumber);
      }

      if (rtdb) {
        try {
          await set(ref(rtdb, `${tenantBasePath}/sales/${newSale.id}`), newSale);
        } catch (e) {
          console.debug("Firebase RTDB complete sale:", e);
        }
      }

      return newSale;
    },
    [tenantBasePath, creditCustomers, updatePrescriptionStatus]
  );

  const processReturn = useCallback(
    async (returnData: Omit<SaleReturn, "id" | "returnNumber" | "createdAt">) => {
      const year = new Date().getFullYear();
      const returnNumber = `RET-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newReturn: SaleReturn = {
        ...returnData,
        id: `ret-${Date.now()}`,
        returnNumber,
        createdAt: new Date().toISOString(),
      };

      setReturns((prev) => [newReturn, ...prev]);

      // Restore inventory
      returnData.items.forEach((retItem) => {
        setBatches((prev) =>
          prev.map((b) => (b.id === retItem.batchId ? { ...b, quantity: b.quantity + retItem.returnedQuantity } : b))
        );
        setProducts((prev) =>
          prev.map((p) => (p.id === retItem.productId ? { ...p, totalStock: p.totalStock + retItem.returnedQuantity } : p))
        );
      });

      if (rtdb) {
        try {
          await set(ref(rtdb, `${tenantBasePath}/returns/${newReturn.id}`), newReturn);
        } catch (e) {
          console.debug("Firebase RTDB return:", e);
        }
      }
    },
    [tenantBasePath]
  );

  const receiveCreditPayment = useCallback(
    async (customerId: string, amount: number, paymentMethod: string, notes?: string) => {
      const cust = creditCustomers.find((c) => c.id === customerId);
      if (!cust) return;

      const newBalance = Math.max(0, cust.outstandingBalance - amount);
      const year = new Date().getFullYear();
      const receiptNumber = `RCT-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      setCreditCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, outstandingBalance: newBalance } : c))
      );

      const newLedger: CreditLedgerEntry = {
        id: `cld-${Date.now()}`,
        customerId,
        customerName: cust.name,
        type: "payment",
        amount,
        reference: receiptNumber,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
        notes: notes || `Credit settled via ${paymentMethod}`,
      };

      setCreditLedgers((prev) => [newLedger, ...prev]);

      if (rtdb) {
        try {
          await set(ref(rtdb, `${tenantBasePath}/creditLedger/${newLedger.id}`), newLedger);
          await set(ref(rtdb, `${tenantBasePath}/creditCustomers/${customerId}/outstandingBalance`), newBalance);
        } catch (e) {
          console.debug("Firebase RTDB credit payment:", e);
        }
      }
    },
    [tenantBasePath, creditCustomers]
  );

  const addCreditCustomer = useCallback(
    async (customerData: Omit<CreditCustomer, "id" | "createdAt" | "outstandingBalance">) => {
      const newCustomer: CreditCustomer = {
        ...customerData,
        id: `cust-${Date.now()}`,
        outstandingBalance: 0,
        createdAt: new Date().toISOString(),
      };
      setCreditCustomers((prev) => [newCustomer, ...prev]);

      if (rtdb) {
        try {
          await set(ref(rtdb, `${tenantBasePath}/creditCustomers/${newCustomer.id}`), newCustomer);
        } catch (e) {
          console.debug("Firebase RTDB add credit customer:", e);
        }
      }
    },
    [tenantBasePath]
  );

  const addSupplier = useCallback(
    async (supplierData: Omit<Supplier, "id" | "createdAt">) => {
      const newSupplier: Supplier = {
        ...supplierData,
        id: `sup-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setSuppliers((prev) => [newSupplier, ...prev]);

      if (rtdb) {
        try {
          await set(ref(rtdb, `${tenantBasePath}/suppliers/${newSupplier.id}`), newSupplier);
        } catch (e) {
          console.debug("Firebase RTDB add supplier:", e);
        }
      }
    },
    [tenantBasePath]
  );

  const updateSupplier = useCallback(
    async (id: string, supplierData: Partial<Supplier>) => {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...supplierData } : s))
      );

      if (rtdb) {
        try {
          const supRef = ref(rtdb, `${tenantBasePath}/suppliers/${id}`);
          const snap = await get(supRef);
          if (snap.exists()) {
            await set(supRef, { ...snap.val(), ...supplierData });
          }
        } catch (e) {
          console.debug("Firebase RTDB update supplier:", e);
        }
      }
    },
    [tenantBasePath]
  );

  const exportBackup = useCallback((): string => {
    const data = {
      version: "2.0.0",
      tenantId: activeOwnerUid,
      exportedAt: new Date().toISOString(),
      settings,
      products,
      batches,
      suppliers,
      creditCustomers,
      creditLedgers,
      onlinePrescriptions,
      sales,
      grns,
      returns,
      adjustments,
      profiles,
    };
    return JSON.stringify(data, null, 2);
  }, [
    activeOwnerUid,
    settings,
    products,
    batches,
    suppliers,
    creditCustomers,
    creditLedgers,
    onlinePrescriptions,
    sales,
    grns,
    returns,
    adjustments,
    profiles,
  ]);

  const importBackup = useCallback(async (jsonContent: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonContent);
      if (data.settings) setSettings(data.settings);
      if (data.products) setProducts(data.products);
      if (data.batches) setBatches(data.batches);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.creditCustomers) setCreditCustomers(data.creditCustomers);
      if (data.creditLedgers) setCreditLedgers(data.creditLedgers);
      if (data.onlinePrescriptions) setOnlinePrescriptions(data.onlinePrescriptions);
      if (data.sales) setSales(data.sales);
      if (data.grns) setGrns(data.grns);
      if (data.returns) setReturns(data.returns);
      if (data.adjustments) setAdjustments(data.adjustments);
      if (data.profiles) setProfiles(data.profiles);
      return true;
    } catch (e) {
      console.error("Failed to import backup:", e);
      return false;
    }
  }, []);

  const resetDemoData = useCallback(async () => {
    setSettings(initialSettings);
    setProducts(initialProducts);
    setBatches(initialBatches);
    setSuppliers(initialSuppliers);
    setCreditCustomers(initialCreditCustomers);
    setCreditLedgers(initialCreditLedgers);
    setOnlinePrescriptions(initialOnlinePrescriptions);
    setSales(initialSales);
    setGrns(initialGRNs);
    setReturns([]);
    setAdjustments([]);
    setProfiles(initialProfiles);

    if (rtdb) {
      try {
        await set(ref(rtdb, `${tenantBasePath}`), {
          settings: initialSettings,
          products: initialProducts,
          batches: initialBatches,
          suppliers: initialSuppliers,
          creditCustomers: initialCreditCustomers,
          creditLedgers: initialCreditLedgers,
          onlinePrescriptions: initialOnlinePrescriptions,
          sales: initialSales,
          grns: initialGRNs,
        });
      } catch (e) {
        console.debug("Reset RTDB error:", e);
      }
    }
  }, [tenantBasePath]);

  return (
    <PharmacyContext.Provider
      value={{
        env,
        setEnv,
        superUserId: activeOwnerUid,
        ownerUid: activeOwnerUid,
        ownerName: activeOwnerName,
        currentUser,
        profiles,
        switchProfile,
        updateUserPermissions,
        registerUserProfile,
        fetchRegisteredOwners,
        signOutUser,
        settings,
        updateSettings,
        products,
        batches,
        suppliers,
        creditCustomers,
        creditLedgers,
        onlinePrescriptions,
        sales,
        grns,
        returns,
        adjustments,
        pendingPrescriptionForPOS,
        setPendingPrescriptionForPOS,
        pendingPrescriptionsCount,
        expiredBatchesCount,
        expiringSoonCount,
        lowStockCount,
        creditAlertCount,
        totalAlertsCount,
        soundAlert: playChimeSound,
        isSearchOpen,
        setIsSearchOpen,
        addOnlinePrescription,
        updatePrescriptionStatus,
        addProduct,
        adjustStock,
        createGRN,
        completeSale,
        processReturn,
        receiveCreditPayment,
        addCreditCustomer,
        addSupplier,
        updateSupplier,
        exportBackup,
        importBackup,
        resetDemoData,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error("usePharmacy must be used within a PharmacyProvider");
  }
  return context;
};

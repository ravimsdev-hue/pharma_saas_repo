"use client";

import React, { useState, useMemo } from "react";
import { usePharmacy } from "@/context/PharmacyContext";
import { Supplier } from "@/types/pharmacy";
import {
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Package,
  Truck,
  DollarSign,
  X,
  CheckCircle,
} from "lucide-react";

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, products, grns } = usePharmacy();

  const [query, setQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const filteredSuppliers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suppliers.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [suppliers, query]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setContactPerson(sup.contactPerson);
    setPhone(sup.phone);
    setEmail(sup.email);
    setAddress(sup.address);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson || !phone) return;

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, {
        name,
        contactPerson,
        phone,
        email,
        address,
      });
    } else {
      await addSupplier({
        name,
        contactPerson,
        phone,
        email,
        address,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Procurement Network
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Suppliers &amp; Distributors Directory
          </h1>
          <p className="text-xs text-slate-500">
            Registered pharmaceutical manufacturers, authorized importers, and order statistics.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by supplier name, contact person, or phone..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((sup) => {
          const supProducts = products.filter((p) => p.primarySupplierId === sup.id);
          const supGRNs = grns.filter((g) => g.supplierId === sup.id);
          const totalSpend = supGRNs.reduce((acc, g) => acc + g.totalCost, 0) || sup.totalSpend || 0;

          return (
            <div
              key={sup.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{sup.name}</h3>
                      <p className="text-[11px] text-slate-500">Contact: {sup.contactPerson}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(sup)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </p>
                  {sup.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.email}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{sup.address}</span>
                  </p>
                </div>
              </div>

              {/* Statistics */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Products
                  </span>
                  <span className="font-black text-slate-900">{supProducts.length}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    GRNs
                  </span>
                  <span className="font-black text-slate-900">{supGRNs.length}</span>
                </div>
                <div className="p-2 bg-orange-50 rounded-xl">
                  <span className="text-[10px] text-orange-700 uppercase font-semibold block">
                    Spend
                  </span>
                  <span className="font-black text-orange-600 text-[11px]">
                    LKR {(totalSpend / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-slate-900 text-base">
                {editingSupplier ? "Edit Supplier Profile" : "+ Register New Supplier"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. State Pharmaceuticals Corp"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Mr. Bandara"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 11 ..."
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="orders@supplier.lk"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Location / Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Colombo, Sri Lanka"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
              >
                {editingSupplier ? "Update Supplier" : "Register Supplier"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

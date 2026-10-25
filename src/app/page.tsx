"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePharmacy } from "@/context/PharmacyContext";
import { onlinePrescriptionSchema } from "@/lib/validation";
import {
  ShieldCheck,
  Upload,
  CheckCircle,
  Clock,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  LogIn,
  Camera,
  HeartHandshake,
  Truck,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  Search,
  ZoomIn,
} from "lucide-react";

export default function PublicHeroPage() {
  const { settings, addOnlinePrescription, products } = usePharmacy();

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittedReferenceId, setSubmittedReferenceId] = useState<string | null>(null);

  // Poster lightbox modal state
  const [isPosterZoomOpen, setIsPosterZoomOpen] = useState(false);

  // Search in catalogue
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Hydration-safe year
  const [year, setYear] = useState(2026);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // File picker ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormErrors((prev) => ({
        ...prev,
        fileUrl: "File size must be under 10MB",
      }));
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setFileUrl(result);
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.fileUrl;
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const payload = {
      customerName,
      address,
      contactNumber,
      notes,
      fileUrl,
      fileName,
    };

    const validation = onlinePrescriptionSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const refId = await addOnlinePrescription({
        customerName,
        address,
        contactNumber,
        notes,
        fileUrl,
        fileName,
      });
      setSubmittedReferenceId(refId);

      // Reset form
      setCustomerName("");
      setAddress("");
      setContactNumber("");
      setNotes("");
      setFileUrl("");
      setFileName("");
    } catch (err) {
      console.error(err);
      setFormErrors({ submit: "Failed to submit prescription. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
      (p.genericName && p.genericName.toLowerCase().includes(catalogueSearch.toLowerCase()));
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* 
        ========================================================================
        APP BACKGROUND IMAGE (Pharma.jpg)
        Uses the provided Pharma.jpg asset as an atmospheric, ambient full-app
        backdrop with soft diffusion so typography and controls remain pristine.
        ========================================================================
      */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none -z-20 opacity-[0.06] scale-105"
        style={{ backgroundImage: "url('/Pharma.jpg')" }}
      />

      {/* Top Brand Notification Banner */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs border-b border-slate-800 relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online Orders &amp; Delivery Active
            </span>
            <span className="text-slate-500">|</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-orange-400" />
              Hotline: {settings.phone}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {settings.address}
            </span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Staff Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white text-xl font-black shadow-md shadow-orange-600/30">
              +
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight block">
                {settings.pharmacyName}
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                {settings.tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#upload-form"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Prescription</span>
            </a>

            <a
              href="#available-medicines"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Browse Medicines</span>
            </a>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100/60 hover:bg-slate-100 transition-colors"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        HERO SECTION:
        - Pharma.jpg is displayed "AS IT IS" — full 896x1200 natural aspect ratio,
          completely uncropped, zero overflow, perfectly crisp.
        - Next to the poster is the interactive Prescription Upload Portal Card
          directly fulfilling the poster's prompt:
          "Upload Prescription: Enter Name, Address & Contact Number".
        ========================================================================
      */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-6 pb-14 lg:py-16 bg-linear-to-b from-white/95 via-slate-50/90 to-slate-100/90 border-b border-slate-200">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/3 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* 
                COLUMN 1: THE COMPLETE, UNCROPPED PHARMA.JPG POSTER (AS IT IS)
                Zero overflow, exact 3:4 aspect ratio, full graphics visible.
              */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <div className="relative w-full max-w-md lg:max-w-[480px]">
                  {/* Subtle ambient glow aura */}
                  <div className="absolute -inset-2 bg-linear-to-r from-teal-500/20 via-emerald-500/15 to-orange-500/20 rounded-3xl blur-xl opacity-70" />

                  {/* Clean uncropped poster card */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 bg-white ring-1 ring-slate-900/5 group">
                    <Image
                      src="/Pharma.jpg"
                      alt="Borcelle Pharmacy - All Medicines Store"
                      width={896}
                      height={1200}
                      priority
                      className="w-full h-auto object-contain block group-hover:scale-[1.01] transition-transform duration-500"
                    />

                    {/* Quick Lightbox Zoom Button */}
                    <button
                      type="button"
                      onClick={() => setIsPosterZoomOpen(true)}
                      className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl backdrop-blur-md opacity-90 hover:opacity-100 transition-all shadow-lg text-xs font-semibold flex items-center gap-1.5"
                      title="Click to view full flyer"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-orange-400" />
                      <span>View Full Image</span>
                    </button>
                  </div>

                  {/* Live Trust Badges below the poster */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Licensed Pharmacists 24/7
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-800 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 shadow-2xs">
                      <Truck className="w-3.5 h-3.5 text-orange-600" />
                      Island-wide Delivery
                    </span>
                  </div>
                </div>
              </div>

              {/* 
                COLUMN 2: INTERACTIVE PRESCRIPTION DISPENSING PORTAL
                Matches the flyer's call to action:
                "Upload Prescription: Enter Name, Address & Contact Number"
              */}
              <div id="upload-form" className="lg:col-span-6 space-y-6 scroll-mt-20">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl space-y-6">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                        <span>Online Prescription Ordering</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Upload Prescription
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Enter Name, Address &amp; Contact Number to receive verified medicines at your doorstep.
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200/60 shadow-inner">
                      <Upload className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Submitted Success Notice */}
                  {submittedReferenceId && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span>Prescription Submitted Successfully!</span>
                      </div>
                      <p className="text-xs text-emerald-700">
                        Reference ID:{" "}
                        <strong className="font-mono text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                          {submittedReferenceId}
                        </strong>
                      </p>
                      <p className="text-xs text-slate-600">
                        Our pharmacist is verifying your prescription. We will call you shortly at your contact number.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmittedReferenceId(null)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline pt-1 block"
                      >
                        Submit another prescription
                      </button>
                    </div>
                  )}

                  {/* Interactive Prescription Upload Form */}
                  <form onSubmit={handleSubmitPrescription} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Customer Full Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Kasun Kalhara"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                        />
                        {formErrors.customerName && (
                          <p className="text-xs text-red-600 font-semibold">{formErrors.customerName}</p>
                        )}
                      </div>

                      {/* Contact Number */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Contact Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="e.g. 077 123 4567"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                        />
                        {formErrors.contactNumber && (
                          <p className="text-xs text-red-600 font-semibold">{formErrors.contactNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Delivery Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Complete street address, town, and landmarks for doorstep delivery..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                      />
                      {formErrors.address && (
                        <p className="text-xs text-red-600 font-semibold">{formErrors.address}</p>
                      )}
                    </div>

                    {/* Prescription File Attachment */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Prescription Document / Photo <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />

                      {!fileUrl ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50/70 hover:bg-orange-50/30 rounded-2xl p-5 text-center cursor-pointer transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                            <Camera className="w-5 h-5" />
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">
                            Click or drag prescription photo / PDF
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Camera snapshot, JPG, PNG or PDF (up to 10MB)
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
                              {fileUrl.startsWith("data:image") || fileUrl.endsWith(".jpg") ? (
                                <Image
                                  src={fileUrl}
                                  alt="Prescription preview"
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <FileText className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 line-clamp-1">{fileName}</p>
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                ✓ Prescription attached
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setFileUrl("");
                              setFileName("");
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {formErrors.fileUrl && (
                        <p className="text-xs text-red-600 font-semibold">{formErrors.fileUrl}</p>
                      )}
                    </div>

                    {/* Patient Notes */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Patient / Generic Notes <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Substitute with approved generics if available..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                      />
                    </div>

                    {formErrors.submit && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formErrors.submit}</span>
                      </div>
                    )}

                    {/* Submit Action Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Submitting to Pharmacist Queue...</span>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Submit Prescription for Instant Verification</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Fast Action Shortcuts */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <a
                      href="#available-medicines"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Browse Medicines ({products.length} in stock)</span>
                    </a>

                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-slate-400" />
                      <span>Staff Portal Login</span>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 
          ========================================================================
          LIVE MEDICINES CATALOGUE SECTION
          Allows customers to browse high-quality certified medications.
          ========================================================================
        */}
        <section id="available-medicines" className="py-16 bg-slate-50 border-b border-slate-200 scroll-mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                  Live Stock Catalogue
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  High-Quality Certified Medications
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Prescription medicines, OTC drugs, and supplements sourced from licensed distributors.
                </p>
              </div>

              {/* Live Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogueSearch}
                    onChange={(e) => setCatalogueSearch(e.target.value)}
                    placeholder="Search medicine or generic..."
                    className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-60 font-medium"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === "All" ? "All Categories" : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Medicines Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{p.unit}</span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm">{p.name}</h3>
                    {p.genericName && (
                      <p className="text-[11px] text-slate-500 italic">{p.genericName}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Retail Price</span>
                      <span className="text-base font-black text-orange-600">
                        LKR {p.sellPrice.toFixed(2)}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                        p.totalStock > p.lowStockLimit
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.totalStock > 0 ? "In Stock" : "Out of stock"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-500">
                  No medicines match your search criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCatalogueSearch("");
                    setSelectedCategory("All");
                  }}
                  className="mt-2 text-xs font-bold text-orange-600 hover:underline"
                >
                  Clear search filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 
          ========================================================================
          PILLARS OF PHARMACY EXCELLENCE
          ========================================================================
        */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white mx-auto sm:mx-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm">100% Genuine Certified</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct manufacturer sourcing with strict batch verification and NMRA regulatory adherence.
                </p>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto sm:mx-0">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm">Swift Doorstep Delivery</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fast delivery across Tangalle and southern province with temperature-controlled packaging.
                </p>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto sm:mx-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm">Pharmacist Consultations</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct counseling on dosage, interactions, and generic substitutes by registered pharmacists.
                </p>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white mx-auto sm:mx-0">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm">24/7 Service Desk</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Continuous support for emergency prescriptions and clinic refill requests anytime.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 
        ========================================================================
        LIGHTBOX ZOOM MODAL: FULL UNCROPPED PHARMA.JPG POSTER
        Allows customer or staff to inspect the original high-resolution graphic.
        ========================================================================
      */}
      {isPosterZoomOpen && (
        <div
          onClick={() => setIsPosterZoomOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl max-h-[92vh] w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20 p-2 cursor-default"
          >
            <button
              onClick={() => setIsPosterZoomOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-lg"
              title="Close full view"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto max-h-[88vh] rounded-2xl">
              <Image
                src="/Pharma.jpg"
                alt="Borcelle Pharmacy - All Medicines Store Full View"
                width={896}
                height={1200}
                className="w-full h-auto object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        PRESCRIPTION SUBMISSION POPUP MODAL
        ========================================================================
      */}
      {submittedReferenceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Prescription Upload Successful
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Your Order is in the Pharmacist Queue!
              </h3>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 text-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                Prescription Reference ID
              </span>
              <span className="text-2xl font-black font-mono text-orange-600 tracking-wider">
                {submittedReferenceId}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Our registered pharmacist is currently reviewing your document. We will contact you at{" "}
              <span className="font-bold text-slate-900">your provided phone number</span> to confirm your
              bill and delivery time.
            </p>

            <button
              onClick={() => setSubmittedReferenceId(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Done &amp; Return to Store
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-600 flex items-center justify-center text-white font-bold text-xs">
              +
            </div>
            <span className="font-bold text-slate-900">{settings.pharmacyName}</span>
            <span>&copy; {year} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-orange-600 font-semibold transition-colors">
              Staff Workspace Login
            </Link>
            <span>{settings.phone}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

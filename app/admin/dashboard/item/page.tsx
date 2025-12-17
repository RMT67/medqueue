"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Package,
  DollarSign,
  AlertCircle,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { MedicineType } from "@/types/medicineType";
import Swal from "sweetalert2";
import { useAuth } from "@/lib/auth-context";
import { Navigation } from "@/components/navigation";
// import { ScaleIn } from "@/components/animations";
import {
  AdminHeader,
  AdminTabs,
  AdminProtectedRoute,
} from "@/components/adminDashboard";

export default function ItemPage() {
  const { user, logout } = useAuth();
  const [medicines, setMedicines] = useState<MedicineType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineType | null>(
    null
  );
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    description: "",
    stock: 0,
    minStock: 0,
    price: 0,
    currency: "IDR",
    unit: "Tablet",
    packaging: {
      unitPerPack: 10,
      packUnit: "Box",
      packPrice: 0,
    },
    imageUrl: "",
    manufacturer: "",
    expiryDate: "",
    isActive: true,
  });

  useEffect(() => {
    const fetchMedicines = async (searchQuery: string) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/item?search=${searchQuery}`
      );
      if (!res.ok) {
        return Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch medicines",
        });
      }
      const resData = await res.json();
      setMedicines(resData.data);
    };
    fetchMedicines(searchQuery);
  }, [searchQuery]);

  // Handle Add Medicine
  const handleAdd = () => {
    setModalMode("add");
    setFormData({
      code: "",
      name: "",
      category: "",
      description: "",
      stock: 0,
      minStock: 0,
      price: 0,
      currency: "IDR",
      unit: "Tablet",
      packaging: {
        unitPerPack: 10,
        packUnit: "Box",
        packPrice: 0,
      },
      imageUrl: "",
      manufacturer: "",
      expiryDate: "",
      isActive: true,
    });
    setShowModal(true);
  };

  // Handle Edit Medicine
  const handleEdit = (medicine: MedicineType) => {
    setModalMode("edit");
    setSelectedMedicine(medicine);
    setFormData(medicine);
    setShowModal(true);
  };

  // Handle Delete Medicine
  const handleDelete = (id: string) => {
    console.log("🚀 ~ handleDelete ~ id:", id);

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/item/${id}`,
          {
            method: "DELETE",
          }
        );
        if (res.ok) {
          setMedicines(medicines.filter((med) => med._id !== id));
          Swal.fire("Deleted!", "The medicine has been deleted.", "success");
        } else {
          Swal.fire("Error!", "Failed to delete the medicine.", "error");
        }
      }
    });
  };

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === "add") {
      // console.log(formData);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        return Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to add medicine",
        });
      } else {
        const result = await res.json();
        Swal.fire({
          icon: "success",
          title: "Success",
          text: result.message,
        });
        setMedicines([...medicines, result.data]);
      }
    } else {
      // Edit mode - call PUT API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/item/${selectedMedicine?._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        return Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update medicine",
        });
      } else {
        const result = await res.json();
        Swal.fire({
          icon: "success",
          title: "Success",
          text: result.message,
        });
        setMedicines(
          medicines.map((med) =>
            med._id === selectedMedicine?._id ? result.data : med
          )
        );
      }
    }

    setShowModal(false);
    setSelectedMedicine(null);
  };

  return (
    <AdminProtectedRoute>
      <Navigation
        isAuthenticated={!!user}
        userRole={user?.role || "admin"}
        userName={user?.name || "Guest"}
        onLogout={logout}
      />

      <AdminHeader
        title='Medicine <span class="text-primary">Inventory</span>'
        subtitle="Manage your clinic's medicine stock and inventory"
      />

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Background Pattern */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23000000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8 lg:px-8 lg:py-12 space-y-6">
          <AdminTabs />

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Medicine Inventory
              </h1>
              <p className="text-muted-foreground">
                Manage your clinic&apos;s medicine stock and inventory
              </p>
            </div>
            <Button
              onClick={handleAdd}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all font-medium h-12 gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Medicine
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 border-2 shadow-lg bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Items
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {medicines.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 shadow-lg bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Value
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    Rp
                    {medicines
                      .reduce((acc, med) => acc + med.price * med.stock, 0)
                      .toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 shadow-lg bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Low Stock Items
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {medicines.filter((med) => med.stock < med.minStock).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search Bar */}
          <Card className="p-4 border-2 shadow-lg bg-card/80 backdrop-blur-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, category, or manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-2 focus:border-primary"
              />
            </div>
          </Card>

          {/* Medicine Table */}
          <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b-2 border-border sticky top-0">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                      No.
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                      Image
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                      Medicine
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                      Category
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                      Manufacturer
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                      Stock
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                      Price
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                      Expiry
                    </th>
                    <th className="text-right p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-12">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Package className="w-10 h-10 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-bold text-foreground mb-2">
                            No Medicines Found
                          </h3>
                          <p className="text-muted-foreground max-w-md">
                            {searchQuery
                              ? "Try adjusting your search to find medicines."
                              : "No medicines available. Click 'Add New Medicine' to create a new medicine."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    medicines.map((medicine, index) => (
                      <tr
                        key={medicine._id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        {/* col number */}
                        <td className="p-4">
                          <div className="flex justify-center">
                            <span className="font-mono font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-border shadow-sm">
                            {medicine.imageUrl ? (
                              <Image
                                src={medicine.imageUrl}
                                alt={medicine.name}
                                fill
                                className="object-cover"
                                unoptimized
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector(
                                      ".image-fallback"
                                    ) as HTMLElement;
                                    if (fallback)
                                      fallback.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <div className="image-fallback hidden w-full h-full absolute inset-0 items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-xs">
                              {medicine.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-foreground mb-1">
                              {medicine.name}
                            </p>
                            <p className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded inline-block">
                              {medicine.code}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                            {medicine.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-foreground">
                            {medicine.manufacturer}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold text-base ${
                                  medicine.stock < medicine.minStock
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-foreground"
                                }`}
                              >
                                {medicine.stock}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {medicine.unit}
                              </span>
                            </div>
                            {medicine.stock < medicine.minStock && (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                  Low stock! (Min: {medicine.minStock})
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-foreground">
                              Rp {medicine.price.toLocaleString("id-ID")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pack: Rp{" "}
                              {medicine.packaging.packPrice.toLocaleString(
                                "id-ID"
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {new Date(medicine.expiryDate).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(medicine)}
                              className="hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(medicine._id)}
                              className="hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-card rounded-2xl border-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header - Fixed */}
            <div className="bg-linear-to-r from-primary/10 via-accent/5 to-primary/10 border-b-2 border-border p-6 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    {modalMode === "add" ? (
                      <Plus className="w-6 h-6 text-white" />
                    ) : (
                      <Edit2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {modalMode === "add"
                        ? "Add New Medicine"
                        : "Edit Medicine"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {modalMode === "add"
                        ? "Fill in the details to add a new medicine"
                        : "Update the medicine information"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="hover:bg-muted rounded-lg h-10 w-10 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Basic Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Medicine Code <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="e.g., MED-PARA-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Medicine Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="e.g., Paracetamol 500mg"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="e.g., Analgesic, Antibiotic"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Manufacturer <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.manufacturer}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            manufacturer: e.target.value,
                          })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="e.g., PharmaCorp"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="e.g., Tablet, Capsule, Syrup"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Stock & Pricing Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Stock & Pricing
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Minimum Stock <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minStock: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Unit Price (Rp) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        step="1"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Packaging Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Packaging Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Unit Per Pack <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        value={formData.packaging.unitPerPack}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            packaging: {
                              ...formData.packaging,
                              unitPerPack: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="10"
                        min="1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Pack Unit <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.packaging.packUnit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            packaging: {
                              ...formData.packaging,
                              packUnit: e.target.value,
                            },
                          })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Box, Bottle, etc."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Pack Price (Rp) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        step="1"
                        value={formData.packaging.packPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            packaging: {
                              ...formData.packaging,
                              packPrice: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Additional Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiryDate: e.target.value,
                          })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground">
                        Image URL
                      </label>
                      <Input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, imageUrl: e.target.value })
                        }
                        className="h-11 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                      Description
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-24 resize-none"
                      placeholder="Enter a detailed description of the medicine..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="border-t-2 border-border p-6 bg-muted/20 shrink-0">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-12 border-2 font-medium hover:bg-muted transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all font-semibold"
                  >
                    {modalMode === "add" ? (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Add Medicine
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-5 h-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  );
}

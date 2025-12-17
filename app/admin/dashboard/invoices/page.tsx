"use client";

import { useEffect, useState } from "react";
import {
  AdminHeader,
  AdminTabs,
  AdminProtectedRoute,
} from "@/components/adminDashboard";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/lib/auth-context";
import { InvoiceTable } from "./InvoiceTable";
import { Invoice } from "@/types/invoice";

// Type for serialized invoice (ObjectId and Date converted to string)
type SerializedInvoice = Omit<
  Invoice,
  | "_id"
  | "patientId"
  | "doctorId"
  | "bookingId"
  | "medicalRecordId"
  | "date"
  | "dueDate"
  | "paidAt"
  | "createdAt"
  | "updatedAt"
  | "items"
> & {
  _id: string;
  patientId: string;
  doctorId: string;
  bookingId: string;
  medicalRecordId: string;
  date: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    type: "service" | "medicine";
    serviceId?: string;
    medicineId?: string;
    serviceCode?: string;
    medicineCode?: string;
    serviceName?: string;
    medicineName?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    total: number;
    dosage?: string;
  }>;
  patientName?: string;
  doctorName?: string;
};

async function getInvoices(): Promise<SerializedInvoice[]> {
  try {
    const token = localStorage.getItem("medqueue_token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch("/api/admin/invoices", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch invoices");
    }

    const data = await response.json();
    return data.invoices || [];
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
}

export default function InvoicePage() {
  const { user, logout } = useAuth();
  const [invoices, setInvoices] = useState<SerializedInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      if (!user || user.role !== "admin") {
        return;
      }

      try {
        setLoading(true);
        const data = await getInvoices();
        setInvoices(data);
      } catch (error) {
        console.error("Error loading invoices:", error);
        // Set empty array on error to show empty state
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [user]);

  return (
    <AdminProtectedRoute
      loadingComponent={
        loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading invoices...</p>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navigation
          isAuthenticated={true}
          userRole="admin"
          userName={user?.name || "Admin"}
          onLogout={logout}
        />

        <AdminHeader
          title='Invoice <span class="text-primary">Management</span>'
          subtitle="Manage and track all invoices"
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <AdminTabs />
          <InvoiceTable invoices={invoices} />
        </main>
      </div>
    </AdminProtectedRoute>
  );
}

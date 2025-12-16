"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader, AdminTabs } from "@/components/adminDashboard";
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
};

async function getInvoices(): Promise<SerializedInvoice[]> {
  // Dummy data for testing
  const dummyInvoices: SerializedInvoice[] = [
    {
      _id: "1",
      invoiceNumber: "INV-2025-001",
      patientId: "patient123",
      doctorId: "doctor456",
      bookingId: "booking789",
      medicalRecordId: "record001",
      date: new Date("2025-12-15").toISOString(),
      dueDate: new Date("2025-12-30").toISOString(),
      items: [
        {
          type: "service",
          serviceId: "service001",
          serviceCode: "SRV-001",
          serviceName: "General Consultation",
          quantity: 1,
          unitPrice: 150000,
          total: 150000,
        },
        {
          type: "medicine",
          medicineId: "med001",
          medicineCode: "MED-001",
          medicineName: "Paracetamol 500mg",
          quantity: 10,
          unit: "tablet",
          unitPrice: 2000,
          total: 20000,
          dosage: "3x1 daily",
        },
      ],
      subtotal: 170000,
      total: 170000,
      paymentStatus: "pending",
      paymentMethod: null,
      paymentReference: null,
      paidAt: null,
      createdAt: new Date("2025-12-15").toISOString(),
      updatedAt: new Date("2025-12-15").toISOString(),
    },
    {
      _id: "2",
      invoiceNumber: "INV-2025-002",
      patientId: "patient456",
      doctorId: "doctor789",
      bookingId: "booking012",
      medicalRecordId: "record002",
      date: new Date("2025-12-14").toISOString(),
      dueDate: new Date("2025-12-29").toISOString(),
      items: [
        {
          type: "service",
          serviceId: "service002",
          serviceCode: "SRV-002",
          serviceName: "Blood Test",
          quantity: 1,
          unitPrice: 250000,
          total: 250000,
        },
      ],
      subtotal: 250000,
      total: 250000,
      paymentStatus: "paid",
      paymentMethod: "Credit Card",
      paymentReference: "PAY-2025-001",
      paidAt: new Date("2025-12-14T10:30:00").toISOString(),
      createdAt: new Date("2025-12-14").toISOString(),
      updatedAt: new Date("2025-12-14T10:30:00").toISOString(),
    },
    {
      _id: "3",
      invoiceNumber: "INV-2025-003",
      patientId: "patient789",
      doctorId: "doctor123",
      bookingId: "booking345",
      medicalRecordId: "record003",
      date: new Date("2025-12-13").toISOString(),
      dueDate: new Date("2025-12-28").toISOString(),
      items: [
        {
          type: "medicine",
          medicineId: "med002",
          medicineCode: "MED-002",
          medicineName: "Amoxicillin 500mg",
          quantity: 15,
          unit: "capsule",
          unitPrice: 5000,
          total: 75000,
          dosage: "3x1 after meals",
        },
      ],
      subtotal: 75000,
      total: 75000,
      paymentStatus: "cancelled",
      paymentMethod: null,
      paymentReference: null,
      paidAt: null,
      createdAt: new Date("2025-12-13").toISOString(),
      updatedAt: new Date("2025-12-13T15:20:00").toISOString(),
    },
  ];

  return dummyInvoices;
}

export default function InvoicePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [invoices, setInvoices] = useState<SerializedInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      const data = await getInvoices();
      setInvoices(data);
      setLoading(false);
    };

    if (user && user.role === "admin") {
      loadInvoices();
    }
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="admin"
        userName={user.name}
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
  );
}

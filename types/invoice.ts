import { ObjectId } from "mongodb";

// Service item interface
export interface ServiceItem {
  type: "service";
  serviceId: ObjectId;
  serviceCode: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Medicine item interface
export interface MedicineItem {
  type: "medicine";
  medicineId: ObjectId;
  medicineCode: string;
  medicineName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  dosage: string;
}

// Discriminated union for invoice items
export type InvoiceItem = ServiceItem | MedicineItem;

// Payment status literal type
export type PaymentStatus = "pending" | "paid" | "cancelled";

// Main Invoice interface
export interface Invoice {
  _id: ObjectId;
  invoiceNumber: string;
  bookingId: ObjectId;
  medicalRecordId: ObjectId;
  patientId: ObjectId;
  doctorId: ObjectId;
  date: Date | string;
  dueDate: Date | string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  paymentReference: string | null;
  paidAt?: Date | string | null;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  status?: "pending" | "paid" | "cancelled";
}

// Helper type for creating new invoices (without _id, createdAt, updatedAt)
export type InvoiceCreateInput = Omit<
  Invoice,
  "_id" | "createdAt" | "updatedAt"
>;

// Helper type for updating invoices (all fields optional except _id)
export type InvoiceUpdateInput = Partial<Omit<Invoice, "_id">> & {
  _id: ObjectId;
};

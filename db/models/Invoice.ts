import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

export interface InvoiceItem {
  type: "consultation" | "medicine" | "service";
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id?: ObjectId;
  invoiceNumber: string;
  patientId: ObjectId;
  doctorId: string;
  bookingId: ObjectId;
  medicalRecordId: ObjectId;
  date: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  status: "pending" | "paid" | "cancelled";
  paymentMethod?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default class InvoiceModel {
  static async collection() {
    const db = await getDb();
    return db.collection("invoices");
  }

  static async create(invoiceData: Omit<Invoice, "_id" | "createdAt" | "updatedAt">) {
    const collection = await this.collection();
    const invoice = {
      ...invoiceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(invoice);
    return {
      ...invoice,
      _id: result.insertedId,
    };
  }

  static async getById(invoiceId: string) {
    const collection = await this.collection();
    return collection.findOne({ _id: new ObjectId(invoiceId) });
  }

  static async getByMedicalRecordId(medicalRecordId: string) {
    const collection = await this.collection();
    return collection.findOne({ medicalRecordId: new ObjectId(medicalRecordId) });
  }

  static async getByPatientId(patientId: string, status?: string) {
    const collection = await this.collection();
    const query: any = { patientId: new ObjectId(patientId) };
    if (status) {
      query.status = status;
    }
    return collection.find(query).sort({ createdAt: -1 }).toArray();
  }

  static async update(invoiceId: string, updateData: Partial<Invoice>) {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: new ObjectId(invoiceId) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    return await this.getById(invoiceId);
  }
}


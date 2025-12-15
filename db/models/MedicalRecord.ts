import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

export interface Prescription {
  medicineId?: string;
  medicineName: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface MedicalRecord {
  _id?: ObjectId;
  patientId: ObjectId;
  doctorId: string;
  bookingId: ObjectId;
  diagnosis: string;
  prescriptions: Prescription[];
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default class MedicalRecordModel {
  static async collection() {
    const db = await getDb();
    return db.collection("medicalrecords");
  }

  static async create(medicalRecordData: Omit<MedicalRecord, "_id" | "createdAt" | "updatedAt">) {
    const collection = await this.collection();
    const medicalRecord = {
      ...medicalRecordData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(medicalRecord);
    return {
      ...medicalRecord,
      _id: result.insertedId,
    };
  }

  static async getById(recordId: string) {
    const collection = await this.collection();
    return collection.findOne({ _id: new ObjectId(recordId) });
  }

  static async getByBookingId(bookingId: string) {
    const collection = await this.collection();
    return collection.findOne({ bookingId: new ObjectId(bookingId) });
  }

  static async getByPatientId(patientId: string, filter?: { type?: string; search?: string }) {
    const collection = await this.collection();
    const query: any = { patientId: new ObjectId(patientId) };
    
    // Filter by search (doctor name, diagnosis)
    if (filter?.search) {
      query.$or = [
        { diagnosis: { $regex: filter.search, $options: "i" } },
        { notes: { $regex: filter.search, $options: "i" } }
      ];
    }
    
    return collection.find(query).sort({ createdAt: -1 }).toArray();
  }

  static async update(recordId: string, updateData: Partial<MedicalRecord>) {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: new ObjectId(recordId) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    return await this.getById(recordId);
  }
}


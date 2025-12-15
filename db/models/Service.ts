import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

export interface Service {
  _id?: ObjectId;
  code: string;
  name: string;
  category: "Consultation" | "Check-up" | "Emergency" | "Follow-up" | "Lab Test" | "X-Ray";
  description: string;
  price: number;
  currency: string;
  duration: number; // in minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default class ServiceModel {
  static async collection() {
    const db = await getDb();
    return db.collection("services");
  }

  static async getAll(filter?: { category?: string; isActive?: boolean }) {
    const collection = await this.collection();
    const query: any = {};
    
    if (filter?.category) {
      query.category = filter.category;
    }
    
    if (filter?.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    
    return collection.find(query).sort({ name: 1 }).toArray();
  }

  static async getById(serviceId: string) {
    const collection = await this.collection();
    return collection.findOne({ _id: new ObjectId(serviceId) });
  }

  static async getByCode(code: string) {
    const collection = await this.collection();
    return collection.findOne({ code: code });
  }

  static async create(serviceData: Omit<Service, "_id" | "createdAt" | "updatedAt">) {
    const collection = await this.collection();
    const service = {
      ...serviceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(service);
    return {
      ...service,
      _id: result.insertedId,
    };
  }

  static async update(serviceId: string, updateData: Partial<Service>) {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: new ObjectId(serviceId) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    return await this.getById(serviceId);
  }

  static async delete(serviceId: string) {
    const collection = await this.collection();
    const result = await collection.deleteOne({ _id: new ObjectId(serviceId) });
    return result.deletedCount > 0;
  }
}


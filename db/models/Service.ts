import { ObjectId, Document } from "mongodb";
import { getDb } from "../config/mongodb";
import { Service } from "@/types/serviceTypes";

export default class ServiceModel {
  static async collection() {
    const db = await getDb();
    return db.collection("services");
  }

  static async getAllServices(): Promise<Service[]> {
    const collection = await this.collection();
    return collection.find({}).toArray() as unknown as Promise<Service[]>;
  }

  static async getActiveServices(): Promise<Service[]> {
    const collection = await this.collection();
    return collection.find({ isActive: true }).toArray() as unknown as Promise<
      Service[]
    >;
  }

  static async getServiceById(serviceId: string): Promise<Service | null> {
    const collection = await this.collection();
    return collection.findOne({
      _id: new ObjectId(serviceId),
    }) as Promise<Service | null>;
  }

  static async getServiceByCode(code: string): Promise<Service | null> {
    const collection = await this.collection();
    return collection.findOne({ code }) as Promise<Service | null>;
  }

  static async getServicesByCategory(category: string): Promise<Service[]> {
    const collection = await this.collection();
    return collection
      .find({ category, isActive: true })
      .toArray() as unknown as Promise<Service[]>;
  }

  static async create(
    serviceData: Omit<Service, "_id" | "createdAt" | "updatedAt">
  ) {
    const newService = {
      ...serviceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const collection = await this.collection();
      const result = await collection.insertOne(newService as Document);
      return { ...newService, _id: result.insertedId.toString() };
    } catch (err) {
      throw err;
    }
  }

  static async update(serviceId: string, updateData: Partial<Service>) {
    const updatePayload = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    try {
      const collection = await this.collection();
      await collection.updateOne(
        { _id: new ObjectId(serviceId) },
        { $set: updatePayload }
      );
      return await this.getServiceById(serviceId);
    } catch (err) {
      throw err;
    }
  }

  static async delete(serviceId: string) {
    try {
      const collection = await this.collection();
      await collection.deleteOne({ _id: new ObjectId(serviceId) });
      return true;
    } catch (err) {
      throw err;
    }
  }

  static async toggleActive(serviceId: string, isActive: boolean) {
    try {
      const collection = await this.collection();
      await collection.updateOne(
        { _id: new ObjectId(serviceId) },
        {
          $set: {
            isActive,
            updatedAt: new Date().toISOString(),
          },
        }
      );
      return await this.getServiceById(serviceId);
    } catch (err) {
      throw err;
    }
  }
}

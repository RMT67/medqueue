import { ObjectId } from "mongodb";
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
    return collection.find({ category }).toArray() as unknown as Promise<
      Service[]
    >;
  }

  static async create(serviceData: Partial<Service>) {
    const collection = await this.collection();
    const newService = {
      ...serviceData,
      isActive: serviceData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(
      newService as Omit<Service, "_id">
    );
    return { ...newService, _id: result.insertedId.toString() };
  }

  static async update(serviceId: string, serviceData: Partial<Service>) {
    const collection = await this.collection();
    const updateData = {
      ...serviceData,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(serviceId) },
      { $set: updateData }
    );

    return this.getServiceById(serviceId);
  }

  static async delete(serviceId: string) {
    const collection = await this.collection();
    return collection.deleteOne({ _id: new ObjectId(serviceId) });
  }

  static async deactivate(serviceId: string) {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: new ObjectId(serviceId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    return this.getServiceById(serviceId);
  }

  static async activate(serviceId: string) {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: new ObjectId(serviceId) },
      { $set: { isActive: true, updatedAt: new Date() } }
    );

    return this.getServiceById(serviceId);
  }
}

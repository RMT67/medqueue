import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

import { Doctor } from "@/types/docterTypes";

export default class DoctorModel {
  static async collection() {
    const db = await getDb();
    return db.collection("doctors");
  }
  static async getAllDoctors(): Promise<Doctor[]> {
    const collection = await this.collection();
    return collection.find({}).toArray() as Promise<Doctor[]>;
  }
  static async getDoctorById(doctorId: string): Promise<Doctor | null> {
    const collection = await this.collection();
    return collection.findOne({
      _id: new ObjectId(doctorId),
    }) as Promise<Doctor | null>;
  }
  static async create(doctorData: Doctor) {
    doctorData = {
      ...doctorData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      const collection = await this.collection();
      await collection.insertOne(doctorData);
      return doctorData;
    } catch (err) {
      throw err;
    }
  }
  static async update(doctorId: string, updateData: Partial<Doctor>) {
    updateData = {
      ...updateData,
      updatedAt: new Date(),
    };
    try {
      const collection = await this.collection();
      await collection.updateOne(
        { _id: new ObjectId(doctorId) },
        { $set: updateData }
      );
      return await this.getDoctorById(doctorId);
    } catch (err) {
      throw err;
    }
  }
  static async delete(doctorId: string) {
    try {
      const collection = await this.collection();
      await collection.deleteOne({ _id: new ObjectId(doctorId) });
      return true;
    } catch (err) {
      throw err;
    }
  }
}

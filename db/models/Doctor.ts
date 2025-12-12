import { ObjectId } from "mongodb";
import { db } from "../config/mongodb";

import { Doctor } from "@/types/docterTypes";

export default class DoctorModel {
  static collection() {
    return db.collection("doctors");
  }
  static async getAllDoctors(): Promise<Doctor[]> {
    return this.collection().find({}).toArray() as Promise<Doctor[]>;
  }
  static async getDoctorById(doctorId: string): Promise<Doctor | null> {
    return this.collection().findOne({
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
      await this.collection().insertOne(doctorData);
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
      await this.collection().updateOne(
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
      await this.collection().deleteOne({ _id: new ObjectId(doctorId) });
      return true;
    } catch (err) {
      throw err;
    }
  }
}

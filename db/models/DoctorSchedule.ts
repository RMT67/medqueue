import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

export interface DoctorSchedule {
  _id?: ObjectId;
  doctorId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  timeRange: string; // "09:00 - 17:00"
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default class DoctorScheduleModel {
  static async collection() {
    const db = await getDb();
    return db.collection("doctorschedules");
  }

  static async create(scheduleData: Omit<DoctorSchedule, "_id" | "createdAt" | "updatedAt">) {
    const collection = await this.collection();
    const schedule = {
      ...scheduleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(schedule);
    return {
      ...schedule,
      _id: result.insertedId,
    };
  }

  static async getById(scheduleId: string) {
    const collection = await this.collection();
    return collection.findOne({ _id: new ObjectId(scheduleId) });
  }

  static async getByDoctorId(doctorId: string) {
    const collection = await this.collection();
    return collection.find({ 
      doctorId: doctorId,
      isActive: true 
    }).sort({ dayOfWeek: 1 }).toArray();
  }

  static async getDefaultSchedule(doctorId: string) {
    const collection = await this.collection();
    return collection.findOne({ 
      doctorId: doctorId,
      isDefault: true,
      isActive: true 
    });
  }

  static async update(scheduleId: string, updateData: Partial<DoctorSchedule>) {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: new ObjectId(scheduleId) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    return await this.getById(scheduleId);
  }
}


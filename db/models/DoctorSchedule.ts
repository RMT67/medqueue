import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import { DoctorWithSchedule } from "@/types/scheduleTypes";

export interface DayOfWeek {
  hari: string; // "Senin", "Selasa", "Minggu", etc.
  availabel: boolean; // Note: typo in database, keeping as is for compatibility
  startTime: string; // "09:00"
  endTime: string; // "12:00"
}

export interface DoctorSchedule {
  _id?: ObjectId;
  doctorId: ObjectId | string; // Can be ObjectId or string
  dayOfWeek: DayOfWeek[]; // Array of day objects
  timeRange: string; // "09:00 - 12:00"
  isAvailable: boolean; // Overall availability status
  firstCallTime?: Date | null; // First call time for the day
  isOnTime: boolean; // Whether schedule is on time
  delayMinutes: number; // Delay in minutes
  maxPatients: number; // Maximum patients for this schedule
  createdAt: Date;
  updatedAt: Date;
  // Legacy fields (for backward compatibility)
  isDefault?: boolean; // Optional: for backward compatibility
  isActive?: boolean; // Optional: for backward compatibility
}

export default class DoctorScheduleModel {
  static async collection() {
    const db = await getDb();
    return db.collection("doctorSchedules");
  }

  static async create(
    scheduleData: Omit<DoctorSchedule, "_id" | "createdAt" | "updatedAt">
  ) {
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

  static async getScheduleByDoctorId(doctorId: string) {
    const collection = await this.collection();
    const scheduleByDoctor = collection.findOne({
      doctorId: new ObjectId(doctorId),
    });
    return scheduleByDoctor;
  }

  static async getByDoctorId(doctorId: string) {
    const collection = await this.collection();
    // Support both ObjectId and string doctorId
    const query: any = {
      $or: [{ doctorId: new ObjectId(doctorId) }, { doctorId: doctorId }],
      isAvailable: true,
    };
    const schedule = collection.find(query).sort({ createdAt: 1 }).toArray();
    return schedule;
  }

  static async getDefaultSchedule(doctorId: string) {
    const collection = await this.collection();
    // Support both ObjectId and string doctorId
    const query: any = {
      $or: [{ doctorId: new ObjectId(doctorId) }, { doctorId: doctorId }],
      isAvailable: true,
    };
    // If isDefault exists, use it; otherwise get first available schedule
    const defaultSchedule = await collection.findOne({
      ...query,
      isDefault: true,
    });
    if (defaultSchedule) return defaultSchedule;
    // Fallback: get first available schedule
    return collection.findOne(query);
  }

  static async getByDayOfWeek(doctorId: string, hari: string) {
    const collection = await this.collection();
    const query: any = {
      $or: [{ doctorId: new ObjectId(doctorId) }, { doctorId: doctorId }],
      isAvailable: true,
      "dayOfWeek.hari": hari,
      "dayOfWeek.availabel": true,
    };
    return collection.findOne(query);
  }

  static async update(scheduleId: string, updateData: Partial<DoctorSchedule>) {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: new ObjectId(scheduleId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );
    return await this.getById(scheduleId);
  }
}

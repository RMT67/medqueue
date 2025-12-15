import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import { DoctorSchedule, DoctorWithSchedule } from "@/types/scheduleTypes";

export default class DoctorScheduleModel {
  static async collection() {
    const db = await getDb();
    return db.collection("doctorSchedules");
  }

  static async getAllSchedules(): Promise<DoctorSchedule[]> {
    const collection = await this.collection();
    return collection.find({}).toArray() as unknown as Promise<
      DoctorSchedule[]
    >;
  }

  static async getScheduleByDoctorId(
    doctorId: string
  ): Promise<DoctorSchedule | null> {
    const collection = await this.collection();
    return collection.findOne({
      doctorId: new ObjectId(doctorId),
    }) as Promise<DoctorSchedule | null>;
  }

  static async getSchedulesWithDoctorInfo(): Promise<DoctorWithSchedule[]> {
    const db = await getDb();
    const doctorsCollection = db.collection("doctors");

    const result = await doctorsCollection
      .aggregate([
        {
          $lookup: {
            from: "doctorSchedules",
            localField: "_id",
            foreignField: "doctorId",
            as: "schedules",
          },
        },
        {
          $unwind: {
            path: "$schedules",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            _id: "$schedules._id",
            doctorId: "$_id",
            dayOfWeek: "$schedules.dayOfWeek",
            timeRange: "$schedules.timeRange",
            isAvailable: "$schedules.isAvailable",
            firstCallTime: "$schedules.firstCallTime",
            isOnTime: "$schedules.isOnTime",
            delayMinutes: "$schedules.delayMinutes",
            maxPatients: "$schedules.maxPatients",
            doctorInfo: {
              name: "$name",
              specialization: "$specialization",
              clinic: "$clinic",
              image: "$image",
            },
          },
        },
      ])
      .toArray();

    return result as DoctorWithSchedule[];
  }

  static async create(scheduleData: Partial<DoctorSchedule>) {
    const collection = await this.collection();
    const newSchedule = {
      ...scheduleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(
      newSchedule as Omit<DoctorSchedule, "_id">
    );
    return { ...newSchedule, _id: result.insertedId.toString() };
  }

  static async update(
    scheduleId: string,
    scheduleData: Partial<DoctorSchedule>
  ) {
    const collection = await this.collection();
    const updateData = {
      ...scheduleData,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(scheduleId) },
      { $set: updateData }
    );

    return { _id: scheduleId, ...updateData };
  }

  static async delete(scheduleId: string) {
    const collection = await this.collection();
    return collection.deleteOne({ _id: new ObjectId(scheduleId) });
  }
}

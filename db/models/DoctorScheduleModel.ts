import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import { DoctorSchedule } from "@/types/scheduleTypes";

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

  static async getSchedulesWithDoctorInfo() {
    const db = await getDb();
    const collection = db.collection("doctorSchedules");

    return collection
      .aggregate([
        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctorInfo",
          },
        },
        {
          $unwind: "$doctorInfo",
        },
        {
          $project: {
            _id: 1,
            doctorId: 1,
            dayOfWeek: 1,
            timeRange: 1,
            isAvailable: 1,
            firstCallTime: 1,
            isOnTime: 1,
            delayMinutes: 1,
            maxPatients: 1,
            "doctorInfo.name": 1,
            "doctorInfo.specialization": 1,
            "doctorInfo.clinic": 1,
            "doctorInfo.image": 1,
          },
        },
      ])
      .toArray();
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

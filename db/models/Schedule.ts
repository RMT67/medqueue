import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

export default class ScheduleModel {
  static async collection() {
    const db = await getDb();
    return db.collection("doctorschedules");
  }

  static async getByDoctorId(doctorId: string) {
    const collection = await this.collection();
    const schedules = await collection.findOne({
      doctorId: new ObjectId(doctorId),
    });
    return schedules;
  }
}

import { ObjectId } from "mongodb";
import { db } from "../config/mongodb";
import { MedicineFormType } from "@/types/medicineType";

export default class MedicineModel {
  static collection() {
    return db.collection("medicines");
  }

  static async getAll(search: string) {
    if (search) {
      const regex = new RegExp(search, "i");
      return await this.collection()
        .find({
          $or: [
            { code: { $regex: regex } },
            { name: { $regex: regex } },
            { category: { $regex: regex } },
            { manufacturer: { $regex: regex } },
          ],
        })
        .toArray();
    }
    return await this.collection().find().toArray();
  }

  static async create(medicineData: MedicineFormType) {
    const result = await this.collection().insertOne(medicineData);
    const insertedId = result.insertedId;
    const insertedMedicine = await this.collection().findOne({
      _id: insertedId,
    });
    return insertedMedicine;
  }

  static async getById(id: string) {
    return await this.collection().findOne({ _id: new ObjectId(id) });
  }

  static async update(id: string, medicineData: Partial<MedicineFormType>) {
    const result = await this.collection().updateOne(
      { _id: new ObjectId(id) },
      { $set: medicineData }
    );
    if (result.modifiedCount === 0) {
      return null;
    }
    return await this.getById(id);
  }

  static async delete(id: string) {
    const result = await this.collection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

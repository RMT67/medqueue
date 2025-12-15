import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import { MedicineFormType } from "@/types/medicineType";

export default class MedicineModel {
  static async collection() {
    const db = await getDb();
    return db.collection("medicines");
  }

  static async getAll(search?: string) {
    const collection = await this.collection();
    if (search) {
      const regex = new RegExp(search, "i");
      return collection
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
    return collection.find().toArray();
  }

  static async create(medicineData: MedicineFormType) {
    const collection = await this.collection();
    const medicine = {
      ...medicineData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(medicine);
    return {
      ...medicine,
      _id: result.insertedId,
    };
  }

  static async getById(id: string) {
    const collection = await this.collection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  static async update(id: string, medicineData: Partial<MedicineFormType>) {
    const collection = await this.collection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...medicineData,
          updatedAt: new Date()
        }
      }
    );
    if (result.modifiedCount === 0) {
      return null;
    }
    return await this.getById(id);
  }

  static async delete(id: string) {
    const collection = await this.collection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

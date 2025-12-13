import { db } from "../config/mongodb";

interface MedicineFormType {
  name: string;
  category: string;
  description: string;
  stock: number;
  minStock: number;
  price: number;
  unit: string;
  imageUrl: string;
  manufacturer: string;
  expiryDate: string;
}

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
}

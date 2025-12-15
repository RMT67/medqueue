import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

export interface Review {
  _id?: ObjectId;
  bookingId: ObjectId;
  patientId: ObjectId;
  doctorId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default class ReviewModel {
  static async collection() {
    const db = await getDb();
    return db.collection("reviews");
  }

  static async create(reviewData: Omit<Review, "_id" | "createdAt" | "updatedAt">) {
    const collection = await this.collection();
    const review = {
      ...reviewData,
      patientId: new ObjectId(reviewData.patientId),
      bookingId: new ObjectId(reviewData.bookingId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(review);
    return {
      ...review,
      _id: result.insertedId,
    };
  }

  static async getById(reviewId: string) {
    const collection = await this.collection();
    return collection.findOne({ _id: new ObjectId(reviewId) });
  }

  static async getByBookingId(bookingId: string) {
    const collection = await this.collection();
    return collection.findOne({ bookingId: new ObjectId(bookingId) });
  }

  static async getByDoctorId(doctorId: string, limit?: number) {
    const collection = await this.collection();
    const query = { doctorId: doctorId };
    const cursor = collection.find(query).sort({ createdAt: -1 });
    if (limit) {
      cursor.limit(limit);
    }
    return cursor.toArray();
  }

  static async getByPatientId(patientId: string) {
    const collection = await this.collection();
    return collection.find({ patientId: new ObjectId(patientId) }).sort({ createdAt: -1 }).toArray();
  }

  static async update(reviewId: string, updateData: Partial<Review>) {
    const collection = await this.collection();
    await collection.updateOne(
      { _id: new ObjectId(reviewId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    return await this.getById(reviewId);
  }

  static async delete(reviewId: string) {
    const collection = await this.collection();
    const result = await collection.deleteOne({ _id: new ObjectId(reviewId) });
    return result.deletedCount > 0;
  }
}


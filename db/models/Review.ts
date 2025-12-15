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

  static async getByBookingId(bookingId: string) {
    const collection = await this.collection();
    return collection.findOne({ bookingId: new ObjectId(bookingId) });
  }
}


import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

import { BookingType } from "@/types/bookingType";

export default class BookingModel {
  static async collection() {
    const db = await getDb();
    return db.collection("bookings");
  }

  static async create(bookingData: BookingType) {
    // get last booking number
    const collection = await this.collection();
    const lastBooking = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    const year = new Date().getFullYear().toString().slice(-2);
    let bookingNumber;
    if (lastBooking.length === 0) {
      bookingNumber = `MQ-${year}-0001`;
    } else {
      const lastNumber = parseInt(
        lastBooking[0].bookingNumber!.split("-")[2],
        10
      );
      const newNumber = lastNumber + 1;
      bookingNumber = `MQ-${year}-${newNumber.toString().padStart(4, "0")}`;
    }

    // convert patientId & doctorId to ObjectId
    bookingData.patientId = new ObjectId(bookingData.patientId);
    // bookingData.doctorId = new ObjectId(bookingData.doctorId); // uncomment if doctorId is ObjectId

    bookingData = {
      ...bookingData,
      bookingNumber,
      queueId: "1", // placeholder, ganti dengan logika ambil queueId terbaru
      cancelReason: bookingData.cancelReason || "",
      notes: bookingData.notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "confirmed",
    };
    try {
      const collection = await this.collection();
      await collection.insertOne(bookingData);
      return bookingData;
    } catch (err) {
      throw err;
    }
  }
}

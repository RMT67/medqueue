import { db } from "../config/mongodb";

interface BookingBody {
  patientId: string;
  doctorId: string;
  scheduledDate: Date;
  timeRange: string;
  complaint: string;
  cancelReason?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  queueId?: string;
}

export default class BookingModel {
  static collection() {
    return db.collection("bookings");
  }

  static async create(bookingData: BookingBody) {
    // status: "pending" | "confirmed" | "cancelled" | "completed"; default "pending"

    bookingData = {
      ...bookingData,
      queueId: "0", // placeholder, ganti dengan logika ambil queueId terbaru
      cancelReason: bookingData.cancelReason || "",
      notes: bookingData.notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
    };
    const result = await this.collection().insertOne(bookingData);
  }
}

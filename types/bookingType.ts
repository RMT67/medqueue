import { ObjectId } from "mongodb";

export interface BookingType {
  _id?: ObjectId;
  patientId: string | ObjectId;
  doctorId: string;
  scheduleDate: Date;
  timeRange: string;
  complaint: string;
  cancelReason?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  queueId?: string;
  bookingNumber?: string;
}

export interface BookingDisplayType {
  bookingNumber?: string;
  queueNumber?: string;
  message?: string;
}

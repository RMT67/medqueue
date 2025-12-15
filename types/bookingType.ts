import { ObjectId } from "mongodb";

export interface BookingType {
  _id?: ObjectId;
  patientId: string | ObjectId;
  doctorId: string | ObjectId;
  scheduleId?: string | ObjectId;
  scheduleDate: Date;
  appointmentTime?: Date;
  complaint: string;
  cancelReason?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  bookingNumber?: string;
  queueNumber?: string;
}

export interface BookingDisplayType {
  bookingNumber?: string;
  queueNumber?: string;
  message?: string;
}

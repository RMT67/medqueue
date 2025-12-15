import { ObjectId } from "mongodb";

export interface DoctorScheduleType {
  _id: string | ObjectId;
  doctorId: string | ObjectId;
  date: string;
  timeRange: string;
  isAvailable: boolean;
  firstCallTime: string | null;
  isOnTime: boolean;
  delayMinutes: number;
  maxPatients: number;
  currentPatients: number;
}

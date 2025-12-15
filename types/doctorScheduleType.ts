import { ObjectId } from "mongodb";

interface DayOfWeek {
  hari: string;
  available: boolean;
  startTime: string;
  endTime: string;
}

export interface DoctorScheduleType {
  _id: string | ObjectId;
  doctorId: string | ObjectId;
  dayOfWeek: DayOfWeek[];
  isAvailable: boolean;
  firstCallTime: string | null;
  isOnTime: boolean;
  delayMinutes: number;
  maxPatients: number;
}

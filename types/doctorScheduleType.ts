import { ObjectId } from "mongodb";

interface DayOfWeek {
  hari: string;
  availabel: boolean;
  startTime: string;
  endTime: string;
}

export interface DoctorScheduleType {
  _id: string | ObjectId;
  doctorId: string | ObjectId;
  dayOfWeek: DayOfWeek[];
  timeRange: string;
  isAvailable: boolean;
  firstCallTime: string | null;
  isOnTime: boolean;
  delayMinutes: number;
  maxPatients: number;
}

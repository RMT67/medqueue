import { ObjectId } from "mongodb";

export type DoctorAdmin = {
  _id: ObjectId;
  name: string;
  specialization: string;
  clinic: string;
  status: string;
  todayPatients: number;
  currentQueue: number;
  currentlyServing: string | null;
  avgWaitTime: number;
  completedToday: number;
  image: string;
  timeStatus: "onTime" | number;
};

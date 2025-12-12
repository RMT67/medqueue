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

export type Doctor = {
  _id: ObjectId;
  userId: string;
  name: string;
  specialization: string;
  clinic: string;
  image: string;
  consultationFee: number;
  averageRating: number;
  totalReviews: number;
  isActive: true;
  defaultSchedule: string;
  createdAt: Date;
  updatedAt: Date;
};

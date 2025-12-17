export type DaySchedule = {
  hari: string;
  available: boolean;
  startTime: string;
  endTime: string;
};

export type DoctorSchedule = {
  _id: string;
  doctorId: string;
  dayOfWeek: DaySchedule[];
  timeRange: string;
  isAvailable: boolean;
  firstCallTime: string | null;
  isOnTime: boolean;
  delayMinutes: number;
  maxPatients: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type DoctorWithSchedule = {
  _id: string;
  doctorId: string;
  dayOfWeek: DaySchedule[];
  timeRange: string;
  isAvailable: boolean;
  maxPatients: number;
  isOnTime: boolean;
  delayMinutes: number;
  doctorInfo: {
    name: string;
    specialization: string;
    clinic: string;
    image: string;
  };
};

import { NextResponse } from "next/server";
import DoctorScheduleModel from "@/db/models/DoctorScheduleModel";
import DoctorModel from "@/db/models/Doctor";
import { DoctorWithSchedule } from "@/types/scheduleTypes";
import { DoctorAdmin, Doctor } from "@/types/docterTypes";

interface OverviewStats {
  totalPatients: number;
  avgWaitTime: string;
  activeDoctors: number;
  completedVisits: number;
}

interface OverviewResponse {
  stats: OverviewStats;
  doctors: DoctorAdmin[];
  schedules: DoctorWithSchedule[];
}

function getTodayDayName(): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const today = new Date();
  return days[today.getDay()];
}

// Convert Doctor to DoctorAdmin format
function convertToDoctorAdmin(doctor: Doctor): DoctorAdmin {
  return {
    _id: doctor._id,
    name: doctor.name,
    specialization: doctor.specialization,
    clinic: doctor.clinic,
    status: doctor.isActive ? "Available" : "Offline",
    todayPatients: 0, // Will be calculated from bookings
    currentQueue: 0, // Will be calculated from bookings
    currentlyServing: null,
    avgWaitTime: doctor.averageTimePerPatient || 15, // Default 15 mins
    completedToday: 0, // Will be calculated from bookings
    image: doctor.image,
    timeStatus: "onTime",
  };
}

export async function GET() {
  try {
    // Get today's day name in Indonesian
    const todayDay = getTodayDayName();

    // Fetch all schedules with doctor info
    const allSchedules = await DoctorScheduleModel.getSchedulesWithDoctorInfo();

    // Filter schedules for today
    const todaySchedules = allSchedules.filter(
      (schedule: DoctorWithSchedule) => {
        return schedule.dayOfWeek.some(
          (day) => day.hari === todayDay && day.availabel
        );
      }
    );

    // Get doctor IDs who have schedules today
    const doctorIdsWithScheduleToday = todaySchedules.map(
      (schedule: DoctorWithSchedule) => schedule.doctorId.toString()
    );

    // Fetch all doctors
    const allDoctors = await DoctorModel.getAllDoctors();

    // Filter doctors who have schedules today
    const doctorsWithScheduleToday = allDoctors.filter((doctor) =>
      doctorIdsWithScheduleToday.includes(doctor._id.toString())
    );

    // Convert to DoctorAdmin format
    const doctorAdmins: DoctorAdmin[] =
      doctorsWithScheduleToday.map(convertToDoctorAdmin);

    // Calculate stats from doctors with schedules
    const totalPatients = doctorAdmins.reduce(
      (sum: number, doctor) => sum + (doctor.todayPatients || 0),
      0
    );

    const completedVisits = doctorAdmins.reduce(
      (sum: number, doctor) => sum + (doctor.completedToday || 0),
      0
    );

    const avgWait =
      doctorAdmins.length > 0
        ? Math.round(
            doctorAdmins.reduce(
              (sum: number, doctor) => sum + (doctor.avgWaitTime || 0),
              0
            ) / doctorAdmins.length
          )
        : 0;

    const stats: OverviewStats = {
      totalPatients,
      avgWaitTime: `${avgWait} min`,
      activeDoctors: doctorAdmins.length,
      completedVisits,
    };

    const response: OverviewResponse = {
      stats,
      doctors: doctorAdmins,
      schedules: todaySchedules,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching overview data:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview data" },
      { status: 500 }
    );
  }
}

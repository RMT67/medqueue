import { NextResponse } from "next/server";
import DoctorScheduleModel from "@/db/models/DoctorScheduleModel";
import DoctorModel from "@/db/models/Doctor";
import BookingModel from "@/db/models/Booking";
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

// Convert Doctor to DoctorAdmin format with booking stats
function convertToDoctorAdmin(
  doctor: Doctor,
  bookingStats: {
    todayPatients: number;
    completedToday: number;
    currentQueue: number;
  }
): DoctorAdmin {
  return {
    _id: doctor._id,
    name: doctor.name,
    specialization: doctor.specialization,
    clinic: doctor.clinic,
    status: doctor.isActive ? "Available" : "Offline",
    todayPatients: bookingStats.todayPatients,
    currentQueue: bookingStats.currentQueue,
    currentlyServing: null,
    avgWaitTime: doctor.averageTimePerPatient || 15, // Default 15 mins
    completedToday: bookingStats.completedToday,
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

    // Get today's date range (start and end of day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch all bookings for today
    const bookingCollection = await BookingModel.collection();
    const todayBookings = await bookingCollection
      .find({
        scheduleDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      })
      .toArray();

    // Calculate booking stats for each doctor
    const doctorAdmins: DoctorAdmin[] = doctorsWithScheduleToday.map(
      (doctor) => {
        const doctorId = doctor._id.toString();

        // Filter bookings for this doctor
        const doctorBookings = todayBookings.filter(
          (booking) => booking.doctorId.toString() === doctorId
        );

        // Calculate stats
        const todayPatients = doctorBookings.filter(
          (b) => b.status !== "cancelled"
        ).length;

        const completedToday = doctorBookings.filter(
          (b) => b.status === "completed"
        ).length;

        const currentQueue = doctorBookings.filter(
          (b) => b.status === "confirmed" || b.status === "pending"
        ).length;

        return convertToDoctorAdmin(doctor, {
          todayPatients,
          completedToday,
          currentQueue,
        });
      }
    );

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

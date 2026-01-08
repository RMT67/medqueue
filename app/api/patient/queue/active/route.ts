import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import BookingModel from "@/db/models/Booking";
import DoctorModel from "@/db/models/Doctor";
import DoctorScheduleModel from "@/db/models/DoctorSchedule";
import { calculateEstimatedCallTime } from "@/lib/queue-utils";
import {
  emitQueuePositionUpdate,
  emitCallTimeUpdate,
  emitQueueStatusChange,
} from "@/lib/socket-server";

export async function GET(req: Request) {
  try {
    // ✅ 1. Authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = verifyToken(authHeader);
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Forbidden - Patient access only" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const patientObjectId = new ObjectId(userId);
    const bookingsCollection = db.collection("bookings");

    // ✅ 2. Get active booking (confirmed or in-progress)
    const activeBooking = await bookingsCollection.findOne(
      {
        patientId: patientObjectId,
        status: { $in: ["confirmed", "in-progress"] },
      },
      {
        sort: { appointmentTime: 1 }, // Get earliest appointment
      }
    );

    if (!activeBooking) {
      return NextResponse.json(
        { error: "No active queue found" },
        { status: 404 }
      );
    }

    // ✅ 3. Get doctor info
    const doctor = await DoctorModel.getDoctorById(activeBooking.doctorId);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // ✅ 4. Get schedule info and extract startTime
    let scheduleInfo = null;
    let scheduleStartTime: string | null = null;
    if (activeBooking.scheduleId) {
      const schedule = await DoctorScheduleModel.getById(
        activeBooking.scheduleId
      );
      if (schedule) {
        scheduleInfo = {
          scheduleId: schedule._id?.toString(),
          timeRange: schedule.timeRange,
          isAvailable: schedule.isAvailable,
        };

        // Extract startTime from dayOfWeek for the booking date (not today!)
        // Support both Indonesian and English day names
        if (schedule.dayOfWeek && schedule.dayOfWeek.length > 0) {
          // ✅ FIX: Use booking's scheduleDate, not today's date
          const bookingDate = activeBooking.scheduleDate
            ? new Date(activeBooking.scheduleDate)
            : activeBooking.appointmentTime
            ? new Date(activeBooking.appointmentTime)
            : new Date();
          const dayIndex = bookingDate.getDay();

          // Database mungkin menggunakan format bahasa Inggris ("Wednesday") atau Indonesia ("Rabu")
          // Support kedua format untuk kompatibilitas
          const dayMapIndonesian: { [key: number]: string } = {
            0: "Minggu",
            1: "Senin",
            2: "Selasa",
            3: "Rabu",
            4: "Kamis",
            5: "Jumat",
            6: "Sabtu",
          };
          const dayMapEnglish: { [key: number]: string } = {
            0: "Sunday",
            1: "Monday",
            2: "Tuesday",
            3: "Wednesday",
            4: "Thursday",
            5: "Friday",
            6: "Saturday",
          };
          const dayNameIndonesian = dayMapIndonesian[dayIndex];
          const dayNameEnglish = dayMapEnglish[dayIndex];

          // Cari daySchedule yang sesuai dengan hari booking (coba kedua format)
          // NOTE: Field di database adalah "availabel" (dengan typo), bukan "available"
          const bookingDaySchedule = schedule.dayOfWeek.find(
            (day) =>
              (day.hari === dayNameIndonesian || day.hari === dayNameEnglish) &&
              (day.availabel === true || (day.startTime && day.endTime))
          );

          if (bookingDaySchedule && bookingDaySchedule.startTime) {
            scheduleStartTime = bookingDaySchedule.startTime; // "09:00"
          }
        }
      }
    } else {
      // Fallback: get default schedule
      const defaultSchedule = await DoctorScheduleModel.getDefaultSchedule(
        activeBooking.doctorId
      );
      if (defaultSchedule) {
        scheduleInfo = {
          scheduleId: defaultSchedule._id?.toString(),
          timeRange: defaultSchedule.timeRange,
          isAvailable: defaultSchedule.isAvailable,
        };

        // Extract startTime from default schedule for the booking date (not today!)
        // Support both Indonesian and English day names
        if (defaultSchedule.dayOfWeek && defaultSchedule.dayOfWeek.length > 0) {
          // ✅ FIX: Use booking's scheduleDate, not today's date
          const bookingDate = activeBooking.scheduleDate
            ? new Date(activeBooking.scheduleDate)
            : activeBooking.appointmentTime
            ? new Date(activeBooking.appointmentTime)
            : new Date();
          const dayIndex = bookingDate.getDay();

          // Database mungkin menggunakan format bahasa Inggris ("Wednesday") atau Indonesia ("Rabu")
          // Support kedua format untuk kompatibilitas
          const dayMapIndonesian: { [key: number]: string } = {
            0: "Minggu",
            1: "Senin",
            2: "Selasa",
            3: "Rabu",
            4: "Kamis",
            5: "Jumat",
            6: "Sabtu",
          };
          const dayMapEnglish: { [key: number]: string } = {
            0: "Sunday",
            1: "Monday",
            2: "Tuesday",
            3: "Wednesday",
            4: "Thursday",
            5: "Friday",
            6: "Saturday",
          };
          const dayNameIndonesian = dayMapIndonesian[dayIndex];
          const dayNameEnglish = dayMapEnglish[dayIndex];

          // Cari daySchedule yang sesuai dengan hari booking (coba kedua format)
          // NOTE: Field di database adalah "availabel" (dengan typo), bukan "available"
          const bookingDaySchedule = defaultSchedule.dayOfWeek.find(
            (day) =>
              (day.hari === dayNameIndonesian || day.hari === dayNameEnglish) &&
              (day.availabel === true || (day.startTime && day.endTime))
          );

          if (bookingDaySchedule && bookingDaySchedule.startTime) {
            scheduleStartTime = bookingDaySchedule.startTime;
          }
        }
      }
    }

    // ✅ 5. Calculate queue position
    // Get all bookings with same doctor and status, ordered by queueNumber
    const queueBookings = await bookingsCollection
      .find({
        doctorId: activeBooking.doctorId,
        status: { $in: ["confirmed", "in-progress"] },
        appointmentTime: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
        },
      })
      .sort({ queueNumber: 1 })
      .toArray();

    const currentQueueIndex = queueBookings.findIndex(
      (b) => b._id.toString() === activeBooking._id.toString()
    );

    // Find currently serving (in-progress)
    // Only show queue number if there's actually a patient being served
    // AND the schedule has started (current time >= schedule start time)
    const currentlyServingBooking = queueBookings.find(
      (b) => b.status === "in-progress"
    );

    let currentlyServing: string | null = null;

    // Only show currentlyServing if:
    // 1. There's a booking with status "in-progress"
    // 2. scheduleStartTime is available
    // 3. Current time >= schedule start time
    if (currentlyServingBooking && scheduleStartTime) {
      // Validate that schedule has started
      const now = new Date();
      const [startHours, startMinutes] = scheduleStartTime
        .split(":")
        .map(Number);

      // Use booking date for validation
      const scheduleDateForValidation = activeBooking.scheduleDate
        ? new Date(activeBooking.scheduleDate)
        : activeBooking.appointmentTime
        ? new Date(activeBooking.appointmentTime)
        : new Date();

      // Create schedule start datetime
      const scheduleStart = new Date(scheduleDateForValidation);
      scheduleStart.setHours(startHours, startMinutes, 0, 0);

      // Only show currentlyServing if current time >= schedule start time
      if (now >= scheduleStart) {
        currentlyServing = currentlyServingBooking.queueNumber;
      }
    }
    // If scheduleStartTime is not available, currentlyServing remains null
    // This ensures we only show serving when we can validate the schedule has started

    const patientsAhead = currentlyServingBooking
      ? queueBookings.findIndex(
          (b) => b._id.toString() === currentlyServingBooking._id.toString()
        ) - currentQueueIndex
      : currentQueueIndex;

    // ✅ 6. Get average service time from doctor
    const averageServiceTime = doctor.averageServiceTime || 10; // default 10 minutes

    // ✅ 7. Get actual session start time (when doctor started the session)
    // Check if there's any booking that's "in-progress" or "completed" to get actual start time
    // This handles the case when doctor is late - call time will be adjusted accordingly
    let actualSessionStartTime: Date | null = null;

    // Get all bookings for this doctor on this date (including completed ones)
    const scheduleDate = activeBooking.scheduleDate
      ? new Date(activeBooking.scheduleDate)
      : activeBooking.appointmentTime
      ? new Date(activeBooking.appointmentTime)
      : new Date();

    const startOfDay = new Date(
      scheduleDate.getFullYear(),
      scheduleDate.getMonth(),
      scheduleDate.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDay = new Date(
      scheduleDate.getFullYear(),
      scheduleDate.getMonth(),
      scheduleDate.getDate(),
      23,
      59,
      59,
      999
    );

    const allBookingsForDate = await bookingsCollection
      .find({
        doctorId: activeBooking.doctorId,
        status: { $in: ["in-progress", "completed"] },
        appointmentTime: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
      .sort({ queueNumber: 1 })
      .toArray();

    // Find the first booking that was started (in-progress or completed)
    const firstStartedBooking = allBookingsForDate.find(
      (b) => b.status === "in-progress" || b.status === "completed"
    );

    if (firstStartedBooking) {
      if (firstStartedBooking.status === "in-progress") {
        // Doctor sedang melayani pasien pertama sekarang (mungkin telat)
        // Gunakan waktu saat ini sebagai session start time
        actualSessionStartTime = new Date();
      } else if (
        firstStartedBooking.status === "completed" &&
        firstStartedBooking.completedAt
      ) {
        // Doctor sudah selesai melayani pasien pertama
        // Estimasi waktu mulai sesi = completedAt - averageServiceTime
        const completedAt = new Date(firstStartedBooking.completedAt);
        actualSessionStartTime = new Date(
          completedAt.getTime() - averageServiceTime * 60 * 1000
        );
      }
    }
    // Jika belum ada yang mulai, actualSessionStartTime tetap null, akan menggunakan scheduleStartTime

    // ✅ 8. Calculate estimated call time
    // PRIORITAS: Gunakan appointmentTime dari booking sebagai base time (sama seperti doctor dashboard dan insights)
    // Logic:
    // 1. Jika appointmentTime ada: gunakan appointmentTime sebagai base, adjust berdasarkan patientsAhead
    // 2. Jika doctor sudah mulai (actualSessionStartTime ada): gunakan actualSessionStartTime sebagai base
    // 3. Jika doctor belum mulai: gunakan scheduleStartTime sebagai base
    let callTimeData;

    if (activeBooking.appointmentTime) {
      // Jika appointmentTime ada, gunakan appointmentTime sebagai base time
      // Adjust berdasarkan patientsAhead jika ada pasien di depan
      const appointmentTimeDate = new Date(activeBooking.appointmentTime);
      const totalWaitMinutes = Math.max(0, patientsAhead) * averageServiceTime;
      const estimatedCallTimeDate = new Date(
        appointmentTimeDate.getTime() + totalWaitMinutes * 60 * 1000
      );

      const hours = estimatedCallTimeDate.getHours();
      const minutes = estimatedCallTimeDate.getMinutes();
      const displayHours = hours.toString().padStart(2, "0");
      const displayMinutes = minutes.toString().padStart(2, "0");

      const currentTime = new Date();
      const minutesUntil = Math.max(
        0,
        Math.ceil(
          (estimatedCallTimeDate.getTime() - currentTime.getTime()) /
            (60 * 1000)
        )
      );

      let formatted: string;
      if (minutesUntil <= 1) {
        formatted = "Any moment now";
      } else if (minutesUntil < 60) {
        formatted = `In ${minutesUntil} minutes`;
      } else {
        const hoursUntil = Math.floor(minutesUntil / 60);
        const remainingMinutes = minutesUntil % 60;
        formatted = `In ${hoursUntil}h ${remainingMinutes}m`;
      }

      callTimeData = {
        estimatedTime: totalWaitMinutes,
        estimatedCallTime: `${displayHours}:${displayMinutes}`,
        estimatedCallTimeTimestamp: estimatedCallTimeDate,
        estimatedCallTimeFormatted: formatted,
      };
    } else if (actualSessionStartTime) {
      // Jika doctor sudah mulai, gunakan actualSessionStartTime
      callTimeData = calculateEstimatedCallTime(
        Math.max(0, patientsAhead),
        averageServiceTime,
        scheduleStartTime, // Pass schedule startTime (fallback)
        scheduleDate, // Pass schedule date
        actualSessionStartTime // Pass actual session start time
      );
    } else {
      // Fallback: gunakan scheduleStartTime jika appointmentTime tidak ada
      callTimeData = calculateEstimatedCallTime(
        Math.max(0, patientsAhead),
        averageServiceTime,
        scheduleStartTime, // Pass schedule startTime
        scheduleDate // Pass schedule date
      );
    }

    // ✅ 9. Map queue status
    let queueStatus: "waiting" | "being-served" | "completed" = "waiting";
    if (activeBooking.status === "in-progress") {
      queueStatus = "being-served";
    } else if (activeBooking.status === "completed") {
      queueStatus = "completed";
    }

    // ✅ 10. Format dates
    const appointmentDate = new Date(activeBooking.appointmentTime);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const appointmentTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });

    // ✅ 11. Emit socket events for real-time updates
    const bookingIdStr = activeBooking._id.toString();

    // Emit position update
    emitQueuePositionUpdate(bookingIdStr, {
      currentlyServing: currentlyServing || "",
      patientsAhead: Math.max(0, patientsAhead),
      queueNumber: activeBooking.queueNumber || "",
    });

    // Emit call time update
    emitCallTimeUpdate(bookingIdStr, {
      estimatedCallTime: callTimeData.estimatedCallTime,
      estimatedCallTimeTimestamp:
        callTimeData.estimatedCallTimeTimestamp.toISOString(),
      patientsAhead: Math.max(0, patientsAhead),
      estimatedTime: callTimeData.estimatedTime,
    });

    // Emit status change
    emitQueueStatusChange(bookingIdStr, {
      queueStatus: queueStatus,
      estimatedCallTime: callTimeData.estimatedCallTime,
      estimatedCallTimeTimestamp:
        callTimeData.estimatedCallTimeTimestamp.toISOString(),
    });

    // ✅ 12. Return response
    return NextResponse.json({
      bookingId: activeBooking._id.toString(),
      bookingNumber: activeBooking.bookingNumber || "",
      queueNumber: activeBooking.queueNumber || "",
      queueStatus: queueStatus,
      currentlyServing: currentlyServing || "",
      patientsAhead: Math.max(0, patientsAhead),
      averageServiceTime: averageServiceTime,
      estimatedTime: callTimeData.estimatedTime,
      estimatedCallTime: callTimeData.estimatedCallTime,
      estimatedCallTimeFormatted: callTimeData.estimatedCallTimeFormatted,
      estimatedCallTimeTimestamp:
        callTimeData.estimatedCallTimeTimestamp.toISOString(),
      appointmentDate: activeBooking.appointmentTime,
      appointmentTime: appointmentTime,
      appointmentDateFormatted: formattedDate,
      timeRange: scheduleInfo?.timeRange || "09:00 - 17:00",
      patientComplaint: activeBooking.complaint || "",
      doctor: {
        doctorId: doctor._id?.toString() || activeBooking.doctorId,
        name: doctor.name,
        specialization: doctor.specialization,
        clinic: doctor.clinic,
        rating: doctor.averageRating || 0,
        totalReviews: doctor.totalReviews || 0,
        image: doctor.image,
      },
      schedule: scheduleInfo,
    });
  } catch (error) {
    console.error("Error fetching active queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch active queue" },
      { status: 500 }
    );
  }
}

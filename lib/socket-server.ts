import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

// Get Socket.IO instance from global (set by server.js)
export function getSocketIO(): SocketIOServer | null {
  if (typeof global !== "undefined" && global.io) {
    return global.io;
  }
  return null;
}

// Emit queue position update
export function emitQueuePositionUpdate(
  bookingId: string,
  data: {
    currentlyServing: string;
    patientsAhead: number;
    queueNumber: string;
  }
) {
  const io = getSocketIO();
  if (io) {
    io.to(`queue:${bookingId}`).emit("queue:position-update", {
      bookingId,
      ...data
    });
  }
}

// Emit queue status change
export function emitQueueStatusChange(
  bookingId: string,
  data: {
    queueStatus: "waiting" | "being-served" | "completed";
    estimatedCallTime?: string;
    estimatedCallTimeTimestamp?: string;
  }
) {
  const io = getSocketIO();
  if (io) {
    io.to(`queue:${bookingId}`).emit("queue:status-change", {
      bookingId,
      ...data
    });
  }
}

// Emit call time update
export function emitCallTimeUpdate(
  bookingId: string,
  data: {
    estimatedCallTime: string;
    estimatedCallTimeTimestamp: string;
    patientsAhead: number;
    estimatedTime: number;
  }
) {
  const io = getSocketIO();
  if (io) {
    io.to(`queue:${bookingId}`).emit("queue:call-time-update", {
      bookingId,
      ...data
    });
  }
}

// Recalculate and emit call time updates to all patients in the same queue
// This is called when a booking is cancelled or skipped to update all remaining patients
export async function recalculateAndEmitCallTimeUpdates(
  doctorId: string,
  scheduleDate: Date | string,
  cancelledBookingId?: string // Optional: booking that was cancelled/skipped
) {
  const io = getSocketIO();
  if (!io) {
    console.warn("⚠️ Socket.IO instance not available for recalculateAndEmitCallTimeUpdates");
    return;
  }

  try {
    const { getDb } = await import("@/db/config/mongodb");
    const { ObjectId } = await import("mongodb");
    const { calculateEstimatedCallTime } = await import("@/lib/queue-utils");
    const DoctorModel = (await import("@/db/models/Doctor")).default;
    const DoctorScheduleModel = (await import("@/db/models/DoctorSchedule")).default;

    const db = await getDb();
    const bookingsCollection = db.collection("bookings");

    // Parse scheduleDate
    const targetDate = typeof scheduleDate === "string" ? new Date(scheduleDate) : scheduleDate;
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    // Get doctor info
    const doctor = await DoctorModel.getDoctorById(doctorId);
    if (!doctor) {
      console.error("Doctor not found for call time recalculation");
      return;
    }

    const averageServiceTime = doctor.averageServiceTime || 10;

    // Get schedule startTime
    let scheduleStartTime: string | null = null;
    if (doctor.scheduleId) {
      const schedule = await DoctorScheduleModel.getById(doctor.scheduleId);
      if (schedule && schedule.dayOfWeek && schedule.dayOfWeek.length > 0) {
        const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const dayName = dayNames[targetDate.getDay()];
        const daySchedule = schedule.dayOfWeek.find(day => day.hari === dayName);
        if (daySchedule && daySchedule.startTime) {
          scheduleStartTime = daySchedule.startTime;
        }
      }
    }

    if (!scheduleStartTime) {
      // Fallback to default schedule
      const defaultSchedule = await DoctorScheduleModel.getDefaultSchedule(doctorId);
      if (defaultSchedule && defaultSchedule.dayOfWeek && defaultSchedule.dayOfWeek.length > 0) {
        const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const dayName = dayNames[targetDate.getDay()];
        const daySchedule = defaultSchedule.dayOfWeek.find(day => day.hari === dayName);
        if (daySchedule && daySchedule.startTime) {
          scheduleStartTime = daySchedule.startTime;
        }
      }
    }

    // Get all active bookings for this doctor on this date (exclude cancelled)
    const queueBookings = await bookingsCollection
      .find({
        doctorId: new ObjectId(doctorId),
        status: { $in: ["confirmed", "in-progress"] },
        appointmentTime: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
      .sort({ queueNumber: 1 })
      .toArray();

    // Find currently serving (in-progress)
    const currentlyServingBooking = queueBookings.find(b => b.status === "in-progress");

    // ✅ Get actual session start time (when doctor started the session)
    // This handles the case when doctor is late - call time will be adjusted accordingly
    let actualSessionStartTime: Date | null = null;
    
    // Get all bookings for this doctor on this date (including completed ones)
    const allBookingsForDate = await bookingsCollection
      .find({
        doctorId: new ObjectId(doctorId),
        status: { $in: ["in-progress", "completed"] },
        appointmentTime: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
      .sort({ queueNumber: 1 })
      .toArray();
    
    // Find the first booking that was started (in-progress or completed)
    const firstStartedBooking = allBookingsForDate.find(b => 
      b.status === "in-progress" || b.status === "completed"
    );
    
    if (firstStartedBooking) {
      if (firstStartedBooking.status === "in-progress") {
        // Doctor sedang melayani pasien pertama sekarang (mungkin telat)
        // Gunakan waktu saat ini sebagai session start time
        actualSessionStartTime = new Date();
      } else if (firstStartedBooking.status === "completed" && firstStartedBooking.completedAt) {
        // Doctor sudah selesai melayani pasien pertama
        // Estimasi waktu mulai sesi = completedAt - averageServiceTime
        const completedAt = new Date(firstStartedBooking.completedAt);
        actualSessionStartTime = new Date(completedAt.getTime() - averageServiceTime * 60 * 1000);
      }
    }
    // Jika belum ada yang mulai, actualSessionStartTime tetap null, akan menggunakan scheduleStartTime

    // Recalculate call time for each patient
    for (const booking of queueBookings) {
      // Skip the cancelled/skipped booking if provided
      if (cancelledBookingId && booking._id.toString() === cancelledBookingId) {
        continue;
      }

      const currentQueueIndex = queueBookings.findIndex(
        (b) => b._id.toString() === booking._id.toString()
      );

      const patientsAhead = currentlyServingBooking
        ? queueBookings.findIndex(b => b._id.toString() === currentlyServingBooking._id.toString()) - currentQueueIndex
        : currentQueueIndex;

      // Calculate call time
      const bookingScheduleDate = booking.scheduleDate 
        ? new Date(booking.scheduleDate) 
        : booking.appointmentTime 
        ? new Date(booking.appointmentTime) 
        : targetDate;

      const callTimeData = calculateEstimatedCallTime(
        Math.max(0, patientsAhead),
        averageServiceTime,
        scheduleStartTime,
        bookingScheduleDate,
        actualSessionStartTime // Pass actual session start time (if doctor has started)
      );

      // Emit call time update to this patient
      emitCallTimeUpdate(booking._id.toString(), {
        estimatedCallTime: callTimeData.estimatedCallTime,
        estimatedCallTimeTimestamp: callTimeData.estimatedCallTimeTimestamp.toISOString(),
        patientsAhead: Math.max(0, patientsAhead),
        estimatedTime: callTimeData.estimatedTime
      });
    }

    console.log(`✅ Recalculated and emitted call time updates for ${queueBookings.length} patients in queue`);
  } catch (error) {
    console.error("Error recalculating call time updates:", error);
  }
}


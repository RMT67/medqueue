import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import BookingModel from "@/db/models/Booking";
import DoctorModel from "@/db/models/Doctor";
import DoctorScheduleModel from "@/db/models/DoctorSchedule";
import { calculateEstimatedCallTime } from "@/lib/queue-utils";
import { emitQueuePositionUpdate, emitCallTimeUpdate, emitQueueStatusChange } from "@/lib/socket-server";

export async function GET(req: Request) {
  try {
    // ✅ 1. Authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
    const activeBooking = await bookingsCollection.findOne({
      patientId: patientObjectId,
      status: { $in: ["confirmed", "in-progress"] }
    }, {
      sort: { appointmentTime: 1 } // Get earliest appointment
    });

    if (!activeBooking) {
      return NextResponse.json(
        { error: "No active queue found" },
        { status: 404 }
      );
    }

    // ✅ 3. Get doctor info
    const doctor = await DoctorModel.getDoctorById(activeBooking.doctorId);
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // ✅ 4. Get schedule info
    let scheduleInfo = null;
    if (activeBooking.scheduleId) {
      const schedule = await DoctorScheduleModel.getById(activeBooking.scheduleId);
      if (schedule) {
        scheduleInfo = {
          scheduleId: schedule._id?.toString(),
          timeRange: schedule.timeRange,
          isAvailable: schedule.isAvailable
        };
      }
    } else {
      // Fallback: get default schedule
      const defaultSchedule = await DoctorScheduleModel.getDefaultSchedule(activeBooking.doctorId);
      if (defaultSchedule) {
        scheduleInfo = {
          scheduleId: defaultSchedule._id?.toString(),
          timeRange: defaultSchedule.timeRange,
          isAvailable: defaultSchedule.isAvailable
        };
      }
    }

    // ✅ 5. Calculate queue position
    // Get all bookings with same doctor and status, ordered by queueNumber
    const queueBookings = await bookingsCollection
      .find({
        doctorId: activeBooking.doctorId,
        status: { $in: ["confirmed", "in-progress"] },
        appointmentTime: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
        }
      })
      .sort({ queueNumber: 1 })
      .toArray();

    const currentQueueIndex = queueBookings.findIndex(
      (b) => b._id.toString() === activeBooking._id.toString()
    );

    // Find currently serving (in-progress)
    const currentlyServingBooking = queueBookings.find(b => b.status === "in-progress");
    const currentlyServing = currentlyServingBooking?.queueNumber || 
      (queueBookings.length > 0 ? queueBookings[0].queueNumber : null);

    const patientsAhead = currentlyServingBooking
      ? queueBookings.findIndex(b => b._id.toString() === currentlyServingBooking._id.toString()) - currentQueueIndex
      : currentQueueIndex;

    // ✅ 6. Get average service time from doctor
    const averageServiceTime = doctor.averageServiceTime || 10; // default 10 minutes

    // ✅ 7. Calculate estimated call time
    const callTimeData = calculateEstimatedCallTime(
      Math.max(0, patientsAhead),
      averageServiceTime
    );

    // ✅ 8. Map queue status
    let queueStatus: "waiting" | "being-served" | "completed" = "waiting";
    if (activeBooking.status === "in-progress") {
      queueStatus = "being-served";
    } else if (activeBooking.status === "completed") {
      queueStatus = "completed";
    }

    // ✅ 9. Format dates
    const appointmentDate = new Date(activeBooking.appointmentTime);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const appointmentTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false
    });

    // ✅ 10. Emit socket events for real-time updates
    const bookingIdStr = activeBooking._id.toString();
    
    // Emit position update
    emitQueuePositionUpdate(bookingIdStr, {
      currentlyServing: currentlyServing || "",
      patientsAhead: Math.max(0, patientsAhead),
      queueNumber: activeBooking.queueNumber || ""
    });

    // Emit call time update
    emitCallTimeUpdate(bookingIdStr, {
      estimatedCallTime: callTimeData.estimatedCallTime,
      estimatedCallTimeTimestamp: callTimeData.estimatedCallTimeTimestamp,
      patientsAhead: Math.max(0, patientsAhead),
      estimatedTime: callTimeData.estimatedTime
    });

    // Emit status change
    emitQueueStatusChange(bookingIdStr, {
      queueStatus: queueStatus,
      estimatedCallTime: callTimeData.estimatedCallTime,
      estimatedCallTimeTimestamp: callTimeData.estimatedCallTimeTimestamp
    });

    // ✅ 11. Return response
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
      estimatedCallTimeTimestamp: callTimeData.estimatedCallTimeTimestamp,
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
        image: doctor.image
      },
      schedule: scheduleInfo
    });
  } catch (error) {
    console.error("Error fetching active queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch active queue" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import DoctorModel from "@/db/models/Doctor";
import DoctorScheduleModel from "@/db/models/DoctorSchedule";
import { calculateClinicTraffic, calculateScheduleStatus, generateInsights, calculateEstimatedCallTime } from "@/lib/queue-utils";

export async function GET(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
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

    const { bookingId } = params;
    const db = await getDb();
    const patientObjectId = new ObjectId(userId);
    const bookingsCollection = db.collection("bookings");

    // ✅ 2. Get booking and verify ownership
    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId),
      patientId: patientObjectId
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to patient" },
        { status: 404 }
      );
    }

    // ✅ 3. Get doctor info
    const doctor = await DoctorModel.getDoctorById(booking.doctorId);
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // ✅ 4. Get schedule
    let schedule = null;
    if (booking.scheduleId) {
      schedule = await DoctorScheduleModel.getById(booking.scheduleId);
    } else {
      schedule = await DoctorScheduleModel.getDefaultSchedule(booking.doctorId);
    }

    // ✅ 5. Calculate queue position
    const queueBookings = await bookingsCollection
      .find({
        doctorId: booking.doctorId,
        status: { $in: ["confirmed", "in-progress"] },
        appointmentTime: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
      .sort({ queueNumber: 1 })
      .toArray();

    const currentQueueIndex = queueBookings.findIndex(
      (b) => b._id.toString() === booking._id.toString()
    );
    const patientsAhead = Math.max(0, currentQueueIndex);

    // ✅ 6. Get average service time
    const averageServiceTime = doctor.averageServiceTime || 10;

    // ✅ 7. Calculate estimated call time
    const callTimeData = calculateEstimatedCallTime(patientsAhead, averageServiceTime);

    // ✅ 8. Calculate clinic traffic
    const trafficData = await calculateClinicTraffic(
      booking.doctorId,
      schedule?._id?.toString()
    );

    // ✅ 9. Calculate schedule status
    const scheduleStatusData = await calculateScheduleStatus(
      booking.doctorId,
      schedule?._id?.toString(),
      schedule?.firstCallTime || null
    );

    // ✅ 10. Generate AI insights
    const insightsData = await generateInsights(
      averageServiceTime,
      scheduleStatusData.scheduleStatus,
      scheduleStatusData.scheduleDelay,
      trafficData.clinicTraffic,
      trafficData.clinicTrafficPercentage,
      patientsAhead,
      callTimeData.estimatedCallTime,
      callTimeData.estimatedCallTimeFormatted
    );

    // ✅ 11. Calculate arrival recommendation
    const bufferMinutes = 5; // Arrive 5 minutes before
    const arrivalTime = new Date(callTimeData.estimatedCallTimeTimestamp.getTime() - bufferMinutes * 60 * 1000);
    const arrivalTimeStr = `${arrivalTime.getHours().toString().padStart(2, "0")}:${arrivalTime.getMinutes().toString().padStart(2, "0")}`;

    // ✅ 12. Return response
    return NextResponse.json({
      averageServiceTime: averageServiceTime,
      scheduleStatus: scheduleStatusData.scheduleStatus,
      scheduleDelay: scheduleStatusData.scheduleDelay,
      clinicTraffic: trafficData.clinicTraffic,
      clinicTrafficPercentage: trafficData.clinicTrafficPercentage,
      patientsAhead: patientsAhead,
      estimatedCallTime: callTimeData.estimatedCallTime,
      estimatedCallTimeTimestamp: callTimeData.estimatedCallTimeTimestamp,
      arrivalRecommendation: {
        bufferMinutes: bufferMinutes,
        recommendedArrivalTime: arrivalTimeStr,
        recommendedArrivalTimeTimestamp: arrivalTime
      },
      smartSuggestion: insightsData.smartSuggestion,
      insights: insightsData.insights,
      warnings: insightsData.warnings
    });
  } catch (error) {
    console.error("Error fetching queue insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue insights" },
      { status: 500 }
    );
  }
}


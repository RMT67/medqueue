import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import DoctorModel from "@/db/models/Doctor";
import DoctorScheduleModel from "@/db/models/DoctorSchedule";
import { calculateClinicTraffic, calculateScheduleStatus, generateInsights, calculateEstimatedCallTime } from "@/lib/queue-utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
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

    const { bookingId } = await params;
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

    // ✅ 4. Get schedule and extract startTime
    // Menggunakan logika yang sama dengan my-queue API untuk konsistensi
    let schedule = null;
    let scheduleStartTime: string | null = null;
    if (booking.scheduleId) {
      schedule = await DoctorScheduleModel.getById(booking.scheduleId);
    } else {
      schedule = await DoctorScheduleModel.getDefaultSchedule(booking.doctorId);
    }

    // Extract startTime from schedule - support both Indonesian and English day names
    if (schedule?.dayOfWeek && schedule.dayOfWeek.length > 0) {
      const scheduleDate = booking.scheduleDate 
        ? new Date(booking.scheduleDate) 
        : booking.appointmentTime 
        ? new Date(booking.appointmentTime) 
        : new Date();
      const dayIndex = scheduleDate.getDay();
      
      // Database mungkin menggunakan format bahasa Inggris ("Wednesday") atau Indonesia ("Rabu")
      // Support kedua format untuk kompatibilitas
      const dayMapIndonesian: { [key: number]: string } = {
        0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu",
        4: "Kamis", 5: "Jumat", 6: "Sabtu",
      };
      const dayMapEnglish: { [key: number]: string } = {
        0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
        4: "Thursday", 5: "Friday", 6: "Saturday",
      };
      const dayNameIndonesian = dayMapIndonesian[dayIndex];
      const dayNameEnglish = dayMapEnglish[dayIndex];
      
      // Cari daySchedule yang sesuai dengan hari booking (coba kedua format)
      // NOTE: Field di database adalah "availabel" (dengan typo), bukan "available"
      const daySchedule = schedule.dayOfWeek.find((d) => 
        (d.hari === dayNameIndonesian || d.hari === dayNameEnglish) && 
        (d.availabel === true || (d.startTime && d.endTime)) // Cek available atau minimal punya startTime/endTime
      );
      
      if (daySchedule && daySchedule.startTime) {
        scheduleStartTime = daySchedule.startTime;
      }
    }
    
    // Fallback: Jika masih tidak ada, coba ambil dari default schedule
    if (!scheduleStartTime) {
      const defaultSchedule = await DoctorScheduleModel.getDefaultSchedule(booking.doctorId);
      
      if (defaultSchedule?.dayOfWeek && defaultSchedule.dayOfWeek.length > 0) {
        const scheduleDate = booking.scheduleDate 
          ? new Date(booking.scheduleDate) 
          : booking.appointmentTime 
          ? new Date(booking.appointmentTime) 
          : new Date();
        const dayIndex = scheduleDate.getDay();
        const dayMapIndonesian: { [key: number]: string } = {
          0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu",
          4: "Kamis", 5: "Jumat", 6: "Sabtu",
        };
        const dayMapEnglish: { [key: number]: string } = {
          0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
          4: "Thursday", 5: "Friday", 6: "Saturday",
        };
        const dayNameIndonesian = dayMapIndonesian[dayIndex];
        const dayNameEnglish = dayMapEnglish[dayIndex];
        
        // Cari daySchedule yang sesuai dengan hari booking (coba kedua format)
        const availableDay = defaultSchedule.dayOfWeek.find(d => 
          (d.hari === dayNameIndonesian || d.hari === dayNameEnglish) && 
          (d.availabel === true || (d.startTime && d.endTime))
        );
        
        if (availableDay && availableDay.startTime) {
          scheduleStartTime = availableDay.startTime;
        }
      }
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
    // PRIORITAS: Gunakan appointmentTime dari booking sebagai base time (sama seperti doctor dashboard)
    // Jika appointmentTime ada, gunakan itu. Jika tidak, baru gunakan scheduleStartTime
    const scheduleDate = booking.scheduleDate 
      ? new Date(booking.scheduleDate) 
      : booking.appointmentTime 
      ? new Date(booking.appointmentTime) 
      : new Date();

    let callTimeData;
    if (booking.appointmentTime) {
      // Jika appointmentTime ada, gunakan appointmentTime sebagai base time
      // Adjust berdasarkan patientsAhead jika ada pasien di depan
      const appointmentTimeDate = new Date(booking.appointmentTime);
      const totalWaitMinutes = patientsAhead * averageServiceTime;
      const estimatedCallTimeDate = new Date(appointmentTimeDate.getTime() + totalWaitMinutes * 60 * 1000);
      
      const hours = estimatedCallTimeDate.getHours();
      const minutes = estimatedCallTimeDate.getMinutes();
      const displayHours = hours.toString().padStart(2, "0");
      const displayMinutes = minutes.toString().padStart(2, "0");
      
      const currentTime = new Date();
      const minutesUntil = Math.max(0, Math.ceil((estimatedCallTimeDate.getTime() - currentTime.getTime()) / (60 * 1000)));
      
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
      
      console.log(`[insights API] Using appointmentTime as base:`, {
        appointmentTime: booking.appointmentTime,
        appointmentTimeFormatted: `${displayHours}:${displayMinutes}`,
        patientsAhead,
        totalWaitMinutes,
        estimatedCallTime: `${displayHours}:${displayMinutes}`
      });
      
      callTimeData = {
        estimatedTime: totalWaitMinutes,
        estimatedCallTime: `${displayHours}:${displayMinutes}`,
        estimatedCallTimeTimestamp: estimatedCallTimeDate,
        estimatedCallTimeFormatted: formatted
      };
    } else {
      // Fallback: gunakan scheduleStartTime jika appointmentTime tidak ada
      console.log(`[insights API] No appointmentTime, using scheduleStartTime:`, scheduleStartTime);
      callTimeData = calculateEstimatedCallTime(
        patientsAhead,
        averageServiceTime,
        scheduleStartTime, // Pass schedule startTime
        scheduleDate // Pass schedule date
      );
    }

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
    // Pastikan menggunakan appointmentTime sebenarnya dari booking untuk konteks (jika diperlukan)
    // estimatedCallTime sudah dihitung dengan benar menggunakan scheduleStartTime yang sudah diperbaiki
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

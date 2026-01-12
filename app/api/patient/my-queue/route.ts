import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import DoctorScheduleModel, { DayOfWeek } from "@/db/models/DoctorSchedule";
import MedicalRecordModel from "@/db/models/MedicalRecord";
import ReviewModel from "@/db/models/Review";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    console.log("🚀 ~ GET ~ authHeader:", authHeader);
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: { userId: string; role: string };
    try {
      decoded = verifyToken(authHeader);
    } catch (err) {
      console.log("🚀 ~ GET ~ err:", err);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = decoded;
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Forbidden - Patient access only" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const patientObjectId = new ObjectId(userId);

    const bookingsCollection = db.collection("bookings");
    const doctorsCollection = db.collection("doctors");
    const invoicesCollection = db.collection("invoices");

    const bookings = await bookingsCollection
      .find({
        patientId: patientObjectId,
        status: { $in: ["confirmed", "in-progress", "completed", "cancelled"] },
      })
      .sort({ appointmentTime: 1 })
      .toArray();

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ queues: [] }, { status: 200 });
    }

    const queues = await Promise.all(
      bookings.map(async (booking) => {
        let doctorQuery: any = booking.doctorId;
        try {
          if (typeof booking.doctorId === "string") {
            doctorQuery = new ObjectId(booking.doctorId);
          }
        } catch (err) {
          // keep original value if conversion fails
        }

        const doctor = await doctorsCollection.findOne({ _id: doctorQuery });

        let scheduleTimeRange: string | null = null;

        if (booking.scheduleId) {
          const schedule = await DoctorScheduleModel.getById(
            booking.scheduleId.toString()
          );

          // SELALU ambil dari dayOfWeek yang sesuai dengan tanggal booking, JANGAN gunakan schedule.timeRange
          // schedule.timeRange mungkin tidak spesifik untuk hari booking
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

            const daySchedule = schedule.dayOfWeek.find(
              (d: DayOfWeek) =>
                (d.hari === dayNameIndonesian || d.hari === dayNameEnglish) &&
                (d.availabel === true || (d.startTime && d.endTime)) // Cek available atau minimal punya startTime/endTime
            );

            if (daySchedule && daySchedule.startTime && daySchedule.endTime) {
              scheduleTimeRange = `${daySchedule.startTime} - ${daySchedule.endTime}`;
            } else {
              // JANGAN fallback ke schedule.timeRange karena tidak spesifik untuk hari booking
              // Coba cari dari default schedule atau biarkan null
              scheduleTimeRange = null;
            }
          } else {
            // Jika tidak ada dayOfWeek, gunakan schedule.timeRange
            scheduleTimeRange = schedule?.timeRange || null;
          }
        }

        // Fallback: Jika masih tidak ada, coba ambil dari default schedule
        if (!scheduleTimeRange) {
          const defaultSchedule = await DoctorScheduleModel.getDefaultSchedule(
            booking.doctorId
          );

          if (defaultSchedule?.timeRange) {
            scheduleTimeRange = defaultSchedule.timeRange;
          } else if (
            defaultSchedule?.dayOfWeek &&
            defaultSchedule.dayOfWeek.length > 0
          ) {
            // Cari dari hari yang sesuai dengan tanggal booking, bukan hari pertama
            const scheduleDate = booking.scheduleDate
              ? new Date(booking.scheduleDate)
              : booking.appointmentTime
              ? new Date(booking.appointmentTime)
              : new Date();
            const dayIndex = scheduleDate.getDay();
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
            const availableDay = defaultSchedule.dayOfWeek.find(
              (d: DayOfWeek) =>
                (d.hari === dayNameIndonesian || d.hari === dayNameEnglish) &&
                (d.availabel === true || (d.startTime && d.endTime))
            );

            if (
              availableDay &&
              availableDay.startTime &&
              availableDay.endTime
            ) {
              scheduleTimeRange = `${availableDay.startTime} - ${availableDay.endTime}`;
            } else {
              // JANGAN gunakan "first available day" karena tidak sesuai dengan hari booking
              // Biarkan null, akan ditampilkan sebagai "-" di frontend
              scheduleTimeRange = null;
            }
          }
        }

        const invoice = await invoicesCollection.findOne(
          {
            bookingId: booking._id,
            patientId: patientObjectId,
          },
          {
            sort: { createdAt: -1 },
          }
        );

        // Check for medical record
        const medicalRecordsCollection = db.collection("medicalrecords");
        const medicalRecord = await medicalRecordsCollection.findOne({
          bookingId: booking._id,
          patientId: patientObjectId,
        });

        // Check for review
        const reviewsCollection = db.collection("reviews");
        const review = await reviewsCollection.findOne({
          bookingId: booking._id.toString(),
          patientId: patientObjectId.toString(),
        });

        const scheduleDate = booking.scheduleDate
          ? new Date(booking.scheduleDate).toISOString()
          : booking.appointmentTime
          ? new Date(booking.appointmentTime).toISOString()
          : null;

        // Pastikan appointmentTime adalah appointmentTime sebenarnya dari booking
        // JANGAN gunakan scheduleStartTime atau timeRange sebagai fallback
        // Biarkan NextResponse.json yang handle serialization (sama seperti doctor dashboard API)
        // booking.appointmentTime dari MongoDB adalah Date object, NextResponse.json akan serialize ke ISO string
        const appointmentTime = booking.appointmentTime || null;

        // Debug: log appointmentTime untuk SEMUA booking (tidak hanya F-007)
        console.log(
          `[my-queue API] ====== Processing booking ${
            booking.bookingNumber || booking.queueNumber || booking._id
          } ======`
        );
        console.log("[my-queue API] Raw appointmentTime from MongoDB:", {
          appointmentTime: appointmentTime,
          type: typeof appointmentTime,
          isDate: appointmentTime instanceof Date,
          isNull: appointmentTime === null,
          isUndefined: appointmentTime === undefined,
          toString: appointmentTime?.toString(),
          valueOf: appointmentTime?.valueOf?.(),
        });

        if (appointmentTime) {
          try {
            const time = new Date(appointmentTime);
            const localHours = time.getHours();
            const localMinutes = time.getMinutes();
            const formatted = `${localHours
              .toString()
              .padStart(2, "0")}:${localMinutes.toString().padStart(2, "0")}`;
            console.log("[my-queue API] Parsed appointmentTime:", {
              iso: time.toISOString(),
              local: time.toString(),
              formatted: formatted,
              hours: localHours,
              minutes: localMinutes,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
          } catch (e) {
            console.error("[my-queue API] Error parsing appointmentTime:", e);
          }
        } else {
          console.warn(
            "[my-queue API] ⚠️ appointmentTime is NULL or UNDEFINED!"
          );
        }

        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/12920fd2-3179-4444-a1d4-b2f4f8633224",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "my-queue/route.ts:180",
              message: "API: Returning queue data",
              data: {
                bookingId: booking._id?.toString(),
                appointmentTime: appointmentTime?.toString(),
                timeRange: scheduleTimeRange,
                scheduleDate,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "C",
            }),
          }
        ).catch(() => {});
        // #endregion
        return {
          _id: booking._id.toString(),
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber || "",
          status: booking.status,
          queueNumber: booking.queueNumber || "",
          scheduleDate,
          appointmentTime,
          timeRange: scheduleTimeRange,
          complaint: booking.complaint || "",
          doctor: doctor
            ? {
                _id: doctor._id.toString(),
                name: doctor.name,
                specialization: doctor.specialization || "",
                clinic: doctor.clinic || "",
                image: doctor.image || "",
                rating: doctor.averageRating || 0,
                totalReviews: doctor.totalReviews || 0,
              }
            : null,
          invoice: invoice
            ? {
                _id: invoice._id.toString(),
                status: invoice.status,
                invoiceNumber: invoice.invoiceNumber || "",
                total: invoice.total,
              }
            : null,
          hasMedicalRecord: !!medicalRecord,
          hasInvoice: !!invoice,
          hasReview: !!review,
        };
      })
    );

    return NextResponse.json({ queues }, { status: 200 });
  } catch (error) {
    console.error("Error fetching my queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch queues" },
      { status: 500 }
    );
  }
}

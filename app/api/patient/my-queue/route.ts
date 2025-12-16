import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import DoctorScheduleModel from "@/db/models/DoctorSchedule";
import MedicalRecordModel from "@/db/models/MedicalRecord";
import ReviewModel from "@/db/models/Review";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: { userId: string; role: string };
    try {
      decoded = verifyToken(authHeader);
    } catch (err) {
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
          scheduleTimeRange = schedule?.timeRange || null;
          
          // Jika timeRange tidak ada, buat dari dayOfWeek yang sesuai dengan tanggal booking
          if (!scheduleTimeRange && schedule?.dayOfWeek && schedule.dayOfWeek.length > 0) {
            const scheduleDate = booking.scheduleDate 
              ? new Date(booking.scheduleDate) 
              : booking.appointmentTime 
              ? new Date(booking.appointmentTime) 
              : new Date();
            
            const dayIndex = scheduleDate.getDay();
            const dayMap: { [key: number]: string } = {
              0: "Minggu",
              1: "Senin",
              2: "Selasa",
              3: "Rabu",
              4: "Kamis",
              5: "Jumat",
              6: "Sabtu",
            };
            const dayName = dayMap[dayIndex];
            const daySchedule = schedule.dayOfWeek.find((d) => d.hari === dayName);
            
            if (daySchedule && daySchedule.startTime && daySchedule.endTime) {
              scheduleTimeRange = `${daySchedule.startTime} - ${daySchedule.endTime}`;
            }
          }
        }

        // Fallback: Jika masih tidak ada, coba ambil dari default schedule
        if (!scheduleTimeRange) {
          const defaultSchedule = await DoctorScheduleModel.getDefaultSchedule(booking.doctorId);
          if (defaultSchedule?.timeRange) {
            scheduleTimeRange = defaultSchedule.timeRange;
          } else if (defaultSchedule?.dayOfWeek && defaultSchedule.dayOfWeek.length > 0) {
            // Ambil dari hari pertama yang available
            const availableDay = defaultSchedule.dayOfWeek.find(d => d.available);
            if (availableDay && availableDay.startTime && availableDay.endTime) {
              scheduleTimeRange = `${availableDay.startTime} - ${availableDay.endTime}`;
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

        const appointmentTime = booking.appointmentTime
          ? new Date(booking.appointmentTime).toISOString()
          : null;

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

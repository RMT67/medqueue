import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import BookingModel from "@/db/models/Booking";
import DoctorModel from "@/db/models/Doctor";
import InvoiceModel from "@/db/models/Invoice";
import MedicalRecordModel from "@/db/models/MedicalRecord";
import DoctorScheduleModel from "@/db/models/DoctorSchedule";

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

    let decoded;
    try {
      decoded = verifyToken(authHeader);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // ✅ 2. Verify patient role
    if (decoded.role !== "patient") {
      return NextResponse.json(
        { error: "Forbidden - Patient access only" },
        { status: 403 }
      );
    }

    const patientId = decoded.userId;
    const db = await getDb();
    const patientObjectId = new ObjectId(patientId);

    // ✅ 3. Calculate Summary Stats
    const bookingsCollection = db.collection("bookings");
    const invoicesCollection = db.collection("invoices");

    // Active Queue count (bookings dengan status confirmed atau in-progress)
    const activeQueue = await bookingsCollection.countDocuments({
      patientId: patientObjectId,
      status: { $in: ["confirmed", "in-progress"] }
    });

    // Pending Payments count (invoices dengan status pending yang valid)
    const pendingInvoices = await invoicesCollection.find({
      patientId: patientObjectId,
      status: "pending"
    }).toArray();

    // Validate pending invoices (harus punya medical record lengkap)
    let validPendingCount = 0;
    const medicalRecordsCollection = db.collection("medicalrecords");
    
    for (const invoice of pendingInvoices) {
      if (invoice.medicalRecordId) {
        const medicalRecord = await medicalRecordsCollection.findOne({
          _id: new ObjectId(invoice.medicalRecordId)
        });
        
        // Medical record valid jika punya prescriptions ATAU service
        const hasPrescriptions = medicalRecord && 
            medicalRecord.prescriptions && 
            medicalRecord.prescriptions.length > 0;
        const hasService = medicalRecord && !!medicalRecord.serviceId;
        
        if (hasPrescriptions || hasService) {
          // Check booking status
          const booking = await bookingsCollection.findOne({
            _id: new ObjectId(invoice.bookingId)
          });
          
          if (booking && booking.status === "completed") {
            validPendingCount++;
          }
        }
      }
    }

    // Upcoming Appointments count (bookings dengan status confirmed yang appointmentTime > sekarang)
    const now = new Date();
    const upcomingAppointments = await bookingsCollection.countDocuments({
      patientId: patientObjectId,
      status: "confirmed",
      appointmentTime: { $gt: now }
    });

    // ✅ 4. Get Pending Invoice (terbaru yang valid)
    const pendingInvoice = await invoicesCollection.findOne(
      {
        patientId: patientObjectId,
        status: "pending"
      },
      {
        sort: { dueDate: 1 } // Sort by due date ascending (terdekat dulu)
      }
    );

    let pendingInvoiceData = null;
    if (pendingInvoice) {
      // ✅ Validasi: Pastikan medical record ada dan lengkap
      const medicalRecord = pendingInvoice.medicalRecordId
        ? await medicalRecordsCollection.findOne({
            _id: new ObjectId(pendingInvoice.medicalRecordId)
          })
        : null;

      // ✅ Validasi: Pastikan booking sudah completed
      const booking = pendingInvoice.bookingId
        ? await bookingsCollection.findOne({
            _id: new ObjectId(pendingInvoice.bookingId)
          })
        : null;

      // ✅ Hanya return invoice jika:
      // 1. Medical record ada
      // 2. Medical record punya prescription ATAU service (lengkap)
      // 3. Booking status = completed
      const hasPrescriptions = medicalRecord && 
        medicalRecord.prescriptions && 
        medicalRecord.prescriptions.length > 0;
      const hasService = medicalRecord && !!medicalRecord.serviceId;
      const hasValidMedicalRecord = hasPrescriptions || hasService;

      const isBookingCompleted = booking && booking.status === "completed";

      if (hasValidMedicalRecord && isBookingCompleted) {
        // Get doctor info
        const doctor = await DoctorModel.getDoctorById(pendingInvoice.doctorId);

        // Format medication receipt dari medical record (jika ada prescriptions)
        const medicationReceipt = (medicalRecord.prescriptions && medicalRecord.prescriptions.length > 0)
          ? medicalRecord.prescriptions.map((prescription: any) => ({
              name: prescription.medicineName,
              dosage: prescription.dosage,
              quantity: prescription.quantity,
              price: prescription.unitPrice * prescription.quantity
            }))
          : [];

        // Calculate days until due
        const dueDate = new Date(pendingInvoice.dueDate);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        pendingInvoiceData = {
          invoiceId: pendingInvoice._id.toString(),
          invoiceNumber: pendingInvoice.invoiceNumber,
          date: pendingInvoice.date,
          dueDate: pendingInvoice.dueDate,
          status: pendingInvoice.status,
          items: pendingInvoice.items || [],
          subtotal: pendingInvoice.subtotal,
          total: pendingInvoice.total,
          medicationReceipt: {
            medicines: medicationReceipt
          },
          doctor: doctor ? {
            doctorId: doctor._id.toString(),
            name: doctor.name,
            specialization: doctor.specialization,
            clinic: doctor.clinic,
            rating: doctor.averageRating || 0,
            totalReviews: doctor.totalReviews || 0,
            image: doctor.image
          } : null,
          daysUntilDue: Math.max(0, daysUntilDue),
          bookingId: pendingInvoice.bookingId?.toString(),
          medicalRecordId: pendingInvoice.medicalRecordId?.toString()
        };
      }
    }

    // ✅ 5. Get Recommended Doctors (top 4 by rating)
    const doctorsCollection = db.collection("doctors");
    const recommendedDoctors = await doctorsCollection
      .find({
        isActive: true
      })
      .sort({ averageRating: -1, totalReviews: -1 }) // Sort by rating descending
      .limit(4)
      .toArray();

    const recommendedDoctorsData = await Promise.all(
      recommendedDoctors.map(async (doctor) => {
        // Get default schedule
        const defaultSchedule = await DoctorScheduleModel.getDefaultSchedule(
          doctor._id.toString()
        );

        return {
          doctorId: doctor._id.toString(),
          name: doctor.name,
          specialization: doctor.specialization,
          clinic: doctor.clinic,
          schedule: defaultSchedule?.timeRange || "09:00 - 17:00",
          rating: doctor.averageRating || 0,
          totalReviews: doctor.totalReviews || 0,
          image: doctor.image,
          consultationFee: doctor.consultationFee || 0,
          isTopRated: (doctor.averageRating || 0) >= 4.5
        };
      })
    );

    // ✅ 6. Return response
    return NextResponse.json({
      summary: {
        activeQueue,
        pendingPayments: validPendingCount,
        upcomingAppointments
      },
      pendingInvoice: pendingInvoiceData,
      recommendedDoctors: recommendedDoctorsData
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}


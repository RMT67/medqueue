import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import MedicalRecordModel from "@/db/models/MedicalRecord";
import DoctorModel from "@/db/models/Doctor";
import BookingModel from "@/db/models/Booking";
import ServiceModel from "@/db/models/Service";
import MedicineModel from "@/db/models/Medicine";

export async function GET(
  req: Request,
  { params }: { params: { recordId: string } }
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
    const recordId = params.recordId;

    // ✅ 3. Get medical record
    const record = await MedicalRecordModel.getById(recordId);

    if (!record) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    // ✅ 4. Verify ownership
    if (record.patientId.toString() !== patientId) {
      return NextResponse.json(
        { error: "Forbidden - You can only access your own records" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const doctorsCollection = db.collection("doctors");
    const bookingsCollection = db.collection("bookings");

    // ✅ 5. Get doctor info
    const doctor = await doctorsCollection.findOne({
      _id: new ObjectId(record.doctorId)
    });

    // ✅ 6. Get booking info
    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(record.bookingId)
    });

    // ✅ 7. Get service info from Services collection
    let serviceInfo = null;
    if (record.serviceId) {
      const service = await ServiceModel.getById(record.serviceId);
      if (service) {
        serviceInfo = {
          serviceId: service._id?.toString(),
          code: service.code,
          name: service.name,
          category: service.category,
          description: service.description,
          price: service.price,
          currency: service.currency,
          duration: service.duration
        };
      } else if (record.serviceName) {
        // Fallback to snapshot data
        serviceInfo = {
          serviceId: record.serviceId,
          name: record.serviceName,
          price: record.servicePrice || 0
        };
      }
    }

    // ✅ 8. Enrich prescriptions with medicine info from Medicines collection
    const enrichedPrescriptions = await Promise.all(
      (record.prescriptions || []).map(async (prescription: any) => {
        if (prescription.medicineId) {
          const medicine = await MedicineModel.getById(prescription.medicineId);
          if (medicine) {
            return {
              ...prescription,
              medicine: {
                medicineId: medicine._id?.toString(),
                code: medicine.code,
                name: medicine.name,
                category: medicine.category,
                unit: medicine.unit,
                packaging: medicine.packaging,
                currentPrice: medicine.price,
                currentPackPrice: medicine.packaging?.packPrice,
                imageUrl: medicine.imageUrl,
                manufacturer: medicine.manufacturer
              }
            };
          }
        }
        return prescription;
      })
    );

    // ✅ 9. Format date
    const recordDate = new Date(record.createdAt);
    const formattedDate = recordDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    // ✅ 10. Format prescription
    const formatPrescription = (prescriptions: any[]): string => {
      if (!prescriptions || prescriptions.length === 0) {
        return "No medication needed";
      }
      
      return prescriptions
        .map((prescription) => {
          const dosage = prescription.dosage || "";
          const quantity = prescription.quantity || 1;
          return `${prescription.medicineName}${dosage ? ` - ${dosage}` : ""}${quantity > 1 ? ` • Qty: ${quantity}` : ""}`;
        })
        .join(", ");
    };

    return NextResponse.json({
      recordId: record._id?.toString(),
      date: record.createdAt,
      formattedDate: formattedDate,
      type: record.type || serviceInfo?.category || "Consultation",
      service: serviceInfo, // ✅ Include service info
      doctor: doctor ? {
        doctorId: doctor._id.toString(),
        name: doctor.name,
        specialization: doctor.specialization,
        clinic: doctor.clinic,
        image: doctor.image,
        rating: doctor.averageRating || 0,
        totalReviews: doctor.totalReviews || 0
      } : null,
      diagnosis: record.diagnosis,
      prescription: formatPrescription(record.prescriptions || []),
      prescriptions: enrichedPrescriptions, // ✅ Full array with medicine info
      notes: record.notes || "",
      attachments: record.attachments || [],
      booking: booking ? {
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        appointmentTime: booking.appointmentTime,
        complaint: booking.complaint,
        status: booking.status
      } : null
    });
  } catch (error) {
    console.error("Error fetching medical record detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch medical record" },
      { status: 500 }
    );
  }
}


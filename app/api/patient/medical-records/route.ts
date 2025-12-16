import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import MedicalRecordModel from "@/db/models/MedicalRecord";
import DoctorModel from "@/db/models/Doctor";
import BookingModel from "@/db/models/Booking";
import ServiceModel from "@/db/models/ServiceModel";
import MedicineModel from "@/db/models/Medicine";

// Helper function to format prescription as string
function formatPrescription(prescriptions: any[]): string {
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
}

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

    // ✅ 3. Get query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "All";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // ✅ 4. Build query
    const query: any = { patientId: patientObjectId };

    // Filter by type
    if (type && type !== "All") {
      query.type = type;
    }

    // Note: Search for doctor name will be done after join with doctors collection
    // Search filter for diagnosis and notes only
    if (search) {
      query.$or = [
        { diagnosis: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    // ✅ 5. Get medical records
    const medicalRecordsCollection = db.collection("medicalrecords");
    const bookingsCollection = db.collection("bookings");
    const doctorsCollection = db.collection("doctors");

    const records = await medicalRecordsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // ✅ 6. Enrich records with doctor, service, medicine, and booking info
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        // Get doctor info
        const doctor = await doctorsCollection.findOne({
          _id: new ObjectId(record.doctorId)
        });

        // Get booking info
        const booking = await bookingsCollection.findOne({
          _id: new ObjectId(record.bookingId)
        });

        // ✅ Get service info from Services collection
        let serviceInfo = null;
        if (record.serviceId) {
          const service = await ServiceModel.getServiceById(record.serviceId);
          if (service) {
            serviceInfo = {
              serviceId: service._id?.toString(),
              name: service.name,
              category: service.category,
              price: service.price,
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

        // ✅ Enrich prescriptions with medicine info from Medicines collection
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
                    currentPackPrice: medicine.packaging?.packPrice
                  }
                };
              }
            }
            return prescription;
          })
        );

        // Format prescription
        const prescriptionString = formatPrescription(record.prescriptions || []);

        // Format date
        const recordDate = new Date(record.createdAt);
        const formattedDate = recordDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });

        return {
          recordId: record._id.toString(),
          date: record.createdAt,
          formattedDate: formattedDate,
          type: record.type || serviceInfo?.category || "Consultation",
          service: serviceInfo, // ✅ Include service info
          doctor: doctor ? {
            doctorId: doctor._id.toString(),
            name: doctor.name,
            specialization: doctor.specialization,
            clinic: doctor.clinic,
            image: doctor.image
          } : null,
          diagnosis: record.diagnosis,
          prescription: prescriptionString, // Formatted string for quick view
          prescriptions: enrichedPrescriptions, // ✅ Full array with medicine info for expanded view
          notes: record.notes || "",
          attachments: record.attachments || [],
          bookingId: record.bookingId.toString(),
          bookingNumber: booking?.bookingNumber || ""
        };
      })
    );

    // ✅ 7. Apply search filter for doctor name (after join)
    let filteredRecords = enrichedRecords;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRecords = enrichedRecords.filter((record) => {
        return (
          record.doctor?.name.toLowerCase().includes(searchLower) ||
          record.diagnosis.toLowerCase().includes(searchLower) ||
          record.type.toLowerCase().includes(searchLower) ||
          record.notes.toLowerCase().includes(searchLower)
        );
      });
    }

    // ✅ 8. Get total count for pagination
    const total = await medicalRecordsCollection.countDocuments(query);

    return NextResponse.json({
      medicalRecords: filteredRecords,
      total: filteredRecords.length,
      hasMore: offset + filteredRecords.length < total
    });
  } catch (error) {
    console.error("Error fetching medical records:", error);
    return NextResponse.json(
      { error: "Failed to fetch medical records" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import InvoiceModel from "@/db/models/Invoice";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    // ✅ 1. Authentication - Check if user is admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, role } = verifyToken(authHeader);
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access only" },
        { status: 403 }
      );
    }

    // ✅ 2. Get invoice ID from params
    const { invoiceId } = await params;
    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // ✅ 3. Get invoice from database
    const invoice = await InvoiceModel.getById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // ✅ 4. Get patient and doctor info
    const db = await getDb();
    const usersCollection = db.collection("users");
    const doctorsCollection = db.collection("doctors");
    const bookingsCollection = db.collection("bookings");

    const [patient, doctor, booking] = await Promise.all([
      usersCollection.findOne({ _id: invoice.patientId, role: "patient" }),
      doctorsCollection.findOne({ _id: new ObjectId(invoice.doctorId) }),
      bookingsCollection.findOne({ _id: invoice.bookingId }),
    ]);

    // ✅ 5. Format items to match frontend expected format
    const formattedItems = (invoice.items || []).map((item: any) => {
      // Check if item already has the expected format
      if (item.type === "service" && item.serviceId) {
        return item; // Already formatted
      }
      if (item.type === "medicine" && item.medicineId) {
        return item; // Already formatted
      }

      // Legacy format conversion
      if (item.type === "consultation" || item.type === "service") {
        return {
          type: "service" as const,
          serviceId: item.serviceId || new ObjectId(),
          serviceCode: item.serviceCode || "SRV-001",
          serviceName: item.name || item.serviceName || "Consultation",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          total: item.total || 0,
        };
      } else {
        return {
          type: "medicine" as const,
          medicineId: item.medicineId || new ObjectId(),
          medicineCode: item.medicineCode || "MED-001",
          medicineName: item.name || item.medicineName || "Medicine",
          quantity: item.quantity || 1,
          unit: item.unit || "unit",
          unitPrice: item.unitPrice || 0,
          total: item.total || 0,
          dosage: item.dosage || "",
        };
      }
    });

    // ✅ 6. Format response
    const response = {
      _id: invoice._id?.toString(),
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId.toString(),
      doctorId: invoice.doctorId.toString(),
      bookingId: invoice.bookingId.toString(),
      medicalRecordId: invoice.medicalRecordId.toString(),
      date: invoice.date instanceof Date ? invoice.date.toISOString() : invoice.date,
      dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString() : invoice.dueDate,
      items: formattedItems,
      subtotal: invoice.subtotal || 0,
      total: invoice.total || 0,
      paymentStatus: invoice.status || "pending", // Map status to paymentStatus
      paymentMethod: invoice.paymentMethod || null,
      paymentReference: invoice.paymentReference || null,
      paidAt: invoice.paidAt
        ? invoice.paidAt instanceof Date
          ? invoice.paidAt.toISOString()
          : invoice.paidAt
        : null,
      createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : invoice.createdAt,
      updatedAt: invoice.updatedAt instanceof Date ? invoice.updatedAt.toISOString() : invoice.updatedAt,
      // Additional info for display
      patient: {
        _id: patient?._id.toString(),
        name: patient?.fullName || patient?.name || "Unknown Patient",
        email: patient?.email,
        phone: patient?.phoneNumber || patient?.phone,
      },
      doctor: {
        _id: doctor?._id.toString(),
        name: doctor?.name || "Unknown Doctor",
        specialization: doctor?.specialization,
      },
      booking: booking
        ? {
            _id: booking._id.toString(),
            appointmentTime: booking.appointmentTime,
            status: booking.status,
          }
        : null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invoice",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


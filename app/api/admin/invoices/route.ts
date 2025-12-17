import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import InvoiceModel from "@/db/models/Invoice";

export async function GET(req: NextRequest) {
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

    // ✅ 2. Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending, paid, cancelled
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = parseInt(searchParams.get("skip") || "0");

    // ✅ 3. Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // ✅ 4. Get invoices from database
    const db = await getDb();
    const invoicesCollection = db.collection("invoices");

    // Get invoices with patient and doctor info
    const invoices = await invoicesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // ✅ 5. Get patient and doctor info for each invoice
    const usersCollection = db.collection("users");
    const doctorsCollection = db.collection("doctors");

    const invoicesWithDetails = await Promise.all(
      invoices.map(async (invoice) => {
        // Get patient info from users collection (patients are users with role "patient")
        const patient = await usersCollection.findOne({
          _id: invoice.patientId,
          role: "patient",
        });

        // Get doctor info
        const doctor = await doctorsCollection.findOne({
          _id: new ObjectId(invoice.doctorId),
        });

        // Format items to match frontend expected format
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

        return {
          _id: invoice._id.toString(),
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
          patientName: patient?.fullName || patient?.name || "Unknown Patient",
          doctorName: doctor?.name || "Unknown Doctor",
        };
      })
    );

    // ✅ 6. Get total count for pagination
    const totalCount = await invoicesCollection.countDocuments(query);

    return NextResponse.json(
      {
        invoices: invoicesWithDetails,
        total: totalCount,
        limit,
        skip,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


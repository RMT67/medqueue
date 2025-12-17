import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import InvoiceModel from "@/db/models/Invoice";
import MedicalRecordModel from "@/db/models/MedicalRecord";

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

    // ✅ 2. Get query parameters
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const status = searchParams.get("status") || "pending";

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const patientObjectId = new ObjectId(userId);
    const invoicesCollection = db.collection("invoices");

    // ✅ 3. Get invoice
    // If status is "paid", try to find with paid status first, but also allow pending as fallback
    // This handles cases where webhook hasn't processed yet
    let invoice = await invoicesCollection.findOne({
      bookingId: new ObjectId(bookingId),
      patientId: patientObjectId,
      status: status
    });

    // If not found and status is "paid", try to find with any status (webhook might not have updated yet)
    if (!invoice && status === "paid") {
      invoice = await invoicesCollection.findOne({
        bookingId: new ObjectId(bookingId),
        patientId: patientObjectId,
      });
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // ✅ 4. Get medical record for medication receipt
    let medicationReceipt = null;
    if (invoice.medicalRecordId) {
      const medicalRecord = await MedicalRecordModel.getById(invoice.medicalRecordId.toString());
      if (medicalRecord && medicalRecord.prescriptions && medicalRecord.prescriptions.length > 0) {
        medicationReceipt = {
          medicines: medicalRecord.prescriptions.map((prescription: any) => ({
            name: prescription.medicineName,
            dosage: prescription.dosage || "",
            quantity: prescription.quantity,
            price: prescription.unitPrice * prescription.quantity
          }))
        };
      }
    }

    // ✅ 5. Format date
    const invoiceDate = new Date(invoice.date);
    const formattedDate = invoiceDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    // ✅ 6. Return response
    return NextResponse.json({
      invoiceId: invoice._id?.toString(),
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      formattedDate: formattedDate,
      status: invoice.status,
      items: invoice.items || [],
      subtotal: invoice.subtotal,
      total: invoice.total,
      medicationReceipt: medicationReceipt,
      dueDate: invoice.dueDate,
      paymentMethod: invoice.paymentMethod || null,
      paidAt: invoice.paidAt || null
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}


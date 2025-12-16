import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth-helper";
import InvoiceModel from "@/db/models/Invoice";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
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

    const { invoiceId } = await params;
    const body = await req.json().catch(() => ({}));
    const { paymentMethod = "manual" } = body;

    // ✅ 2. Get invoice and verify ownership
    const invoice = await InvoiceModel.getById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (invoice.patientId.toString() !== userId) {
      return NextResponse.json(
        { error: "Forbidden - Invoice does not belong to patient" },
        { status: 403 }
      );
    }

    // ✅ 3. Validate invoice status
    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot pay a cancelled invoice" },
        { status: 400 }
      );
    }

    // ✅ 4. Update invoice status to paid
    const updatedInvoice = await InvoiceModel.update(invoiceId, {
      status: "paid",
      paymentMethod: paymentMethod,
      paidAt: new Date(),
    });

    // ✅ 5. Return success response
    return NextResponse.json(
      {
        message: "Payment processed successfully",
        invoice: {
          invoiceId: updatedInvoice?._id?.toString(),
          invoiceNumber: updatedInvoice?.invoiceNumber,
          status: updatedInvoice?.status,
          paidAt: updatedInvoice?.paidAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}


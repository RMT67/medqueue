import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth-helper";
import { getDb } from "@/db/config/mongodb";

export const runtime = "nodejs";

const SNAP_BASE_URL =
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = verifyToken(authHeader);
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Forbidden - Patient access only" },
        { status: 403 }
      );
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!serverKey || !clientKey) {
      return NextResponse.json(
        { error: "Midtrans keys are not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { invoiceId } = body || {};
    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const invoicesCollection = db.collection("invoices");
    const invoice = await invoicesCollection.findOne({
      _id: new ObjectId(invoiceId),
      patientId: new ObjectId(userId),
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status !== "pending") {
      return NextResponse.json(
        { error: "Invoice is not pending" },
        { status: 400 }
      );
    }

    const orderId =
      invoice.invoiceNumber ||
      `INV-${invoice._id?.toString() || new ObjectId().toString()}`;

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: invoice.total,
      },
    };

    const midtransRes = await fetch(SNAP_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString(
          "base64"
        )}`,
      },
      body: JSON.stringify(payload),
    });

    if (!midtransRes.ok) {
      const errText = await midtransRes.text();
      console.error("Midtrans error:", errText);
      return NextResponse.json(
        { error: "Failed to create Snap token" },
        { status: 502 }
      );
    }

    const midtransData = await midtransRes.json();

    await invoicesCollection.updateOne(
      { _id: new ObjectId(invoiceId) },
      {
        $set: {
          snapToken: midtransData.token,
          snapRedirectUrl: midtransData.redirect_url,
          snapOrderId: orderId,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        token: midtransData.token,
        redirect_url: midtransData.redirect_url,
        order_id: orderId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating snap token:", error);
    return NextResponse.json(
      { error: "Failed to create snap token" },
      { status: 500 }
    );
  }
}

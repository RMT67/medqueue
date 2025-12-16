import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import InvoiceModel from "@/db/models/Invoice";
import ServiceModel from "@/db/models/ServiceModel";
import MedicineModel from "@/db/models/Medicine";
import { generateInvoiceNumber, calculateDueDate } from "@/lib/invoice-utils";

interface GenerateInvoiceRequest {
  medicalRecordId: string;
  bookingId: string;
}

export async function POST(req: Request) {
  try {
    const body: GenerateInvoiceRequest = await req.json();
    const { medicalRecordId, bookingId } = body;

    if (!medicalRecordId || !bookingId) {
      return NextResponse.json(
        { error: "medicalRecordId and bookingId are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const medicalRecordsCollection = db.collection("medicalrecords");
    const bookingsCollection = db.collection("bookings");
    const invoicesCollection = db.collection("invoices");

    // バ. 1. Get Medical Record
    const medicalRecord = await medicalRecordsCollection.findOne({
      _id: new ObjectId(medicalRecordId),
    });

    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    // バ. 2. Validate: Pastikan medical record punya prescriptions atau service
    if (
      (!medicalRecord.prescriptions ||
        medicalRecord.prescriptions.length === 0) &&
      !medicalRecord.serviceId
    ) {
      return NextResponse.json(
        {
          error:
            "Medical record must have service or prescriptions to generate invoice",
        },
        { status: 400 }
      );
    }

    // バ. 3. Get Booking
    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // バ. 4. Validate: Pastikan booking sudah completed
    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "Booking must be completed to generate invoice" },
        { status: 400 }
      );
    }

    // バ. 5. Check: Apakah invoice sudah ada (idempotent guard)
    const existingInvoiceByMR = await InvoiceModel.getByMedicalRecordId(
      medicalRecordId
    );
    const existingInvoiceByBooking = await invoicesCollection.findOne({
      bookingId: new ObjectId(bookingId),
      status: { $in: ["pending", "paid"] },
    });
    const existingInvoice = existingInvoiceByMR || existingInvoiceByBooking;
    if (existingInvoice) {
      return NextResponse.json(
        {
          error: "Invoice already exists for this booking/medical record",
          invoiceId: existingInvoice._id?.toString(),
          invoiceNumber: existingInvoice.invoiceNumber,
        },
        { status: 409 } // Conflict
      );
    }

    // バ. 6. Calculate Invoice Items
    const items: Array<{
      type: "consultation" | "medicine" | "service";
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];

    // バ. 7. Add Service (Consultation/Check-up/etc) - dari Services collection (no doctor fee fallback)
    let hasServiceCharge = false;
    if (medicalRecord.serviceId) {
      const service = await ServiceModel.getServiceById(
        medicalRecord.serviceId
      );
      if (service && service.isActive) {
        const servicePrice = service.price;
        items.push({
          type: "service",
          name: service.name,
          quantity: 1,
          unitPrice: servicePrice,
          total: servicePrice,
        });
        hasServiceCharge = true;
      } else if (medicalRecord.servicePrice) {
        items.push({
          type: "service",
          name: medicalRecord.serviceName || "Medical Service",
          quantity: 1,
          unitPrice: medicalRecord.servicePrice,
          total: medicalRecord.servicePrice,
        });
        hasServiceCharge = true;
      } else {
        return NextResponse.json(
          { error: "Service not found or inactive for this medical record" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Medical record must include serviceId/service snapshot before generating invoice",
        },
        { status: 400 }
      );
    }

    // バ. 8. Add Medicines from prescriptions - dari Medicines collection
    if (medicalRecord.prescriptions && medicalRecord.prescriptions.length > 0) {
      for (const prescription of medicalRecord.prescriptions) {
        if (prescription.medicineId) {
          // Get medicine from Medicines collection
          const medicine = await MedicineModel.getById(prescription.medicineId);

          if (medicine && medicine.isActive) {
            // バ. Use price from Medicines collection (packPrice if quantity is per pack)
            let unitPrice = prescription.unitPrice; // Default to snapshot price

            // If quantity matches pack unit, use packPrice
            if (
              medicine.packaging &&
              prescription.quantity >= medicine.packaging.unitPerPack
            ) {
              const packsNeeded = Math.ceil(
                prescription.quantity / medicine.packaging.unitPerPack
              );
              unitPrice = medicine.packaging.packPrice * packsNeeded;
            } else {
              // Use per unit price
              unitPrice = medicine.price * prescription.quantity;
            }

            const medicineTotal = unitPrice;

            items.push({
              type: "medicine",
              name: medicine.name, // Use current name from collection
              quantity: prescription.quantity,
              unitPrice: unitPrice / prescription.quantity, // Per unit price
              total: medicineTotal,
            });
          } else {
            // バ. Fallback: Use snapshot data if medicine not found
            const medicineTotal =
              prescription.unitPrice * prescription.quantity;
            items.push({
              type: "medicine",
              name: prescription.medicineName,
              quantity: prescription.quantity,
              unitPrice: prescription.unitPrice,
              total: medicineTotal,
            });
          }
        } else {
          // バ. Fallback: Use snapshot data if no medicineId
          const medicineTotal =
            prescription.unitPrice * prescription.quantity;
          items.push({
            type: "medicine",
            name: prescription.medicineName,
            quantity: prescription.quantity,
            unitPrice: prescription.unitPrice,
            total: medicineTotal,
          });
        }
      }
    }

    // Pastikan ada service charge
    if (!hasServiceCharge) {
      return NextResponse.json(
        { error: "Service charge is required to generate invoice" },
        { status: 400 }
      );
    }

    // バ. 9. Calculate Totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal; // No tax for now, bisa ditambah tax jika perlu

    // バ. 10. Generate Invoice Number
    const invoiceNumber = await generateInvoiceNumber();

    // バ. 11. Set Dates
    const invoiceDate = new Date();
    const dueDate = calculateDueDate(invoiceDate, 7); // Due in 7 days

    // バ. 12. Create Invoice
    const invoice = await InvoiceModel.create({
      invoiceNumber,
      patientId: new ObjectId(booking.patientId),
      doctorId: booking.doctorId,
      bookingId: new ObjectId(bookingId),
      medicalRecordId: new ObjectId(medicalRecordId),
      date: invoiceDate,
      dueDate: dueDate,
      items: items,
      subtotal: subtotal,
      total: total,
      status: "pending",
    });

    return NextResponse.json(
      {
        message: "Invoice generated successfully",
        invoice: {
          invoiceId: invoice._id?.toString(),
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          dueDate: invoice.dueDate,
          status: invoice.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import InvoiceModel from "@/db/models/Invoice";
import BookingModel from "@/db/models/Booking";
import DoctorModel from "@/db/models/Doctor";
import MedicalRecordModel from "@/db/models/MedicalRecord";
import ServiceModel from "@/db/models/Service";
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

    // ✅ 1. Get Medical Record
    const medicalRecord = await medicalRecordsCollection.findOne({
      _id: new ObjectId(medicalRecordId)
    });

    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    // ✅ 2. Validate: Pastikan medical record punya prescriptions atau service
    if ((!medicalRecord.prescriptions || medicalRecord.prescriptions.length === 0) && !medicalRecord.serviceId) {
      return NextResponse.json(
        { error: "Medical record must have service or prescriptions to generate invoice" },
        { status: 400 }
      );
    }

    // ✅ 3. Get Booking
    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId)
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // ✅ 4. Validate: Pastikan booking sudah completed
    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "Booking must be completed to generate invoice" },
        { status: 400 }
      );
    }

    // ✅ 5. Check: Apakah invoice sudah ada untuk medical record ini
    const existingInvoice = await InvoiceModel.getByMedicalRecordId(medicalRecordId);
    if (existingInvoice) {
      return NextResponse.json(
        { 
          error: "Invoice already exists for this medical record",
          invoiceId: existingInvoice._id?.toString(),
          invoiceNumber: existingInvoice.invoiceNumber
        },
        { status: 409 } // Conflict
      );
    }

    // ✅ 6. Calculate Invoice Items
    const items: Array<{
      type: "consultation" | "medicine" | "service";
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];

    // ✅ 7. Add Service (Consultation/Check-up/etc) - dari Services collection
    if (medicalRecord.serviceId) {
      const service = await ServiceModel.getById(medicalRecord.serviceId);
      if (service && service.isActive) {
        // Use price from Services collection
        const servicePrice = service.price;
        items.push({
          type: "service",
          name: service.name,
          quantity: 1,
          unitPrice: servicePrice,
          total: servicePrice
        });
      } else if (medicalRecord.servicePrice) {
        // Fallback to snapshot price if service not found
        items.push({
          type: "service",
          name: medicalRecord.serviceName || "Medical Service",
          quantity: 1,
          unitPrice: medicalRecord.servicePrice,
          total: medicalRecord.servicePrice
        });
      }
    } else {
      // ✅ Fallback: Use doctor consultation fee if no serviceId
      const doctor = await DoctorModel.getDoctorById(booking.doctorId);
      const consultationFee = doctor?.consultationFee || 0;
      if (consultationFee > 0) {
        items.push({
          type: "consultation",
          name: "Consultation Fee",
          quantity: 1,
          unitPrice: consultationFee,
          total: consultationFee
        });
      }
    }

    // ✅ 8. Add Medicines from prescriptions - dari Medicines collection
    if (medicalRecord.prescriptions && medicalRecord.prescriptions.length > 0) {
      for (const prescription of medicalRecord.prescriptions) {
        if (prescription.medicineId) {
          // Get medicine from Medicines collection
          const medicine = await MedicineModel.getById(prescription.medicineId);
          
          if (medicine && medicine.isActive) {
            // ✅ Use price from Medicines collection (packPrice if quantity is per pack)
            let unitPrice = prescription.unitPrice; // Default to snapshot price
            
            // If quantity matches pack unit, use packPrice
            if (medicine.packaging && prescription.quantity >= medicine.packaging.unitPerPack) {
              const packsNeeded = Math.ceil(prescription.quantity / medicine.packaging.unitPerPack);
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
              total: medicineTotal
            });
          } else {
            // ✅ Fallback: Use snapshot data if medicine not found
            const medicineTotal = prescription.unitPrice * prescription.quantity;
            items.push({
              type: "medicine",
              name: prescription.medicineName,
              quantity: prescription.quantity,
              unitPrice: prescription.unitPrice,
              total: medicineTotal
            });
          }
        } else {
          // ✅ Fallback: Use snapshot data if no medicineId
          const medicineTotal = prescription.unitPrice * prescription.quantity;
          items.push({
            type: "medicine",
            name: prescription.medicineName,
            quantity: prescription.quantity,
            unitPrice: prescription.unitPrice,
            total: medicineTotal
          });
        }
      }
    }

    // ✅ 9. Calculate Totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal; // No tax for now, bisa ditambah tax jika perlu

    // ✅ 10. Generate Invoice Number
    const invoiceNumber = await generateInvoiceNumber();

    // ✅ 11. Set Dates
    const invoiceDate = new Date();
    const dueDate = calculateDueDate(invoiceDate, 7); // Due in 7 days

    // ✅ 12. Create Invoice
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
      status: "pending"
    });

    return NextResponse.json(
      {
        message: "Invoice generated successfully",
        invoice: {
          invoiceId: invoice._id?.toString(),
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          dueDate: invoice.dueDate,
          status: invoice.status
        }
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


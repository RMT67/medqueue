import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import { emitQueueStatusChange } from "@/lib/socket-server";
import InvoiceModel from "@/db/models/Invoice";
import ServiceModel from "@/db/models/ServiceModel";
import MedicineModel from "@/db/models/Medicine";
import DoctorModel from "@/db/models/Doctor";
import { generateInvoiceNumber, calculateDueDate } from "@/lib/invoice-utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
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

    const { bookingId } = await params;
    const db = await getDb();
    const patientObjectId = new ObjectId(userId);
    const bookingsCollection = db.collection("bookings");

    // ✅ 2. Get booking and verify ownership
    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId),
      patientId: patientObjectId
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to patient" },
        { status: 404 }
      );
    }

    // ✅ 3. Validate: Can only complete in-progress bookings
    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Appointment is already completed" },
        { status: 400 }
      );
    }

    if (booking.status !== "in-progress") {
      return NextResponse.json(
        { error: "Can only complete in-progress appointments" },
        { status: 400 }
      );
    }

    // ✅ 4. Update booking status
    const now = new Date();
    await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "completed",
          completedAt: now,
          updatedAt: now
        }
      }
    );

    // ✅ 5. Get updated booking
    const updatedBooking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId)
    });

    // ✅ 6. Auto-generate invoice if medical record exists
    let invoiceGenerated = false;
    let invoiceError = null;
    
    try {
      const medicalRecordsCollection = db.collection("medicalrecords");
      const medicalRecord = await medicalRecordsCollection.findOne({
        bookingId: new ObjectId(bookingId),
        patientId: patientObjectId
      });

      if (medicalRecord) {
        // Validate: Medical record must have prescriptions or service
        const hasPrescriptions = medicalRecord.prescriptions && medicalRecord.prescriptions.length > 0;
        const hasService = !!medicalRecord.serviceId;

        if (hasPrescriptions || hasService) {
          // Check if invoice already exists
          const existingInvoice = await InvoiceModel.getByMedicalRecordId(medicalRecord._id.toString());
          
          if (!existingInvoice) {
            // Calculate Invoice Items
            const items: Array<{
              type: "consultation" | "medicine" | "service";
              name: string;
              quantity: number;
              unitPrice: number;
              total: number;
            }> = [];

            // Add Service (Consultation/Check-up/etc) - dari Services collection
            if (medicalRecord.serviceId) {
              const service = await ServiceModel.getServiceById(medicalRecord.serviceId);
              if (service && service.isActive) {
                items.push({
                  type: "service",
                  name: service.name,
                  quantity: 1,
                  unitPrice: service.price,
                  total: service.price
                });
              } else if (medicalRecord.servicePrice) {
                items.push({
                  type: "service",
                  name: medicalRecord.serviceName || "Medical Service",
                  quantity: 1,
                  unitPrice: medicalRecord.servicePrice,
                  total: medicalRecord.servicePrice
                });
              }
            } else {
              // Fallback: Use doctor consultation fee if no serviceId
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

            // Add Medicines from prescriptions - dari Medicines collection
            if (medicalRecord.prescriptions && medicalRecord.prescriptions.length > 0) {
              for (const prescription of medicalRecord.prescriptions) {
                if (prescription.medicineId) {
                  const medicine = await MedicineModel.getById(prescription.medicineId);
                  
                  if (medicine && medicine.isActive) {
                    let unitPrice = prescription.unitPrice;
                    
                    if (medicine.packaging && prescription.quantity >= medicine.packaging.unitPerPack) {
                      const packsNeeded = Math.ceil(prescription.quantity / medicine.packaging.unitPerPack);
                      unitPrice = medicine.packaging.packPrice * packsNeeded;
                    } else {
                      unitPrice = medicine.price * prescription.quantity;
                    }
                    
                    const medicineTotal = unitPrice;
                    
                    items.push({
                      type: "medicine",
                      name: medicine.name,
                      quantity: prescription.quantity,
                      unitPrice: unitPrice / prescription.quantity,
                      total: medicineTotal
                    });
                  } else {
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

            // Calculate Totals
            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const total = subtotal;

            // Generate Invoice Number
            const invoiceNumber = await generateInvoiceNumber();

            // Set Dates
            const invoiceDate = new Date();
            const dueDate = calculateDueDate(invoiceDate, 7);

            // Create Invoice
            await InvoiceModel.create({
              invoiceNumber,
              patientId: patientObjectId,
              doctorId: booking.doctorId,
              bookingId: new ObjectId(bookingId),
              medicalRecordId: new ObjectId(medicalRecord._id),
              date: invoiceDate,
              dueDate: dueDate,
              items: items,
              subtotal: subtotal,
              total: total,
              status: "pending"
            });

            invoiceGenerated = true;
            console.log(`✅ Invoice auto-generated for booking ${bookingId}`);
          } else {
            console.log(`ℹ️ Invoice already exists for medical record ${medicalRecord._id.toString()}`);
          }
        } else {
          console.log(`ℹ️ Medical record exists but has no prescriptions or service for booking ${bookingId}`);
        }
      } else {
        console.log(`ℹ️ No medical record found for booking ${bookingId} - invoice will be generated later`);
      }
    } catch (error) {
      invoiceError = error;
      console.error("⚠️ Error auto-generating invoice (booking still completed):", error);
      // Don't fail the request if invoice generation fails
    }

    // ✅ 7. Emit socket event for status change
    emitQueueStatusChange(bookingId, {
      queueStatus: "completed"
    });

    return NextResponse.json({
      message: "Appointment marked as completed successfully",
      booking: {
        bookingId: updatedBooking?._id.toString(),
        status: updatedBooking?.status,
        completedAt: updatedBooking?.completedAt
      },
      invoice: invoiceGenerated ? {
        generated: true,
        message: "Invoice generated automatically"
      } : invoiceError ? {
        generated: false,
        message: "Invoice generation skipped (will be generated later)"
      } : {
        generated: false,
        message: "No medical record found - invoice will be generated when medical record is created"
      }
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    return NextResponse.json(
      { error: "Failed to complete appointment" },
      { status: 500 }
    );
  }
}


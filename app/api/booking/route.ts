// create logic for booking an appointment
import { NextResponse } from "next/server";
import Booking from "@/db/models/Booking";
import { BookingType } from "@/types/bookingType";
import ScheduleModel from "@/db/models/Schedule";
import DoctorModel from "@/db/models/Doctor";
import { DoctorScheduleType } from "@/types/doctorScheduleType";
import { Doctor } from "@/types/docterTypes";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth-helper";
import { getDb } from "@/db/config/mongodb";

interface PatientData {
  _id: ObjectId;
  fullName: string;
  gender?: string;
  dateOfBirth?: Date;
}

export async function GET(req: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const populate = searchParams.get("populate");

    if (!doctorId) {
      return NextResponse.json(
        { success: false, message: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Doctor ID format" },
        { status: 400 }
      );
    }

    // Authorization check: ensure requester is a doctor
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      try {
        const { userId, role } = verifyToken(authHeader);

        // If authenticated, verify it's a doctor
        if (role !== "doctor") {
          return NextResponse.json(
            { success: false, message: "Unauthorized: Doctor access only" },
            { status: 403 }
          );
        }

        // Verify the doctorId matches the authenticated doctor's doctorId
        const requestingDoctor = await DoctorModel.getDoctorByUserId(userId);
        if (
          !requestingDoctor ||
          requestingDoctor._id?.toString() !== doctorId
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Unauthorized: Can only access your own bookings",
            },
            { status: 403 }
          );
        }
      } catch (error) {
        console.log("🚀 ~ GET ~ error:", error);
        return NextResponse.json(
          { success: false, message: "Invalid authentication token" },
          { status: 401 }
        );
      }
    }

    // Fetch all bookings for this doctor
    const bookings = await Booking.findByDoctorId(doctorId);

    // If populate=patient, fetch patient data
    if (populate === "patient" && bookings.length > 0) {
      const db = await getDb();
      const usersCollection = db.collection<PatientData>("users");

      // Get unique patient IDs
      const patientIds = [
        ...new Set(bookings.map((b) => b.patientId.toString())),
      ];

      // Fetch all patients in one query
      const patients = await usersCollection
        .find(
          { _id: { $in: patientIds.map((id) => new ObjectId(id)) } },
          { projection: { fullName: 1, gender: 1, dateOfBirth: 1 } }
        )
        .toArray();

      // Create a map for quick lookup
      const patientMap = new Map(
        patients.map((p: PatientData) => [p._id.toString(), p])
      );

      // Attach patient data to bookings
      const bookingsWithPatients = bookings.map((booking) => {
        const patient = patientMap.get(booking.patientId.toString());
        return {
          ...booking,
          patient: patient
            ? {
                fullName: patient.fullName,
                gender: patient.gender,
                dateOfBirth: patient.dateOfBirth,
              }
            : null,
        };
      });

      return NextResponse.json(
        {
          success: true,
          data: bookingsWithPatients,
        },
        { status: 200 }
      );
    }

    // Return bookings without patient data (backward compatibility)
    return NextResponse.json(
      {
        success: true,
        data: bookings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // ✅ 0. Authentication - Verify patient token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    let userId: string;
    let role: string;
    try {
      const decoded = verifyToken(authHeader);
      userId = decoded.userId;
      role = decoded.role;
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // ✅ 1. Verify patient role
    if (role !== "patient") {
      return NextResponse.json(
        { message: "Forbidden - Patient access only" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as BookingType;

    // ✅ 2. Verify patientId matches authenticated user
    if (body.patientId.toString() !== userId) {
      return NextResponse.json(
        { message: "Forbidden - Can only create booking for yourself" },
        { status: 403 }
      );
    }

    // ✅ 3. Check if patient already has an active appointment (confirmed or in-progress)
    const db = await getDb();
    const bookingsCollection = db.collection("bookings");
    const patientObjectId = new ObjectId(userId);
    
    const activeBookings = await bookingsCollection.find({
      patientId: patientObjectId,
      status: { $in: ["confirmed", "in-progress"] }
    }).toArray();

    if (activeBookings.length > 0) {
      return NextResponse.json(
        { 
          message: "You already have an active appointment. Please complete or cancel your current appointment before booking a new one.",
          existingBooking: {
            bookingId: activeBookings[0]._id.toString(),
            bookingNumber: activeBookings[0].bookingNumber,
            status: activeBookings[0].status,
            appointmentTime: activeBookings[0].appointmentTime
          }
        },
        { status: 400 }
      );
    }

    // 1. get data schedules from doctorschedules collection by doctorId
    const schedules = (await ScheduleModel.getByDoctorId(
      body.doctorId.toString()
    )) as DoctorScheduleType;

    if (!schedules) {
      return NextResponse.json(
        { message: "Doctor schedule not found" },
        { status: 404 }
      );
    }

    // 2. Validate if doctor is available on the selected day
    const selectedDate = new Date(body.scheduleDate);
    const dayOfWeekIndex = selectedDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const dayOfWeekMap: { [key: number]: string } = {
      0: "Sunday",
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
    };
    const selectedDayOfWeek = dayOfWeekMap[dayOfWeekIndex];

    const daySchedule = schedules.dayOfWeek.find(
      (day) => day.hari === selectedDayOfWeek
    );

    if (!daySchedule || !daySchedule.available) {
      return NextResponse.json(
        { message: `Doctor is not available on ${selectedDayOfWeek}` },
        { status: 400 }
      );
    }

    // 3. get data average time per patient => from doctors collection, default 15 minutes
    const doctor = (await DoctorModel.getDoctorById(
      body.doctorId.toString()
    )) as Doctor;

    if (!doctor) {
      return NextResponse.json(
        { message: "Doctor not found" },
        { status: 404 }
      );
    }

    const averageTimePerPatient = doctor?.averageTimePerPatient || 15;

    // 4. get currentPatient = count of active bookings for that doctor ON THAT DATE
    // Active bookings = all status EXCEPT "cancelled"
    // Include: "pending", "confirmed", "completed" (completed still takes slot for that day)
    const allBookingsForDoctor = await Booking.findByDoctorId(
      body.doctorId.toString()
    );

    // Filter bookings: same date AND active (not cancelled)
    const bookingsOnDate = allBookingsForDoctor.filter((booking) => {
      const bookingDate = new Date(booking.scheduleDate);
      const isSameDate =
        bookingDate.getFullYear() === selectedDate.getFullYear() &&
        bookingDate.getMonth() === selectedDate.getMonth() &&
        bookingDate.getDate() === selectedDate.getDate();

      // Count all active bookings (exclude only cancelled)
      // "pending", "confirmed", "completed" all take a slot
      const isActiveBooking = booking.status !== "cancelled";

      return isSameDate && isActiveBooking;
    });

    const currentPatient = bookingsOnDate.length;

    // 5. get maxPatient from schedule
    const maxPatient = schedules.maxPatients;

    // 6. if currentPatient >= maxPatient, return error
    if (currentPatient >= maxPatient) {
      return NextResponse.json(
        {
          message:
            "No available queue for this date. Maximum patients reached.",
        },
        { status: 400 }
      );
    }

    // 7. Create booking
    const booking = await Booking.create(
      {
        patientId: body.patientId,
        doctorId: body.doctorId,
        scheduleDate: new Date(body.scheduleDate),
        complaint: body.complaint,
      },
      averageTimePerPatient,
      bookingsOnDate, // pass existing bookings to avoid re-querying
      daySchedule, // pass the selected day schedule for startTime/endTime
      doctor.queueCode // pass doctor's queueCode, will fallback to Z if undefined
    );
    return NextResponse.json(
      {
        message: "Booking created successfully",
        bookingNumber: booking.bookingNumber,
        queueNumber: booking.queueNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error creating booking:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, status, actualDurationMinutes, consultationResult } =
      body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, message: "Booking ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // If status is cancelled, adjust appointment times for subsequent bookings
    if (status === "cancelled") {
      // Get booking to find doctor and get averageTimePerPatient
      const collection = await Booking.collection();
      const booking = await collection.findOne({
        _id: new ObjectId(bookingId),
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        );
      }

      // Get doctor's average time per patient
      const doctor = await DoctorModel.getDoctorById(
        booking.doctorId.toString()
      );
      const averageTimePerPatient = doctor?.averageTimePerPatient || 15;

      // Cancel booking and adjust subsequent appointment times
      await Booking.cancelAndAdjustTimes(bookingId, averageTimePerPatient);
    } else if (status === "completed" && actualDurationMinutes) {
      // Complete booking and adjust subsequent appointment times based on actual duration
      await Booking.completeAndAdjustTimes(bookingId, actualDurationMinutes);

      // If consultationResult is provided, save it to the booking and create medical record
      console.log("🚀 ~ PATCH ~ consultationResult:", consultationResult);
      if (consultationResult) {
        const collection = await Booking.collection();
        const booking = await collection.findOne({ _id: new ObjectId(bookingId) });
        
        if (!booking) {
          return NextResponse.json(
            { success: false, message: "Booking not found" },
            { status: 404 }
          );
        }

        // Save consultationResult to booking
        await collection.updateOne(
          { _id: new ObjectId(bookingId) },
          { $set: { consultationResult } }
        );

        // Create medical record from consultationResult
        try {
          const MedicalRecordModel = (await import("@/db/models/MedicalRecord")).default;
          
          // Check if medical record already exists for this booking
          const existingRecord = await MedicalRecordModel.getByBookingId(bookingId);
          
          if (!existingRecord) {
            // Map consultationResult to medical record format
            const prescriptions = consultationResult.prescribedMedicines?.map(med => ({
              medicineId: med.medicineId,
              medicineName: med.medicineName,
              dosage: med.dosage,
              quantity: med.quantity,
              unitPrice: med.unitPrice,
              notes: undefined // consultationResult doesn't have notes per medicine
            })) || [];

            const medicalRecordData = {
              patientId: new ObjectId(booking.patientId),
              doctorId: booking.doctorId.toString(),
              bookingId: new ObjectId(bookingId),
              diagnosis: consultationResult.diagnosisNote || "",
              prescriptions: prescriptions,
              type: consultationResult.serviceProvided ? "Consultation" : "Prescription" as const,
              ...(consultationResult.serviceProvided && {
                serviceId: consultationResult.serviceProvided.serviceId,
                serviceName: consultationResult.serviceProvided.serviceName,
                servicePrice: consultationResult.serviceProvided.price
              })
            };

            const medicalRecord = await MedicalRecordModel.create(medicalRecordData);
            console.log(`✅ Medical record created from consultationResult for booking ${bookingId}:`, medicalRecord._id?.toString());

            // Auto-generate invoice if medical record has prescriptions or service
            const hasPrescriptions = prescriptions.length > 0;
            const hasService = !!consultationResult.serviceProvided;
            
            if (hasPrescriptions || hasService) {
              try {
                const InvoiceModel = (await import("@/db/models/Invoice")).default;
                const ServiceModel = (await import("@/db/models/ServiceModel")).default;
                const MedicineModel = (await import("@/db/models/Medicine")).default;
                const { generateInvoiceNumber, calculateDueDate } = await import("@/lib/invoice-utils");
                
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
                  if (consultationResult.serviceProvided) {
                    const service = await ServiceModel.getServiceById(consultationResult.serviceProvided.serviceId);
                    if (service && service.isActive) {
                      items.push({
                        type: "service",
                        name: service.name,
                        quantity: 1,
                        unitPrice: service.price,
                        total: service.price
                      });
                    } else {
                      items.push({
                        type: "service",
                        name: consultationResult.serviceProvided.serviceName,
                        quantity: 1,
                        unitPrice: consultationResult.serviceProvided.price,
                        total: consultationResult.serviceProvided.price
                      });
                    }
                  } else {
                    // Fallback: Use doctor consultation fee if no serviceId
                    const doctor = await DoctorModel.getDoctorById(booking.doctorId.toString());
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
                  if (prescriptions.length > 0) {
                    for (const prescription of prescriptions) {
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
                    patientId: new ObjectId(booking.patientId),
                    doctorId: booking.doctorId.toString(),
                    bookingId: new ObjectId(bookingId),
                    medicalRecordId: medicalRecord._id,
                    date: invoiceDate,
                    dueDate: dueDate,
                    items: items,
                    subtotal: subtotal,
                    total: total,
                    status: "pending"
                  });

                  console.log(`✅ Invoice auto-generated from consultationResult for booking ${bookingId}`);
                } else {
                  console.log(`ℹ️ Invoice already exists for medical record ${medicalRecord._id.toString()}`);
                }
              } catch (invoiceError) {
                console.error("⚠️ Error auto-generating invoice from consultationResult:", invoiceError);
                // Don't fail the request if invoice generation fails
                // Medical record is still created
              }
            }
          } else {
            console.log(`ℹ️ Medical record already exists for booking ${bookingId}`);
          }
        } catch (medicalRecordError) {
          console.error("⚠️ Error creating medical record from consultationResult:", medicalRecordError);
          // Don't fail the request if medical record creation fails
          // The consultationResult is still saved to booking
        }
      }
    } else {
      // For other status updates, just update the status
      const result = await Booking.updateStatus(bookingId, status);

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: "Booking status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { ObjectId, WithId, Document } from "mongodb";
import { getDb } from "../config/mongodb";

import { BookingType } from "@/types/bookingType";
import ScheduleModel from "./Schedule";
import { DoctorScheduleType } from "@/types/doctorScheduleType";

export default class BookingModel {
  static async collection() {
    const db = await getDb();
    return db.collection("bookings");
  }

  static async create(
    bookingData: BookingType,
    averageTimePerPatient: number,
    existingBookingsOnDate?: WithId<Document>[], // optional: bookings already filtered by date
    selectedDaySchedule?: { startTime: string; endTime: string }, // pass the day schedule from route
    doctorQueueCode?: string // queue code from doctor, fallback to Z if not provided
  ) {
    // get last booking number
    const collection = await this.collection();
    const lastBooking = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const day = new Date().getDate().toString().padStart(2, "0");
    let bookingNumber;
    if (lastBooking.length === 0) {
      bookingNumber = `MQ-${year}-${month}-${day}-0001`;
    }

    // reset booking number each day
    else if (
      !lastBooking[0].bookingNumber!.includes(`MQ-${year}-${month}-${day}`)
    ) {
      bookingNumber = `MQ-${year}-${month}-${day}-0001`;
    } else {
      const lastNumber = parseInt(
        lastBooking[0].bookingNumber!.split("-")[4],
        10
      );
      const newNumber = lastNumber + 1;
      bookingNumber = `MQ-${year}-${month}-${day}-${newNumber
        .toString()
        .padStart(4, "0")}`;
    }

    // convert patientId & doctorId to ObjectId
    bookingData.patientId = new ObjectId(bookingData.patientId);
    bookingData.doctorId = new ObjectId(bookingData.doctorId);

    // get only scheduleId from doctorschedules
    const schedule = (await ScheduleModel.getByDoctorId(
      bookingData.doctorId.toString()
    )) as DoctorScheduleType;
    if (schedule) {
      bookingData.scheduleId = schedule._id!;
    }

    // appointmentTime, set based on last queue number for that doctor on that date
    // 1. Use existing bookings if provided, otherwise query from database
    let bookingsOnDate: WithId<Document>[] = existingBookingsOnDate || [];

    if (!existingBookingsOnDate) {
      const bookingsForDoctor = await this.findByDoctorId(
        bookingData.doctorId.toString()
      );
      bookingsOnDate = bookingsForDoctor.filter((booking) => {
        const bookingDate = new Date(booking.scheduleDate as Date);
        const targetDate = new Date(bookingData.scheduleDate);
        const isSameDate =
          bookingDate.getFullYear() === targetDate.getFullYear() &&
          bookingDate.getMonth() === targetDate.getMonth() &&
          bookingDate.getDate() === targetDate.getDate();
        const isNotCancelled = booking.status !== "cancelled";
        return isSameDate && isNotCancelled;
      });
    }
    // 2. get average time per patient for that doctor => this data should be in doctors collection, if averageTimePerPatient in data is null, set default 15 minutes
    // (averageTimePerPatient is passed as parameter)
    // 3. appointmentTime is sum of last appointmentTime + average time per patient
    // if no previous booking, set appointmentTime to schedule firstCallTime
    if (bookingsOnDate.length === 0) {
      // Create appointmentTime using the scheduleDate's year, month, day
      const scheduleDate = new Date(bookingData.scheduleDate);
      
      // Get startTime from selectedDaySchedule or use schedule's dayOfWeek
      let startHour = 9; // default
      let startMinute = 0; // default
      
      if (selectedDaySchedule) {
        [startHour, startMinute] = selectedDaySchedule.startTime
          .split(":")
          .map(Number);
      } else if (schedule && schedule.dayOfWeek && schedule.dayOfWeek.length > 0) {
        // Get the day of week from scheduleDate
        const dayIndex = scheduleDate.getDay();
        const dayMap: { [key: number]: string } = {
          0: "Minggu",
          1: "Senin",
          2: "Selasa",
          3: "Rabu",
          4: "Kamis",
          5: "Jumat",
          6: "Sabtu",
        };
        const dayName = dayMap[dayIndex];
        const daySchedule = schedule.dayOfWeek.find((d) => d.hari === dayName);
        if (daySchedule) {
          [startHour, startMinute] = daySchedule.startTime.split(":").map(Number);
        }
      }
      
      // Create a new date with the correct date and time
      bookingData.appointmentTime = new Date(
        scheduleDate.getFullYear(),
        scheduleDate.getMonth(),
        scheduleDate.getDate(),
        startHour,
        startMinute,
        0,
        0
      );
    } else {
      // get last booking appointmentTime on THE SAME DATE
      const lastBookingOnDate = bookingsOnDate.reduce((latest, current) => {
        const latestTime = new Date(
          (latest.appointmentTime as Date) || (latest.scheduleDate as Date)
        ).getTime();
        const currentTime = new Date(
          (current.appointmentTime as Date) || (current.scheduleDate as Date)
        ).getTime();
        return currentTime > latestTime ? current : latest;
      });
      
      const lastAppointmentTime = new Date(
        (lastBookingOnDate.appointmentTime as Date) || 
        (lastBookingOnDate.scheduleDate as Date)
      );
      
      // Extract hour and minute from last appointment time
      const lastHour = lastAppointmentTime.getHours();
      const lastMinute = lastAppointmentTime.getMinutes();
      
      // Calculate new time by adding average time per patient
      const totalMinutes = lastHour * 60 + lastMinute + averageTimePerPatient;
      const newHour = Math.floor(totalMinutes / 60);
      const newMinute = totalMinutes % 60;
      
      // Create new appointmentTime with scheduleDate's date but calculated time
      const scheduleDate = new Date(bookingData.scheduleDate);
      bookingData.appointmentTime = new Date(
        scheduleDate.getFullYear(),
        scheduleDate.getMonth(),
        scheduleDate.getDate(),
        newHour,
        newMinute,
        0,
        0
      );
    }
    // 4. make real time, if previous booking got cancelled, skip that time slot

    // get last queue number for this specific doctor on this date
    const queuePrefix = (doctorQueueCode || "Z").toUpperCase();
    
    // Get the last booking for THIS DOCTOR on THIS DATE
    const lastDoctorBookingOnDate = await collection
      .find({
        doctorId: bookingData.doctorId,
        bookingNumber: { $regex: `^MQ-${year}-${month}-${day}` }
      })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    let queueNumber;
    if (lastDoctorBookingOnDate.length === 0) {
      // First booking for this doctor on this date
      queueNumber = `${queuePrefix}-001`;
    } else {
      // Get the last queue number for this doctor and increment
      const lastQueueNumber = lastDoctorBookingOnDate[0].queueNumber as string;
      const lastQueueNumPart = parseInt(lastQueueNumber.split("-")[1], 10);
      const newQueueNumPart = lastQueueNumPart + 1;
      queueNumber = `${queuePrefix}-${newQueueNumPart.toString().padStart(3, "0")}`;
    }

    bookingData = {
      ...bookingData,
      bookingNumber: bookingNumber,
      queueNumber: queueNumber,
      cancelReason: bookingData.cancelReason || "",
      notes: bookingData.notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "confirmed",
    };
    try {
      const collection = await this.collection();
      await collection.insertOne(bookingData);
      return bookingData;
    } catch (err) {
      throw err;
    }
  }

  static async findByDoctorId(doctorId: string) {
    // sort by createdAt descending
    const collection = await this.collection();
    const bookings = await collection
      .find({ doctorId: new ObjectId(doctorId) })
      .sort({ createdAt: -1 })
      .toArray();
    return bookings;
  }

  static async updateStatus(bookingId: string, status: string) {
    const collection = await this.collection();
    const result = await collection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          status, 
          updatedAt: new Date() 
        } 
      }
    );
    return result;
  }

  static async cancelAndAdjustTimes(bookingId: string, averageTimePerPatient: number) {
    const collection = await this.collection();
    
    // Get the booking that will be cancelled
    const cancelledBooking = await collection.findOne({ _id: new ObjectId(bookingId) });
    
    if (!cancelledBooking) {
      throw new Error("Booking not found");
    }

    // Cancel the booking
    await collection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          status: "cancelled", 
          updatedAt: new Date() 
        } 
      }
    );

    // Get all confirmed bookings for the same doctor on the same date with later appointment times
    const scheduleDate = new Date(cancelledBooking.scheduleDate);
    const cancelledAppointmentTime = cancelledBooking.appointmentTime 
      ? new Date(cancelledBooking.appointmentTime) 
      : null;

    if (!cancelledAppointmentTime) {
      return; // No need to adjust if cancelled booking has no appointment time
    }

    const bookingsToAdjust = await collection.find({
      doctorId: cancelledBooking.doctorId,
      scheduleDate: {
        $gte: new Date(scheduleDate.setHours(0, 0, 0, 0)),
        $lt: new Date(scheduleDate.setHours(23, 59, 59, 999))
      },
      status: "confirmed",
      appointmentTime: { $gt: cancelledAppointmentTime }
    }).sort({ appointmentTime: 1 }).toArray();

    // Adjust appointment times by moving them earlier
    const adjustmentMs = averageTimePerPatient * 60 * 1000; // Convert minutes to milliseconds

    for (const booking of bookingsToAdjust) {
      const currentTime = new Date(booking.appointmentTime);
      const newTime = new Date(currentTime.getTime() - adjustmentMs);
      
      await collection.updateOne(
        { _id: booking._id },
        { 
          $set: { 
            appointmentTime: newTime,
            updatedAt: new Date() 
          } 
        }
      );
    }
  }

  static async completeAndAdjustTimes(bookingId: string, actualDurationMinutes: number) {
    const collection = await this.collection();
    
    // Get the booking that will be completed
    const completedBooking = await collection.findOne({ _id: new ObjectId(bookingId) });
    
    if (!completedBooking) {
      throw new Error("Booking not found");
    }

    const completedAppointmentTime = completedBooking.appointmentTime 
      ? new Date(completedBooking.appointmentTime) 
      : null;

    if (!completedAppointmentTime) {
      // Just mark as completed if no appointment time
      await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { 
          $set: { 
            status: "completed", 
            updatedAt: new Date() 
          } 
        }
      );
      return;
    }

    // Calculate actual finish time
    const actualFinishTime = new Date(completedAppointmentTime.getTime() + (actualDurationMinutes * 60 * 1000));

    // Mark booking as completed
    await collection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          status: "completed", 
          updatedAt: new Date() 
        } 
      }
    );

    // Get all confirmed bookings for the same doctor on the same date with later appointment times
    const scheduleDate = new Date(completedBooking.scheduleDate);
    
    const bookingsToAdjust = await collection.find({
      doctorId: completedBooking.doctorId,
      scheduleDate: {
        $gte: new Date(scheduleDate.setHours(0, 0, 0, 0)),
        $lt: new Date(scheduleDate.setHours(23, 59, 59, 999))
      },
      status: "confirmed",
      appointmentTime: { $gt: completedAppointmentTime }
    }).sort({ appointmentTime: 1 }).toArray();

    if (bookingsToAdjust.length === 0) {
      return; // No subsequent bookings to adjust
    }

    // Get the first subsequent booking's original appointment time
    const firstBookingOriginalTime = new Date(bookingsToAdjust[0].appointmentTime);
    
    // Calculate time difference (actualFinishTime vs firstBooking's original time)
    const timeDifferenceMs = actualFinishTime.getTime() - firstBookingOriginalTime.getTime();

    // If finish time is same or earlier than next appointment, no adjustment needed
    if (timeDifferenceMs <= 0) {
      return;
    }

    // Adjust all subsequent bookings by the time difference
    for (const booking of bookingsToAdjust) {
      const currentTime = new Date(booking.appointmentTime);
      const newTime = new Date(currentTime.getTime() + timeDifferenceMs);
      
      await collection.updateOne(
        { _id: booking._id },
        { 
          $set: { 
            appointmentTime: newTime,
            updatedAt: new Date() 
          } 
        }
      );
    }
  }
}

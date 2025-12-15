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
    existingBookingsOnDate?: WithId<Document>[] // optional: bookings already filtered by date
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
      bookingData.appointmentTime = new Date(bookingData.scheduleDate);
      const [startHour, startMinute] = schedule.timeRange
        .split(" - ")[0]
        .split(":")
        .map(Number);
      bookingData.appointmentTime.setHours(startHour, startMinute, 0, 0);
    } else {
      // get last booking appointmentTime
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
      lastAppointmentTime.setMinutes(
        lastAppointmentTime.getMinutes() + averageTimePerPatient
      );
      bookingData.appointmentTime = lastAppointmentTime;
    }
    // 4. make real time, if previous booking got cancelled, skip that time slot

    // get last queue number
    let queueNumber;
    if (lastBooking.length === 0) {
      queueNumber = `A-001`;
    } else if (
      !lastBooking[0].bookingNumber!.includes(`MQ-${year}-${month}-${day}`)
    ) {
      queueNumber = `A-001`;
    } else {
      const lastQueueNumber = lastBooking[0].queueNumber!;
      const lastQueueNumPart = parseInt(lastQueueNumber.split("-")[1], 10);
      const newQueueNumPart = lastQueueNumPart + 1;
      queueNumber = `A-${newQueueNumPart.toString().padStart(3, "0")}`;
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
}

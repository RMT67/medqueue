"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { StatusBadge } from "@/components/status-badge";
import { AIInsightCard } from "@/components/ai-insight-card";
import { SessionTimer } from "@/components/session-timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Clock,
  CheckCircle2,
  SkipForward,
  Users,
  Activity,
  Stethoscope,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Doctor } from "@/types/docterTypes";
import { BookingType } from "@/types/bookingType";
import Swal from "sweetalert2";

// Transform booking data to queue format for UI
interface QueuePatient {
  _id: string;
  queueNo: string;
  patientName: string;
  patientGender?: string;
  patientAge?: number;
  status: "being-served" | "waiting" | "completed";
  eta: string;
  timeRange: string;
  patientComplaint: string;
  bookingData: BookingType;
}

// Medicine API response type
interface MedicineAPIResponse {
  _id: string;
  code: string;
  name: string;
  price: number;
  unit: string;
  category?: string;
  stock?: number;
  imageUrl?: string;
}

// Service API response type
interface ServiceAPIResponse {
  _id: string;
  code: string;
  name: string;
  price: number;
  category?: string;
  duration?: number;
  description?: string;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [currentPatient, setCurrentPatient] = useState<QueuePatient | null>(
    null
  );
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [diagnosisNote, setDiagnosisNote] = useState("");
  const [prescribedMedicines, setPrescribedMedicines] = useState<
    Array<{
      medicineId: string;
      medicineName: string;
      medicineCode: string;
      quantity: number;
      dosage: string;
    }>
  >([]);
  const [selectedService, setSelectedService] = useState<{
    serviceId: string;
    serviceName: string;
    serviceCode: string;
    price: number;
  } | null>(null);
  const [medicines, setMedicines] = useState<
    Array<{
      _id: string;
      code: string;
      name: string;
      price: number;
      unit: string;
    }>
  >([]);
  const [services, setServices] = useState<
    Array<{
      _id: string;
      code: string;
      name: string;
      price: number;
    }>
  >([]);
  const [medicinesLoading, setMedicinesLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "doctor")) {
      router.push("/login/doctor");
    }
  }, [user, isLoading, router]);

  // Fetch doctor data for clinic info
  useEffect(() => {
    async function fetchDoctor() {
      if (!user || user.role !== "doctor") {
        setDoctorLoading(false);
        return;
      }

      try {
        setDoctorLoading(true);
        setDoctorError(null);
        const response = await apiFetch<{ doctor: Doctor }, void>(
          `/api/doctor?userId=${user._id}`,
          {
            method: "GET",
            skipAuth: true,
          }
        );
        setCurrentDoctor(response.doctor);
      } catch (err) {
        console.error("Error fetching doctor:", err);
        setDoctorError(
          err instanceof Error ? err.message : "Gagal memuat data dokter"
        );
        setCurrentDoctor(null);
      } finally {
        setDoctorLoading(false);
      }
    }

    fetchDoctor();
  }, [user]);

  // Fetch medicines and services for consultation
  useEffect(() => {
    async function fetchMedicinesAndServices() {
      if (!user || user.role !== "doctor") return;

      try {
        // Fetch medicines
        setMedicinesLoading(true);
        const medResponse = await fetch("/api/item");
        if (medResponse.ok) {
          const medData = await medResponse.json();
          setMedicines(
            medData.data?.map((m: MedicineAPIResponse) => ({
              _id: m._id,
              code: m.code,
              name: m.name,
              price: m.price,
              unit: m.unit,
            })) || []
          );
        }

        // Fetch services
        setServicesLoading(true);
        const svcResponse = await fetch("/api/service?activeOnly=true");
        if (svcResponse.ok) {
          const svcData = await svcResponse.json();
          setServices(
            Array.isArray(svcData)
              ? svcData.map((s: ServiceAPIResponse) => ({
                  _id: s._id,
                  code: s.code,
                  name: s.name,
                  price: s.price,
                }))
              : []
          );
        }
      } catch (error) {
        console.error("Error fetching medicines/services:", error);
      } finally {
        setMedicinesLoading(false);
        setServicesLoading(false);
      }
    }

    fetchMedicinesAndServices();
  }, [user]);

  // Fetch bookings for the logged-in doctor
  useEffect(() => {
    async function fetchBookings() {
      if (!user || user.role !== "doctor") {
        setBookingsLoading(false);
        return;
      }

      // Wait for doctor to load first
      if (!currentDoctor) return;
      if (doctorLoading) return;

      try {
        setBookingsLoading(true);
        setBookingsError(null);

        // Fetch bookings with patient data from API
        const response = await apiFetch<
          {
            success: boolean;
            data: Array<
              BookingType & {
                patient: {
                  fullName: string;
                  gender?: string;
                  dateOfBirth?: string;
                } | null;
              }
            >;
          },
          void
        >(`/api/booking?doctorId=${currentDoctor._id}&populate=patient`, {
          method: "GET",
        });

        if (response.success && response.data) {
          // Filter today's bookings with status "confirmed"
          const today = new Date();
          const todayBookings = response.data.filter((booking) => {
            const scheduleDate = new Date(booking.scheduleDate);
            const isSameDate =
              scheduleDate.getFullYear() === today.getFullYear() &&
              scheduleDate.getMonth() === today.getMonth() &&
              scheduleDate.getDate() === today.getDate();
            return isSameDate && booking.status === "confirmed";
          });

          // Sort by appointmentTime or queueNumber
          todayBookings.sort((a, b) => {
            if (a.appointmentTime && b.appointmentTime) {
              return (
                new Date(a.appointmentTime).getTime() -
                new Date(b.appointmentTime).getTime()
              );
            }
            // Fallback to queue number sorting
            return (a.queueNumber || "").localeCompare(b.queueNumber || "");
          });

          // Transform bookings to queue format
          const queueData: QueuePatient[] = todayBookings.map(
            (booking, idx) => {
              // Get patient data from populated field
              const patientName =
                booking.patient?.fullName || "Unknown Patient";
              const patientGender = booking.patient?.gender;
              let patientAge: number | undefined;

              // Calculate age from dateOfBirth
              if (booking.patient?.dateOfBirth) {
                const birthDate = new Date(booking.patient.dateOfBirth);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (
                  monthDiff < 0 ||
                  (monthDiff === 0 && today.getDate() < birthDate.getDate())
                ) {
                  age--;
                }
                patientAge = age;
              }

              // Calculate ETA based on appointment time
              let eta = "Waiting";
              if (booking.appointmentTime) {
                const appointmentTime = new Date(booking.appointmentTime);
                const now = new Date();
                const diffMinutes = Math.floor(
                  (appointmentTime.getTime() - now.getTime()) / 60000
                );

                if (diffMinutes <= 0) {
                  eta = "Now";
                } else if (diffMinutes < 60) {
                  eta = `${diffMinutes} min`;
                } else {
                  const hours = Math.floor(diffMinutes / 60);
                  const mins = diffMinutes % 60;
                  eta = `${hours}h ${mins}m`;
                }
              }

              // Get time range from appointmentTime
              let timeRange = "09:00 - 12:00"; // default
              if (booking.appointmentTime) {
                const appointmentTime = new Date(booking.appointmentTime);
                const startHour = appointmentTime
                  .getHours()
                  .toString()
                  .padStart(2, "0");
                const startMin = appointmentTime
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                timeRange = `${startHour}:${startMin}`;
              }

              return {
                _id: booking._id?.toString() || "",
                queueNo: booking.queueNumber || "N/A",
                patientName,
                patientGender,
                patientAge,
                status: idx === 0 ? "being-served" : "waiting",
                eta,
                timeRange,
                patientComplaint: booking.complaint || "No complaint provided",
                bookingData: booking,
              } as QueuePatient;
            }
          );

          // Set first patient as current, rest as queue
          if (queueData.length > 0) {
            setCurrentPatient(queueData[0]);
            setQueue(queueData.slice(1));
          } else {
            setCurrentPatient(null);
            setQueue([]);
          }
        } else {
          setBookingsError("No bookings found");
          setCurrentPatient(null);
          setQueue([]);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setBookingsError(
          err instanceof Error ? err.message : "Failed to load bookings"
        );
        setCurrentPatient(null);
        setQueue([]);
      } finally {
        setBookingsLoading(false);
      }
    }

    fetchBookings();
  }, [user, currentDoctor, doctorLoading]);

  if (isLoading || doctorLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionStartTime(new Date());
    // Reset consultation data
    setDiagnosisNote("");
    setPrescribedMedicines([]);
    setSelectedService(null);
  };

  const handleAddMedicine = (medicineId: string) => {
    if (!medicineId) return;

    const medicine = medicines.find((m) => m._id === medicineId);
    if (!medicine) return;

    // Check if already added
    if (prescribedMedicines.find((pm) => pm.medicineId === medicineId)) {
      Swal.fire("Duplicate Medicine", "Medicine already added", "warning");
      return;
    }

    setPrescribedMedicines([
      ...prescribedMedicines,
      {
        medicineId: medicine._id,
        medicineName: medicine.name,
        medicineCode: medicine.code,
        quantity: 1,
        dosage: "1x per day",
      },
    ]);
  };

  const handleRemoveMedicine = (medicineId: string) => {
    setPrescribedMedicines(
      prescribedMedicines.filter((pm) => pm.medicineId !== medicineId)
    );
  };

  const handleUpdateMedicineQuantity = (
    medicineId: string,
    quantity: number
  ) => {
    setPrescribedMedicines(
      prescribedMedicines.map((pm) =>
        pm.medicineId === medicineId ? { ...pm, quantity } : pm
      )
    );
  };

  const handleUpdateMedicineDosage = (medicineId: string, dosage: string) => {
    setPrescribedMedicines(
      prescribedMedicines.map((pm) =>
        pm.medicineId === medicineId ? { ...pm, dosage } : pm
      )
    );
  };

  const handleSelectService = (serviceId: string) => {
    if (!serviceId) {
      setSelectedService(null);
      return;
    }

    const service = services.find((s) => s._id === serviceId);
    if (service) {
      setSelectedService({
        serviceId: service._id,
        serviceName: service.name,
        serviceCode: service.code,
        price: service.price,
      });
    }
  };

  const handleCallNext = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setCurrentPatient(next);
      setQueue(queue.slice(1));
    } else {
      setCurrentPatient(null);
    }
  };

  const handleSkip = async () => {
    if (!currentPatient || !user) return;

    try {
      const token = localStorage.getItem("medqueue_token");
      if (!token) {
        Swal.fire("Authentication required", "Please log in again.", "warning");
        return;
      }

      const response = await fetch(
        `/api/doctor/queue/${currentPatient._id}/skip`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        Swal.fire("Error", error.error || "Failed to skip patient", "error");
        return;
      }

      // Refresh bookings to get updated queue (exclude cancelled/skipped)
      if (!currentDoctor) {
        Swal.fire("Error", "Doctor profile not found", "error");
        return;
      }

      const bookingsResponse = await fetch(
        `/api/booking?doctorId=${currentDoctor._id}&populate=patient`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!bookingsResponse.ok) {
        throw new Error("Failed to refresh bookings");
      }

      const result = await bookingsResponse.json();

      if (result.success && result.data) {
        // Filter today's bookings with status "confirmed" (exclude cancelled)
        const today = new Date();
        const todayBookings = result.data.filter((booking: BookingType) => {
          const scheduleDate = new Date(booking.scheduleDate);
          const isSameDate =
            scheduleDate.getFullYear() === today.getFullYear() &&
            scheduleDate.getMonth() === today.getMonth() &&
            scheduleDate.getDate() === today.getDate();
          return isSameDate && booking.status === "confirmed";
        });

        // Sort by appointmentTime or queueNumber
        todayBookings.sort((a: BookingType, b: BookingType) => {
          if (a.appointmentTime && b.appointmentTime) {
            return (
              new Date(a.appointmentTime).getTime() -
              new Date(b.appointmentTime).getTime()
            );
          }
          return (a.queueNumber || "").localeCompare(b.queueNumber || "");
        });

        // Transform bookings to queue format
        const queueData: QueuePatient[] = todayBookings.map(
          (
            booking: BookingType & {
              patient?: {
                fullName: string;
                gender?: string;
                dateOfBirth?: string;
              } | null;
            },
            idx: number
          ) => {
            // Get patient data from populated field
            const patientName = booking.patient?.fullName || "Unknown Patient";
            const patientGender = booking.patient?.gender;
            let patientAge: number | undefined;

            // Calculate age from dateOfBirth
            if (booking.patient?.dateOfBirth) {
              const birthDate = new Date(booking.patient.dateOfBirth);
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (
                monthDiff < 0 ||
                (monthDiff === 0 && today.getDate() < birthDate.getDate())
              ) {
                age--;
              }
              patientAge = age;
            }

            let eta = "Waiting";
            if (booking.appointmentTime) {
              const appointmentTime = new Date(booking.appointmentTime);
              const now = new Date();
              const diffMinutes = Math.floor(
                (appointmentTime.getTime() - now.getTime()) / 60000
              );

              if (diffMinutes <= 0) {
                eta = "Now";
              } else if (diffMinutes < 60) {
                eta = `${diffMinutes} min`;
              } else {
                const hours = Math.floor(diffMinutes / 60);
                const mins = diffMinutes % 60;
                eta = `${hours}h ${mins}m`;
              }
            }

            let timeRange = "09:00 - 12:00";
            if (booking.appointmentTime) {
              const appointmentTime = new Date(booking.appointmentTime);
              const startHour = appointmentTime
                .getHours()
                .toString()
                .padStart(2, "0");
              const startMin = appointmentTime
                .getMinutes()
                .toString()
                .padStart(2, "0");
              timeRange = `${startHour}:${startMin}`;
            }

            return {
              _id: booking._id?.toString() || "",
              queueNo: booking.queueNumber || "N/A",
              patientName,
              patientGender,
              patientAge,
              status: idx === 0 ? "being-served" : "waiting",
              eta,
              timeRange,
              patientComplaint: booking.complaint || "No complaint provided",
              bookingData: booking,
            } as QueuePatient;
          }
        );

        // Update queue - set first patient as current, rest as queue
        if (queueData.length > 0) {
          setCurrentPatient(queueData[0]);
          setQueue(queueData.slice(1));
        } else {
          setCurrentPatient(null);
          setQueue([]);
        }
      } else {
        // No bookings left
        setCurrentPatient(null);
        setQueue([]);
      }
    } catch (error) {
      console.error("Error skipping patient:", error);
      Swal.fire("Error", "Failed to skip patient", "error");
    }
  };

  const handleFinish = async () => {
    if (!sessionStartTime || !currentDoctor || !currentPatient) {
      setIsSessionActive(false);
      handleCallNext();
      return;
    }

    // Validate consultation data
    if (!diagnosisNote.trim()) {
      Swal.fire("Validation Error", "Please enter a diagnosis note", "warning");
      return;
    }

    try {
      // Calculate consultation duration in minutes
      const endTime = new Date();
      const durationMs = endTime.getTime() - sessionStartTime.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      // Calculate new average time per patient
      let newAverageTime: number;

      if (currentDoctor.averageTimePerPatient) {
        // Doctor has existing average, calculate new average
        newAverageTime = Math.round(
          (currentDoctor.averageTimePerPatient + durationMinutes) / 2
        );
      } else {
        // First consultation, set directly
        newAverageTime = durationMinutes;
      }

      // Update booking status to completed and adjust subsequent appointment times
      await apiFetch<
        { success: boolean; message: string },
        {
          bookingId: string;
          status: string;
          actualDurationMinutes: number;
          consultationResult: {
            diagnosisNote: string;
            prescribedMedicines: Array<{
              medicineId: string;
              medicineName: string;
              medicineCode: string;
              quantity: number;
              dosage: string;
            }>;
            serviceProvided?: {
              serviceId: string;
              serviceName: string;
              serviceCode: string;
              price: number;
            };
          };
        }
      >("/api/booking", {
        method: "PATCH",
        body: {
          bookingId: currentPatient._id,
          status: "completed",
          actualDurationMinutes: durationMinutes,
          consultationResult: {
            diagnosisNote,
            prescribedMedicines,
            serviceProvided: selectedService || undefined,
          },
        },
      });

      // Update doctor's averageTimePerPatient
      await apiFetch<
        { doctor: Doctor },
        { doctorId: string; updateData: Partial<Doctor> }
      >("/api/doctor", {
        method: "PUT",
        body: {
          doctorId: currentDoctor._id,
          updateData: {
            averageTimePerPatient: newAverageTime,
          },
        },
      });

      // Update local state
      setCurrentDoctor({
        ...currentDoctor,
        averageTimePerPatient: newAverageTime,
      });
    } catch (error) {
      console.error("Error finishing consultation:", error);
    } finally {
      setIsSessionActive(false);
      setSessionStartTime(null);
      handleCallNext();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="doctor"
        userName={user.name}
        onLogout={logout}
      />

      {/* Hero Header */}
      <section className="relative bg-linear-to-br from-primary/10 via-accent/5 to-secondary/5 py-8 lg:py-10 border-b border-border overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23000000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Stethoscope className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                Doctor <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage your patient queue and sessions
              </p>
            </div>
            <Card className="p-4 md:p-5 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {user.name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">
                    {user.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentDoctor?.specialization || "Dokter"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Error States */}
        {doctorError && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <div className="p-6 flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Gagal memuat data dokter</p>
                <p className="text-sm">{doctorError}</p>
              </div>
            </div>
          </Card>
        )}

        {bookingsError && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <div className="p-6 flex items-center gap-3 text-orange-600 dark:text-orange-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Gagal memuat data booking</p>
                <p className="text-sm">{bookingsError}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Empty Doctor State */}
        {!doctorError && !currentDoctor && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <div className="p-12 text-center">
              <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold text-foreground mb-2">
                Belum ada data dokter
              </p>
              <p className="text-muted-foreground">
                Data dokter belum tersedia di database.
              </p>
            </div>
          </Card>
        )}

        {/* Main Content - Only render if doctor data exists */}
        {!doctorError && currentDoctor && (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Area - Current Patient */}
            <div className="lg:col-span-2 space-y-6">
              {/* No Patients Today State */}
              {!currentPatient && queue.length === 0 ? (
                <Card className="p-12 text-center border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    No Patients Today
                  </h3>
                  <p className="text-muted-foreground">
                    There are no confirmed bookings for today. Enjoy your day!
                  </p>
                </Card>
              ) : (
                <>
                  {/* Current Patient Card */}
                  <Card className="p-6 lg:p-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                    <div className="text-center mb-6 pb-6 border-b-2 border-primary/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Currently Serving
                      </p>
                      <h2 className="text-5xl lg:text-6xl font-bold text-primary font-mono mb-2">
                        {currentPatient?.queueNo || "N/A"}
                      </h2>
                      <p className="text-lg font-semibold text-foreground">
                        {currentPatient?.patientName || "Unknown"}
                      </p>
                    </div>

                    <div className="bg-linear-to-br from-muted/50 to-muted/30 rounded-xl p-5 mb-6 border-2 border-border space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Patient Information
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Gender:
                            </span>
                            <span className="text-sm font-semibold text-foreground capitalize">
                              {currentPatient?.patientGender || "Not available"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Age:
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {currentPatient?.patientAge
                                ? `${currentPatient.patientAge} years`
                                : "Not available"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t-2 border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Appointment Time
                        </p>
                        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                          <Clock className="w-4 h-4 text-primary" />
                          <p className="text-sm font-semibold text-primary">
                            {currentPatient?.timeRange || "N/A"}
                          </p>
                        </div>
                      </div>
                      {currentPatient?.patientComplaint && (
                        <div className="pt-4 border-t-2 border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Symptoms / Concerns
                          </p>
                          <p className="text-sm font-semibold text-foreground bg-muted/50 p-3 rounded-lg">
                            {currentPatient.patientComplaint}
                          </p>
                        </div>
                      )}

                      {/* Diagnosis Note */}
                      {isSessionActive && (
                        <div className="pt-4 border-t-2 border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Diagnosis Note
                          </p>
                          <textarea
                            value={diagnosisNote}
                            onChange={(e) => setDiagnosisNote(e.target.value)}
                            placeholder="Enter diagnosis and conclusion here..."
                            className="w-full min-h-[100px] p-3 text-sm rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none resize-none"
                          />
                        </div>
                      )}

                      {/* Medicine Selection */}
                      {isSessionActive && (
                        <div className="pt-4 border-t-2 border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Prescribed Medicine
                          </p>
                          <select
                            onChange={(e) => handleAddMedicine(e.target.value)}
                            value=""
                            disabled={medicinesLoading}
                            className="w-full p-3 text-sm rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none"
                          >
                            <option value="">
                              {medicinesLoading
                                ? "Loading medicines..."
                                : "Select medicine to add..."}
                            </option>
                            {medicines.map((medicine) => (
                              <option key={medicine._id} value={medicine._id}>
                                {medicine.name} - {medicine.code} (Rp{" "}
                                {medicine.price.toLocaleString()})
                              </option>
                            ))}
                          </select>

                          {/* List of prescribed medicines */}
                          {prescribedMedicines.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {prescribedMedicines.map((pm) => (
                                <div
                                  key={pm.medicineId}
                                  className="p-3 bg-muted/50 rounded-lg border border-border"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-foreground">
                                        {pm.medicineName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {pm.medicineCode}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleRemoveMedicine(pm.medicineId)
                                      }
                                      className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs text-muted-foreground">
                                        Quantity
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={pm.quantity}
                                        onChange={(e) =>
                                          handleUpdateMedicineQuantity(
                                            pm.medicineId,
                                            parseInt(e.target.value) || 1
                                          )
                                        }
                                        className="w-full p-2 text-sm rounded border border-border bg-background"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">
                                        Dosage
                                      </label>
                                      <input
                                        type="text"
                                        value={pm.dosage}
                                        onChange={(e) =>
                                          handleUpdateMedicineDosage(
                                            pm.medicineId,
                                            e.target.value
                                          )
                                        }
                                        className="w-full p-2 text-sm rounded border border-border bg-background"
                                        placeholder="e.g., 2x per day"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Service Selection */}
                      {isSessionActive && (
                        <div className="pt-4 border-t-2 border-border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Service Provided
                          </p>
                          <select
                            value={selectedService?.serviceId || ""}
                            onChange={(e) =>
                              handleSelectService(e.target.value)
                            }
                            disabled={servicesLoading}
                            className="w-full p-3 text-sm rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none"
                          >
                            <option value="">
                              {servicesLoading
                                ? "Loading services..."
                                : "Select service..."}
                            </option>
                            {services.map((service) => (
                              <option key={service._id} value={service._id}>
                                {service.name} - {service.code} (Rp{" "}
                                {service.price.toLocaleString()})
                              </option>
                            ))}
                          </select>
                          {selectedService && (
                            <div className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <p className="text-sm font-semibold text-foreground">
                                {selectedService.serviceName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selectedService.serviceCode} - Rp{" "}
                                {selectedService.price.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-4 border-t-2 border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Status
                        </p>
                        <StatusBadge status="being-served" />
                      </div>
                    </div>

                    {/* Session Timer */}
                    {isSessionActive && (
                      <Card className="p-6 mb-6 bg-linear-to-br from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20 shadow-lg">
                        <SessionTimer duration={600} />
                      </Card>
                    )}

                    {/* Action Buttons */}
                    {!isSessionActive ? (
                      <div className="space-y-3">
                        <Button
                          onClick={handleStartSession}
                          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg hover:shadow-xl transition-all font-medium"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Start Session
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleSkip}
                          className="w-full h-12 border-2 hover:bg-muted hover:border-primary/30 transition-all gap-2 font-medium"
                        >
                          <SkipForward className="w-5 h-5" />
                          Skip Patient
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={handleSkip}
                          className="flex-1 h-12 border-2 hover:bg-muted hover:border-primary/30 transition-all font-medium"
                        >
                          Skip
                        </Button>
                        <Button
                          onClick={handleFinish}
                          className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-all font-medium"
                        >
                          Finish & Call Next
                        </Button>
                      </div>
                    )}
                  </Card>

                  {/* Today's Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-5 lg:p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Patients Today
                          </p>
                          <p className="text-2xl lg:text-3xl font-bold text-foreground">
                            {currentPatient ? queue.length + 1 : 0}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-5 lg:p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent to-secondary flex items-center justify-center shadow-md">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Avg Service Time
                          </p>
                          <p className="text-2xl lg:text-3xl font-bold text-foreground">
                            {currentDoctor?.averageTimePerPatient || 15} min
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Today's Queue Table */}
              <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">
                      Today&apos;s Queue
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {queue.length > 0 ? (
                    queue.map((patient, idx) => (
                      <Card
                        key={idx}
                        className="p-4 border-2 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer bg-card/80 backdrop-blur-sm"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-foreground text-base">
                                {patient.queueNo}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {patient.patientName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> {patient.eta}
                              </p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-border space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <p className="text-xs font-semibold text-primary">
                                {patient.timeRange}
                              </p>
                            </div>
                            {patient.patientComplaint && (
                              <div className="flex items-start gap-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {patient.patientComplaint}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground text-sm">
                        No more patients today
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* AI Insights */}
              <AIInsightCard
                title="Performance Insights"
                insights={[
                  `Average service: ${
                    currentDoctor?.averageTimePerPatient || 15
                  } minutes`,
                  "On schedule today",
                  currentDoctor?.averageRating !== undefined &&
                  currentDoctor.totalReviews > 0
                    ? `Patient satisfaction: ${currentDoctor.averageRating.toFixed(
                        1
                      )}/5 (${currentDoctor.totalReviews} reviews)`
                    : "Patient satisfaction: No ratings yet",
                ]}
                recommendation="Keep up the pace! You're doing great."
              />

              {/* Clinic Info */}
              <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent to-secondary flex items-center justify-center shadow-md">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Clinic Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Clinic
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {currentDoctor?.clinic || "N/A"}
                    </p>
                  </div>
                  {currentDoctor?.defaultSchedule && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Available Time
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {currentDoctor.defaultSchedule}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Location
                    </p>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Tidak tersedia
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

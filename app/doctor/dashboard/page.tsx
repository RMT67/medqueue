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

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<QueuePatient | null>(
    null
  );
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "doctor")) {
      router.push("/login/doctor");
    }
  }, [user, isLoading, router]);

  // Fetch doctor data for clinic info
  useEffect(() => {
    async function fetchDoctor() {
      console.log("🚀 ~ fetchDoctor ~ user:", user);
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

  const handleSkip = () => {
    console.log("Patient skipped");
  };

  const handleFinish = () => {
    setIsSessionActive(false);
    handleCallNext();
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
                      <div className="pt-4 border-t-2 border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Patient Symptom
                        </p>
                        <p className="text-sm font-semibold text-foreground bg-muted/50 p-3 rounded-lg">
                          {currentPatient?.patientComplaint || "No symptoms provided"}
                        </p>
                      </div>
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

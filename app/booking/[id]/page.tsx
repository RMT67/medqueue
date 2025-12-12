"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Calendar,
  // DollarSign,
  MapPin,
  ArrowLeft,
  // Stethoscope,
  Clock,
  // CreditCard,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
// import { FadeIn, ScaleIn, SlideIn } from "@/components/animations";
import { FadeIn, ScaleIn } from "@/components/animations";
import { useParams } from "next/navigation";

// Mock doctor data
const DOCTOR_DATA = {
  "1": {
    name: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    clinic: "Central Health Clinic",
    consultationFee: 50,
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviews: 156,
    timeRange: "09:00 - 12:00",
  },
};

export default function BookingPage({ params }: { params: { id: string } }) {
  // params nanti untuk mengambil doctor ID dari URL
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [patientComplaint, setPatientComplaint] = useState("");

  // ambil param dari URL
  const { id } = useParams();

  // cek login, nanti diimplementasi dengan auth context jika login page sudah siap
  // if (!user) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
  //       <p>Please log in to book an appointment.</p>
  //     </div>
  //   );
  // }

  const doctor = DOCTOR_DATA["1" as keyof typeof DOCTOR_DATA];
  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleValidatedDate = (dateStr: string) => {
    const selected = new Date(dateStr);
    const today = new Date(new Date().toDateString());
    if (selected < today) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Date",
        text: "Please select a valid date.",
      });
    }

    if ((selected.getTime() - today.getTime()) / (1000 * 3600 * 24) > 2) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Date",
        text: "You can only book up to 1 day in advance.",
      });
    }
    setSelectedDate(dateStr);
    setStep(2);
  };

  const handleBooking = async () => {
    console.log("Booking confirmed:", {
      selectedDate,
      timeRange: doctor.timeRange,
      patientComplaint,
    });
    setStep(3);

    // nanti kalo cookies dari login udah siap, tambahin cookies di fetch ini
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // nanti tambahin user ID dari localStorage
        patientId: "1", // sementara hardcode dulu
        doctorId: id,
        scheduleDate: selectedDate,
        timeRange: doctor.timeRange,
        complaint: patientComplaint,
      }),
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={!!user}
        userRole={user?.role || "patient"}
        userName={user?.name || "Guest"}
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
          <FadeIn direction="up" delay={0}>
            <Link href="/doctors">
              <Button
                variant="ghost"
                className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Doctors
              </Button>
            </Link>
          </FadeIn>
          <FadeIn direction="up" delay={100}>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shrink-0 shadow-md">
                {doctor.image ? (
                  <>
                    <Image
                      src={doctor.image}
                      alt={doctor.name}
                      fill
                      unoptimized
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector(
                            ".image-fallback"
                          ) as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }
                      }}
                    />
                    <div className="image-fallback hidden w-full h-full items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-xl">
                      {initials}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-xl">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                  {doctor.name}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  {doctor.specialization} • {doctor.clinic}
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Progress Stepper */}
        <FadeIn direction="up" delay={200}>
          <Card className="p-6 mb-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              {[
                { num: 1, label: "Select Schedule" },
                { num: 2, label: "Confirm Booking" },
                // { num: 3, label: "Payment" },
                { num: 3, label: "Complete" },
              ].map((item, index) => (
                <div key={item.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all border-2 shadow-md ${
                        item.num < step
                          ? "bg-green-500 text-white border-green-600"
                          : item.num === step
                          ? "bg-primary text-primary-foreground border-primary shadow-lg"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {item.num < step ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        item.num
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold mt-2 text-center ${
                        item.num <= step
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 -mt-6 rounded-full transition-all ${
                        item.num < step ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>

        {/* Step 1: Select Schedule */}
        {step === 1 && (
          <FadeIn direction="up" delay={300} key="step1">
            <Card className="p-6 lg:p-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Select Your Appointment Date & Time
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                    Select Date
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    // onChange={(e) => handleValidatedDate(e.target.value)}
                    className="w-full h-12 border-2 focus:border-primary text-base"
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                      Available Time
                    </label>
                    <div className="flex items-center gap-3 p-4 bg-linear-to-br from-primary/10 to-accent/10 rounded-xl border-2 border-primary/20">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                          Time Range
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {doctor.timeRange}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This doctor has one schedule per day. Your appointment
                      will be scheduled within this time range.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                    Patient Complaint
                  </label>
                  <Textarea
                    value={patientComplaint}
                    onChange={(e) => setPatientComplaint(e.target.value)}
                    placeholder="Please describe your symptoms or concerns..."
                    className="w-full min-h-32 border-2 focus:border-primary text-base resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Please describe your symptoms or concerns to help the doctor
                    prepare for your consultation
                  </p>
                </div>
              </div>

              <Button
                // onClick={() => setStep(2)}
                onClick={() => handleValidatedDate(selectedDate)}
                disabled={!selectedDate}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all font-medium disabled:opacity-50"
              >
                Continue to Confirmation
              </Button>
            </Card>
          </FadeIn>
        )}

        {/* Step 2: Confirm Booking */}
        {step === 2 && (
          <FadeIn direction="up" delay={300} key="step2">
            <Card className="p-6 lg:p-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Confirm Your Appointment
                </h2>
              </div>

              <div className="bg-linear-to-br from-muted/50 to-muted/30 rounded-xl p-6 border-2 border-border space-y-5">
                <div className="flex items-start gap-4 pb-4 border-b-2 border-border">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/20 shrink-0 shadow-md">
                    {doctor.image ? (
                      <>
                        <Image
                          src={doctor.image}
                          alt={doctor.name}
                          fill
                          unoptimized
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = parent.querySelector(
                                ".image-fallback"
                              ) as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }
                          }}
                        />
                        <div className="image-fallback hidden w-full h-full items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-lg">
                          {initials}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-lg">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Doctor
                    </p>
                    <p className="font-bold text-foreground text-lg mb-1">
                      {doctor?.name}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {doctor?.specialization}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                        Clinic
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {doctor?.clinic}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                        Date & Time
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedDate} ({doctor.timeRange})
                      </p>
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border-2 border-primary/20">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                        Consultation Fee
                      </p>
                      <p className="text-lg font-bold text-primary">
                        ${doctor?.consultationFee}
                      </p>
                    </div>
                  </div> */}
                  {patientComplaint && (
                    <div className="flex items-start gap-3 p-3 bg-card/50 rounded-lg border border-border">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Patient Complaint
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {patientComplaint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 border-2 hover:bg-muted hover:border-primary/30 transition-all font-medium"
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleBooking()}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all font-medium"
                >
                  Confirm Booking
                </Button>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Step 3: Payment */}
        {/* {step === 3 && (
          <FadeIn direction="up" delay={300} key="step3">
            <Card className="p-6 lg:p-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Payment</h2>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  This is a demo. Click "Confirm Payment" to proceed (no actual
                  payment processed).
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-4 border-b-2 border-border">
                  <span className="text-muted-foreground font-medium">
                    Consultation Fee
                  </span>
                  <span className="font-semibold text-foreground text-lg">
                    ${doctor?.consultationFee}
                  </span>
                </div>
                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-primary/10 to-accent/10 px-4 rounded-xl border-2 border-primary/20">
                  <span className="font-bold text-foreground text-lg">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    ${doctor?.consultationFee}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
                    Card Number
                  </label>
                  <Input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full h-12 border-2 focus:border-primary text-base"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
                      Expiry
                    </label>
                    <Input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full h-12 border-2 focus:border-primary text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
                      CVV
                    </label>
                    <Input
                      type="text"
                      placeholder="123"
                      className="w-full h-12 border-2 focus:border-primary text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-12 border-2 hover:bg-muted hover:border-primary/30 transition-all font-medium"
                >
                  Back
                </Button>
                <Button
                  onClick={handleBooking}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all font-medium"
                >
                  Confirm Payment
                </Button>
              </div>
            </Card>
          </FadeIn>
        )} */}

        {/* Step 4: Success */}
        {step === 3 && (
          <ScaleIn delay={0} key="step4">
            <Card className="p-6 lg:p-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm text-center space-y-6">
              <div className="w-20 h-20 bg-linear-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Booking Confirmed!
                </h2>
                <p className="text-muted-foreground">
                  Your appointment has been successfully booked.
                </p>
              </div>

              <div className="bg-linear-to-br from-muted/50 to-muted/30 rounded-xl p-6 border-2 border-border text-left space-y-4">
                <div className="pb-4 border-b-2 border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Booking ID
                  </p>
                  <p className="text-xl font-mono font-bold text-primary">
                    {/* hardcode, harusnya nanti ambil dari database */}
                    MQ-2024-001283
                  </p>
                </div>
                <div className="pb-4 border-b-2 border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Queue Number
                  </p>
                  <p className="text-xl font-mono font-bold text-primary">
                    {/* hardcode, harusnya nanti ambil dari database */}
                    A-0234
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Appointment Details
                  </p>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {doctor?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate} ({doctor.timeRange})
                  </p>
                </div>
              </div>

              <Link href="/my-queue">
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all font-medium">
                  View Your Queue
                </Button>
              </Link>
            </Card>
          </ScaleIn>
        )}
      </main>
    </div>
  );
}

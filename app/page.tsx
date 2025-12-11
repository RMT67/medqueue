"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Clock,
  Brain,
  Lock,
  Shield,
  Calendar,
  Stethoscope,
  Users,
  CheckCircle2,
  Activity,
  Star,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

// Animated Counter Component
function AnimatedCounter({
  end,
  duration = 2000,
  suffix = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            let start = 0;
            const increment = end / (duration / 16);
            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                setCount(end);
                clearInterval(timer);
              } else {
                setCount(Math.floor(start));
              }
            }, 16);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  const displayValue = suffix === "K+" ? `${count}K+` : `${count}${suffix}`;

  return (
    <div ref={ref} className="text-3xl font-bold text-primary">
      {displayValue}
    </div>
  );
}

// Fade In Component
function FadeIn({
  children,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setIsVisible(true), delay);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const directionClasses = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible
          ? "opacity-100 translate-y-0 translate-x-0"
          : `opacity-0 ${directionClasses[direction]}`
      }`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/5 py-24 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <FadeIn delay={0}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                  <Stethoscope className="w-4 h-4" />
                  <span>Trusted by 50+ Clinics</span>
                </div>
              </FadeIn>

              <FadeIn delay={100} direction="up">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                  Smart Healthcare
                  <span className="block mt-2 text-primary">
                    Queue Management
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={200} direction="up">
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Experience seamless clinic visits with AI-powered queue
                  management. Book appointments, track your position in
                  real-time, and skip the waiting room.
                </p>
              </FadeIn>

              <FadeIn delay={300} direction="up">
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/doctors">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-lg px-8 py-6 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
                    >
                      Find a Doctor{" "}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/login/patient">
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 py-6 hover:scale-105 transition-transform duration-300"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </FadeIn>

              {/* Stats */}
              <FadeIn delay={400} direction="up">
                <div className="grid grid-cols-3 gap-6 pt-8">
                  <div className="group hover:scale-110 transition-transform duration-300">
                    <AnimatedCounter end={10} suffix="K+" />
                    <div className="text-sm text-muted-foreground">
                      Active Patients
                    </div>
                  </div>
                  <div className="group hover:scale-110 transition-transform duration-300">
                    <AnimatedCounter end={50} suffix="+" />
                    <div className="text-sm text-muted-foreground">
                      Partner Clinics
                    </div>
                  </div>
                  <div className="group hover:scale-110 transition-transform duration-300">
                    <AnimatedCounter end={98} suffix="%" />
                    <div className="text-sm text-muted-foreground">
                      Satisfaction
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right Visual */}
            <FadeIn delay={200} direction="left">
              <div className="relative hidden lg:block">
                <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 backdrop-blur-sm border border-primary/20 hover:scale-105 transition-transform duration-500 animate-float">
                  <div className="bg-card rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Stethoscope className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            Dr. Sarah Johnson
                          </p>
                          <p className="text-sm text-muted-foreground">
                            General Practitioner
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 animate-spin-slow" />
                        <span className="font-semibold">4.8</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Queue Number
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          A-023
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Patients Ahead
                        </span>
                        <span className="font-semibold">2</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Est. Wait Time
                        </span>
                        <span className="font-semibold text-accent">
                          15 min
                        </span>
                      </div>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        Status
                      </p>
                      <p className="font-semibold text-primary">Waiting</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <FadeIn direction="up">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Why Choose <span className="text-primary">MedQueue.ai</span>?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Modern healthcare management designed for patients and medical
                professionals
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <FadeIn delay={0} direction="up">
              <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg group hover:scale-105 duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors group-hover:scale-110 group-hover:rotate-6 duration-300">
                  <Clock className="w-8 h-8 text-primary group-hover:animate-spin-slow" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Real-time Queue Tracking
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor your position in the queue with live updates. Get
                  instant notifications when it's your turn, so you can plan
                  your arrival perfectly.
                </p>
              </Card>
            </FadeIn>

            {/* Feature 2 */}
            <FadeIn delay={100} direction="up">
              <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg group hover:scale-105 duration-300">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors group-hover:scale-110 group-hover:rotate-6 duration-300">
                  <Brain className="w-8 h-8 text-accent group-hover:animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  AI-Powered Predictions
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Advanced machine learning algorithms analyze historical data
                  to provide accurate wait time estimates, helping you manage
                  your schedule efficiently.
                </p>
              </Card>
            </FadeIn>

            {/* Feature 3 */}
            <FadeIn delay={200} direction="up">
              <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg group hover:scale-105 duration-300">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors group-hover:scale-110 group-hover:rotate-6 duration-300">
                  <Shield className="w-8 h-8 text-secondary group-hover:animate-bounce" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Secure & Private
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your medical information is protected with bank-level
                  encryption. We comply with healthcare data privacy regulations
                  to keep your data safe.
                </p>
              </Card>
            </FadeIn>

            {/* Feature 4 */}
            <FadeIn delay={300} direction="up">
              <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg group hover:scale-105 duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors group-hover:scale-110 group-hover:rotate-6 duration-300">
                  <Calendar className="w-8 h-8 text-primary group-hover:animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Easy Booking
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Book appointments in seconds. View doctor availability, select
                  your preferred time slot, and confirm your visit with just a
                  few clicks.
                </p>
              </Card>
            </FadeIn>

            {/* Feature 5 */}
            <FadeIn delay={400} direction="up">
              <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg group hover:scale-105 duration-300">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors group-hover:scale-110 group-hover:rotate-6 duration-300">
                  <Activity className="w-8 h-8 text-accent group-hover:animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Smart Notifications
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Receive timely alerts about your appointment status, queue
                  position changes, and reminders to ensure you never miss your
                  visit.
                </p>
              </Card>
            </FadeIn>

            {/* Feature 6 */}
            <FadeIn delay={500} direction="up">
              <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg group hover:scale-105 duration-300">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors group-hover:scale-110 group-hover:rotate-6 duration-300">
                  <Users className="w-8 h-8 text-secondary group-hover:animate-bounce" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Trusted Network
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Access a network of verified healthcare professionals. Read
                  reviews, check ratings, and choose the best doctor for your
                  needs.
                </p>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
        {/* Professional Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23000000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <FadeIn direction="up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Activity className="w-4 h-4" />
                <span>Simple Process</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                How It <span className="text-primary">Works</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get started in three simple steps and experience seamless
                healthcare management
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Step 1 */}
            <FadeIn delay={0} direction="up">
              <div className="relative group h-full flex flex-col">
                {/* Connector Arrow */}
                <div className="hidden md:block absolute top-24 -right-6 lg:-right-12 z-10">
                  <div className="flex items-center">
                    <div className="w-12 lg:w-16 h-0.5 bg-gradient-to-r from-primary to-accent" />
                    <ArrowRight className="w-5 h-5 text-primary -ml-1" />
                  </div>
                </div>

                <div className="bg-card border-2 border-primary/20 rounded-3xl p-8 text-center relative z-10 hover:border-primary/50 hover:scale-105 transition-all duration-300 hover:shadow-2xl group-hover:bg-gradient-to-br group-hover:from-card group-hover:to-primary/5 h-full flex flex-col">
                  {/* Step Number Badge */}
                  <div className="relative mb-6 flex-shrink-0">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <span className="text-4xl font-bold text-primary-foreground">
                        1
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-4 flex-shrink-0">
                    Find Your Doctor
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                    Browse our network of qualified healthcare professionals.
                    Filter by specialization, location, or availability to find
                    the perfect match.
                  </p>
                  <div className="flex justify-center gap-2 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary/30" />
                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Step 2 */}
            <FadeIn delay={200} direction="up">
              <div className="relative group h-full flex flex-col">
                {/* Connector Arrow */}
                <div className="hidden md:block absolute top-24 -right-6 lg:-right-12 z-10">
                  <div className="flex items-center">
                    <div className="w-12 lg:w-16 h-0.5 bg-gradient-to-r from-primary to-accent" />
                    <ArrowRight className="w-5 h-5 text-primary -ml-1" />
                  </div>
                </div>

                <div className="bg-card border-2 border-primary/20 rounded-3xl p-8 text-center relative z-10 hover:border-primary/50 hover:scale-105 transition-all duration-300 hover:shadow-2xl group-hover:bg-gradient-to-br group-hover:from-card group-hover:to-accent/5 h-full flex flex-col">
                  {/* Step Number Badge */}
                  <div className="relative mb-6 flex-shrink-0">
                    <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <span className="text-4xl font-bold text-accent-foreground">
                        2
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-4 flex-shrink-0">
                    Book Appointment
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                    Select your preferred date and time. Complete secure payment
                    and receive instant confirmation with your queue number.
                  </p>
                  <div className="flex justify-center gap-2 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-accent/30" />
                    <div className="w-2 h-2 rounded-full bg-accent/50" />
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Step 3 */}
            <FadeIn delay={400} direction="up">
              <div className="relative group h-full flex flex-col">
                <div className="bg-card border-2 border-primary/20 rounded-3xl p-8 text-center relative z-10 hover:border-primary/50 hover:scale-105 transition-all duration-300 hover:shadow-2xl group-hover:bg-gradient-to-br group-hover:from-card group-hover:to-secondary/5 h-full flex flex-col">
                  {/* Step Number Badge */}
                  <div className="relative mb-6 flex-shrink-0">
                    <div className="w-24 h-24 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <span className="text-4xl font-bold text-secondary-foreground">
                        3
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-4 flex-shrink-0">
                    Track & Visit
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                    Monitor your queue position in real-time. Get notified when
                    it's your turn and arrive just in time for your appointment.
                  </p>
                  <div className="flex justify-center gap-2 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-secondary/30" />
                    <div className="w-2 h-2 rounded-full bg-secondary/50" />
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* CTA at bottom */}
          <FadeIn delay={600} direction="up">
            <div className="text-center mt-16">
              <Link href="/doctors">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                >
                  Start Your Journey <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <FadeIn direction="up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span>Testimonials</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                What Our <span className="text-primary">Patients Say</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Real experiences from people who trust MedQueue.ai
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Patient",
                rating: 5,
                text: "MedQueue.ai has completely transformed my clinic visits. I can now plan my day better knowing exactly when I'll be seen. The AI predictions are incredibly accurate!",
                avatar: "SC",
                gradient: "from-primary to-primary/80",
              },
              {
                name: "Michael Rodriguez",
                role: "Patient",
                rating: 5,
                text: "No more waiting in crowded waiting rooms. I love being able to track my queue position and arrive just in time. This is the future of healthcare!",
                avatar: "MR",
                gradient: "from-accent to-accent/80",
              },
              {
                name: "Dr. Priya Patel",
                role: "Healthcare Provider",
                rating: 5,
                text: "As a doctor, MedQueue.ai has streamlined our operations significantly. Patients are happier, and our clinic runs more efficiently. Highly recommended!",
                avatar: "PP",
                gradient: "from-secondary to-secondary/80",
              },
            ].map((testimonial, i) => (
              <FadeIn key={i} delay={i * 150} direction="up">
                <Card className="p-8 border-2 border-primary/10 hover:border-primary/30 hover:shadow-2xl transition-all hover:scale-105 duration-300 group relative overflow-hidden bg-card">
                  {/* Background Gradient on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  {/* Quote Icon */}
                  <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg
                      className="w-16 h-16 text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  <div className="relative z-10">
                    {/* Avatar & Rating */}
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        {testimonial.avatar}
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 px-3 py-1.5 rounded-full">
                        {[...Array(testimonial.rating)].map((_, j) => (
                          <Star
                            key={j}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                        <span className="ml-1 text-sm font-semibold text-foreground">
                          {testimonial.rating}.0
                        </span>
                      </div>
                    </div>

                    {/* Testimonial Text */}
                    <p className="text-muted-foreground mb-6 leading-relaxed text-base relative z-10">
                      "{testimonial.text}"
                    </p>

                    {/* Author Info */}
                    <div className="pt-6 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground text-lg">
                            {testimonial.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {testimonial.role}
                            </p>
                            {testimonial.role === "Healthcare Provider" && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity`}
                        >
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>

          {/* Trust Indicators */}
          <FadeIn delay={600} direction="up">
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-8 px-8 py-4 bg-card border border-border rounded-2xl shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4.9/5</div>
                  <div className="text-xs text-muted-foreground">
                    Average Rating
                  </div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">2,500+</div>
                  <div className="text-xs text-muted-foreground">
                    Happy Patients
                  </div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">98%</div>
                  <div className="text-xs text-muted-foreground">
                    Satisfaction Rate
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary to-accent text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <FadeIn direction="up">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your Healthcare Experience?
            </h2>
          </FadeIn>
          <FadeIn delay={100} direction="up">
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of patients and healthcare providers who are
              already using MedQueue.ai to make healthcare more accessible and
              efficient.
            </p>
          </FadeIn>
          <FadeIn delay={200} direction="up">
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/doctors">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6 hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-xl"
                >
                  Get Started Now{" "}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login/patient">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 bg-transparent border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 hover:scale-110 transition-transform duration-300"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 border-t border-slate-700/50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <Link
                href="/"
                className="inline-flex items-center gap-3 mb-6 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xl text-white block">
                    MedQueue.ai
                  </span>
                  <span className="text-xs text-slate-400">
                    Healthcare Solutions
                  </span>
                </div>
              </Link>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Modern healthcare queue management system powered by AI.
                Transforming the way patients and providers connect.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span>All systems operational</span>
                </div>
              </div>
            </div>

            {/* For Patients */}
            <div>
              <h4 className="font-bold text-white mb-6 text-base uppercase tracking-wider">
                For Patients
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/doctors"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Find a Doctor</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-queue"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>My Queue</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login/patient"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Sign In</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/doctors"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Book Appointment</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Providers */}
            <div>
              <h4 className="font-bold text-white mb-6 text-base uppercase tracking-wider">
                For Providers
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/doctor/dashboard"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Doctor Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/dashboard"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Admin Portal</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/doctors"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Join Our Network</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login/doctor"
                    className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Provider Login</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white mb-6 text-base uppercase tracking-wider">
                Contact Us
              </h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href="tel:+15551234567"
                    className="flex items-start gap-4 text-slate-300 hover:text-white transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg transition-all shadow-md">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
                        Phone
                      </div>
                      <div className="text-sm font-medium">
                        +1 (555) 123-4567
                      </div>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@medqueue.ai"
                    className="flex items-start gap-4 text-slate-300 hover:text-white transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg transition-all shadow-md">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
                        Email
                      </div>
                      <div className="text-sm font-medium">
                        support@medqueue.ai
                      </div>
                    </div>
                  </a>
                </li>
                <li>
                  <div className="flex items-start gap-4 text-slate-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center flex-shrink-0 shadow-md">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
                        Address
                      </div>
                      <div className="text-sm font-medium">
                        123 Healthcare Ave
                        <br />
                        Medical District, CA 90210
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-slate-700/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-sm text-slate-400">
                <p>
                  © {new Date().getFullYear()} MedQueue.ai. All rights reserved.
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Link
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

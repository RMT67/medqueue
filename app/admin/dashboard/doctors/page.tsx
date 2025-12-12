"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, Plus, Users, Activity, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { DoctorsTab } from "@/components/adminDashboard";
import { DoctorAdmin } from "@/types";

const DOCTORS: DoctorAdmin[] = [
  {
    _id: "675a3d4e8f1c2a3b4c5d6e7f" as unknown as DoctorAdmin["_id"],
    name: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    clinic: "Central Health Clinic",
    status: "online",
    todayPatients: 12,
    currentQueue: 5,
    currentlyServing: "A-021",
    avgWaitTime: 12,
    completedToday: 7,
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    timeStatus: "onTime",
  },
  {
    _id: "675a3d4e8f1c2a3b4c5d6e80" as unknown as DoctorAdmin["_id"],
    name: "Dr. Michael Chen",
    specialization: "Cardiologist",
    clinic: "Heart Care Medical Center",
    status: "online",
    todayPatients: 8,
    currentQueue: 3,
    currentlyServing: "B-015",
    avgWaitTime: 18,
    completedToday: 5,
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    timeStatus: 5,
  },
  {
    _id: "675a3d4e8f1c2a3b4c5d6e81" as unknown as DoctorAdmin["_id"],
    name: "Dr. Priya Patel",
    specialization: "Pediatrician",
    clinic: "Kids Wellness Clinic",
    status: "offline",
    todayPatients: 0,
    currentQueue: 0,
    currentlyServing: null,
    avgWaitTime: 0,
    completedToday: 0,
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    timeStatus: "onTime",
  },
  {
    _id: "675a3d4e8f1c2a3b4c5d6e82" as unknown as DoctorAdmin["_id"],
    name: "Dr. James Wilson",
    specialization: "Dermatologist",
    clinic: "Skin Care Specialists",
    status: "online",
    todayPatients: 6,
    currentQueue: 2,
    currentlyServing: "C-008",
    avgWaitTime: 10,
    completedToday: 4,
    image:
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    timeStatus: "onTime",
  },
];

export default function DoctorsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="admin"
        userName={user.name}
        onLogout={logout}
      />

      {/* Hero Header */}
      <section className="relative bg-linear-to-br from-primary/10 via-accent/5 to-secondary/5 py-8 lg:py-10 border-b border-border overflow-hidden">
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
                <Shield className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                Manage <span className="text-primary">Doctors</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                View and manage all doctors in the system
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Tabs */}
        <div className="mb-6 lg:mb-8">
          <Card className="p-2 border-2 shadow-lg bg-card/80 backdrop-blur-sm">
            <div className="flex gap-2 overflow-x-auto">
              {(
                [
                  {
                    key: "overview",
                    label: "Overview",
                    path: "/admin/dashboard",
                    icon: Activity,
                  },
                  {
                    key: "doctors",
                    label: "Doctors",
                    path: "/admin/dashboard/doctors",
                    icon: Users,
                  },
                  {
                    key: "schedule",
                    label: "Schedule",
                    path: "/admin/dashboard/schedules",
                    icon: Calendar,
                  },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.path;
                return (
                  <button
                    key={tab.key}
                    onClick={() => router.push(tab.path)}
                    className={`px-5 py-3 rounded-lg font-semibold transition-all whitespace-nowrap capitalize flex items-center gap-2 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <DoctorsTab
          doctors={DOCTORS}
          onAddDoctor={() => setShowAddDoctorModal(true)}
        />
      </main>

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-8 lg:p-10 border-2 shadow-2xl space-y-6 bg-card/95 backdrop-blur-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-accent mb-4 shadow-lg">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Add New Doctor
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Dr. John Doe"
                  className="h-11 border-2 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Specialization
                </label>
                <select className="w-full h-11 px-4 bg-input border-2 border-border rounded-lg text-foreground focus:border-primary transition-colors">
                  <option>Select specialization</option>
                  <option>General Practitioner</option>
                  <option>Cardiologist</option>
                  <option>Dermatologist</option>
                  <option>Pediatrician</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Clinic
                </label>
                <Input
                  type="text"
                  placeholder="Clinic name"
                  className="h-11 border-2 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  License Number
                </label>
                <Input
                  type="text"
                  placeholder="License number"
                  className="h-11 border-2 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDoctorModal(false)}
                className="flex-1 h-12 border-2 hover:bg-muted transition-colors"
              >
                Cancel
              </Button>
              <Button className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                Add Doctor
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

import { Card } from "@/components/ui/card";
import {
  Users,
  Clock,
  Activity,
  CheckCircle2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { DoctorAdmin } from "@/types/docterTypes";
import { DoctorWithSchedule } from "@/types/scheduleTypes";

interface OverviewTabProps {
  stats: {
    totalPatients: number;
    avgWaitTime: string;
    activeDoctors: number;
    completedVisits: number;
  };
  doctors: DoctorAdmin[];
  schedules: DoctorWithSchedule[];
}

export function OverviewTab({ stats, doctors }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total Patients Today
            </p>
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl lg:text-4xl font-bold text-foreground">
            {stats.totalPatients}
          </p>
        </Card>

        <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Avg Wait Time
            </p>
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent to-secondary flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl lg:text-4xl font-bold text-foreground">
            {stats.avgWaitTime}
          </p>
        </Card>

        <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Active Doctors
            </p>
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-secondary to-primary flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl lg:text-4xl font-bold text-foreground">
            {stats.activeDoctors}
          </p>
        </Card>

        <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Completed Visits
            </p>
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl lg:text-4xl font-bold text-foreground">
            {stats.completedVisits}
          </p>
        </Card>
      </div>

      {/* Active Doctors in today */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Active Doctors Today
          </h3>
          <span className="text-sm text-muted-foreground">
            ({doctors.length} doctor{doctors.length !== 1 ? "s" : ""} with
            schedule)
          </span>
        </div>
        {doctors.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No doctors with schedule for today
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {doctors.map((doctor) => {
              const initials = doctor.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              const isOnTime = doctor.timeStatus === "onTime";
              const lateMinutes =
                typeof doctor.timeStatus === "number" ? doctor.timeStatus : 0;

              // Check if doctor is available (from backend: "Available" or "Offline")
              const isAvailable = doctor.status === "Available";

              return (
                <Card
                  key={doctor._id.toString()}
                  className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all"
                >
                  {/* Doctor Header */}
                  <div className="flex items-center gap-4 mb-5">
                    {/* Doctor Photo */}
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 shrink-0 shadow-md">
                      {doctor.image ? (
                        <>
                          <Image
                            src={doctor.image}
                            alt={doctor.name}
                            width={80}
                            height={80}
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
                          <div className="image-fallback hidden w-full h-full absolute inset-0 items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-xl">
                            {initials}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-xl">
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Doctor Info */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground text-lg mb-1 truncate">
                            {doctor.name}
                          </h4>
                          <p className="text-sm text-muted-foreground font-medium mb-1">
                            {doctor.specialization}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doctor.clinic}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${
                            isAvailable
                              ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                              : "bg-gray-50 dark:bg-gray-950/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isAvailable ? "bg-green-500" : "bg-gray-500"
                            }`}
                          />
                          <span>{doctor.status}</span>
                        </div>

                        {/* Time Status */}
                        {isAvailable && (
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${
                              isOnTime
                                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {isOnTime ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>On Time</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Late {lateMinutes}m</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Queue Information */}
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Queue
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {doctor.currentQueue ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        patients waiting
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Avg Wait
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {doctor.avgWaitTime ?? 0} min
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Completed
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {doctor.completedToday ?? 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          today
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Total Today
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {doctor.todayPatients ?? 0} patients
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {/* <Card className="p-6 lg:p-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent to-secondary flex items-center justify-center shadow-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[
            "Dr. Sarah Johnson started session at 09:15",
            "New patient booking for Dr. Michael Chen",
            "Dr. Priya Patel went offline",
            "Patient A-042 completed consultation",
            "System alert: High queue at Central Clinic",
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 px-4 bg-muted/50 rounded-lg border-2 border-border hover:bg-muted hover:border-primary/30 transition-all"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
              <p className="text-sm text-foreground font-medium">{activity}</p>
            </div>
          ))}
        </div>
      </Card> */}
    </div>
  );
}

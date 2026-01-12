import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarView } from "./CalendarView";
import Image from "next/image";
import { DoctorWithSchedule } from "@/types/scheduleTypes";
import {
  Pencil,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Stethoscope,
  MapPin,
  AlertCircle,
} from "lucide-react";

// Translation mapping for day names
const DAY_TRANSLATION: Record<string, string> = {
  Minggu: "Sunday",
  Senin: "Monday",
  Selasa: "Tuesday",
  Rabu: "Wednesday",
  Kamis: "Thursday",
  Jumat: "Friday",
  Sabtu: "Saturday",
  Sunday: "Sunday",
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
};

const translateDay = (day: string): string => {
  return DAY_TRANSLATION[day] || day;
};

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

interface ScheduleTabProps {
  schedules: DoctorWithSchedule[];
  viewMode: "calendar" | "list";
  onEdit: (schedule: DoctorWithSchedule) => void;
  onDelete: (scheduleId: string) => void;
}

export function ScheduleTab({
  schedules,
  viewMode,
  onEdit,
  onDelete,
}: ScheduleTabProps) {
  if (schedules.length === 0) {
    return (
      <Card className="p-12 text-center border-2 shadow-xl bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            No Schedules Found
          </h3>
          <p className="text-muted-foreground max-w-md">
            There are no doctor schedules available. Click &quot;Add
            Schedule&quot; to create a new schedule.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content */}
      {viewMode === "calendar" ? (
        <CalendarView schedules={schedules} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => {
            const availableDays = schedule.dayOfWeek.filter(
              (day) => day.available
            );
            const initials = getInitials(
              schedule.doctorInfo?.name ?? "Unknown Doctor"
            );

            return (
              <Card
                key={schedule._id}
                className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all flex flex-col"
              >
                {/* Doctor Header */}
                <div className="flex items-start gap-4 mb-5 pb-5 border-b-2 border-border">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shrink-0 shadow-md">
                    {schedule.doctorInfo?.image ? (
                      <>
                        <Image
                          src={schedule.doctorInfo.image}
                          alt={schedule.doctorInfo.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
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
                        <div className="image-fallback hidden w-full h-full absolute inset-0 items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-lg">
                          {initials}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-lg">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg mb-1 truncate">
                      {schedule.doctorInfo?.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Stethoscope className="w-3.5 h-3.5 text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground font-medium truncate">
                        {schedule.doctorInfo?.specialization}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">
                        {schedule.doctorInfo?.clinic}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule Days */}
                <div className="space-y-2 mb-5 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Available Days ({availableDays.length})
                    </p>
                  </div>
                  {availableDays.length > 0 ? (
                    <div className="space-y-2">
                      {availableDays.map((day, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-linear-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-sm font-semibold text-foreground">
                              {translateDay(day.hari)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {day.startTime} - {day.endTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                      <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        No available days
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5 pt-4 border-t border-border">
                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Max Patients
                      </p>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {schedule.maxPatients}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Delay
                      </p>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {schedule.delayMinutes} min
                    </p>
                  </div>
                </div>

                {/* First Call Time */}
                {schedule.firstCallTime && (
                  <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                          First Call Time
                        </p>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                          {schedule.firstCallTime}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-between mb-5 pb-5 border-b border-border">
                  <div className="flex items-center gap-2">
                    {schedule.isAvailable ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                          Available
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                          Unavailable
                        </span>
                      </div>
                    )}
                  </div>
                  {schedule.isOnTime && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                        On Time
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-2 hover:bg-muted hover:border-primary/30 transition-all"
                    onClick={() => onEdit(schedule)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 border-2 hover:bg-destructive/90 transition-all"
                    onClick={() => onDelete(schedule._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

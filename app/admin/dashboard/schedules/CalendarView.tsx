import { Card } from "@/components/ui/card";
import { Calendar, Clock, Users } from "lucide-react";
import Image from "next/image";
import { DoctorWithSchedule } from "@/types/scheduleTypes";

interface CalendarViewProps {
  schedules: DoctorWithSchedule[];
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const COLORS = [
  "bg-green-500 border-green-600 text-white hover:bg-green-600",
  "bg-blue-500 border-blue-600 text-white hover:bg-blue-600",
  "bg-purple-500 border-purple-600 text-white hover:bg-purple-600",
  "bg-amber-500 border-amber-600 text-white hover:bg-amber-600",
  "bg-pink-500 border-pink-600 text-white hover:bg-pink-600",
  "bg-indigo-500 border-indigo-600 text-white hover:bg-indigo-600",
  "bg-teal-500 border-teal-600 text-white hover:bg-teal-600",
  "bg-rose-500 border-rose-600 text-white hover:bg-rose-600",
];

// Translation mapping for day names
const DAY_TRANSLATION: Record<string, string> = {
  Minggu: "Sunday",
  Senin: "Monday",
  Selasa: "Tuesday",
  Rabu: "Wednesday",
  Kamis: "Thursday",
  Jumat: "Friday",
  Sabtu: "Saturday",
};

const normalizeDay = (day: string): string => {
  return DAY_TRANSLATION[day] || day;
};

export function CalendarView({ schedules }: CalendarViewProps) {
  const getColorForDoctor = (index: number) => {
    return COLORS[index % COLORS.length];
  };

  const getScheduleForDay = (schedule: DoctorWithSchedule, day: string) => {
    return schedule.dayOfWeek.find(
      (d) => normalizeDay(d.hari) === day && d.available
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Weekly Schedule
            </h2>
            <p className="text-sm text-muted-foreground">
              Doctor availability calendar - Each row represents one doctor
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-2 shadow-xl bg-card/80 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header - Days of Week */}
            <div className="grid grid-cols-8 border-b-2 border-border bg-muted/50 sticky top-0 z-20">
              <div className="p-4 border-r border-border bg-muted/70">
                <span className="font-semibold text-sm text-foreground uppercase tracking-wide">
                  Doctor
                </span>
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-4 text-center font-semibold text-sm text-foreground uppercase tracking-wide border-r border-border last:border-r-0 bg-muted/70"
                >
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Doctor Rows */}
            <div>
              {schedules.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Calendar className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No schedules available
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Create a schedule to see it in the calendar view
                    </p>
                  </div>
                </div>
              ) : (
                schedules.map((schedule, doctorIndex) => (
                  <div
                    key={schedule._id}
                    className="grid grid-cols-8 border-b border-border hover:bg-muted/10 transition-colors last:border-b-0"
                  >
                    {/* Doctor Info Column */}
                    <div className="p-4 border-r border-border bg-muted/20 flex items-center gap-3 sticky left-0 z-10 backdrop-blur-sm">
                      {schedule.doctorInfo?.image ? (
                        <Image
                          src={schedule.doctorInfo.image}
                          alt={schedule.doctorInfo.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-primary/20 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center border-2 border-primary/20 shadow-sm shrink-0">
                          <span className="text-white font-bold text-xs">
                            {schedule.doctorInfo?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) ?? "DR"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {schedule.doctorInfo?.name ?? "Unknown Doctor"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {schedule.doctorInfo?.specialization ?? "General"}
                        </p>
                      </div>
                    </div>

                    {/* Day Columns */}
                    {DAYS.map((day) => {
                      const daySchedule = getScheduleForDay(schedule, day);

                      return (
                        <div
                          key={`${schedule._id}-${day}`}
                          className="border-r border-border last:border-r-0 p-2 min-h-24 flex items-center justify-center bg-background/50"
                        >
                          {daySchedule ? (
                            <div
                              className={`w-full p-3 rounded-lg border-2 shadow-md hover:shadow-lg transition-all cursor-pointer ${getColorForDoctor(
                                doctorIndex
                              )}`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span className="text-xs font-bold">
                                    {daySchedule.startTime} -{" "}
                                    {daySchedule.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 shrink-0" />
                                  <span className="text-xs font-medium">
                                    Max: {schedule.maxPatients}
                                  </span>
                                </div>
                                {schedule.isOnTime && (
                                  <div className="text-[10px] font-semibold bg-white/40 dark:bg-white/20 rounded px-1.5 py-0.5 inline-block mt-1">
                                    ✓ On Time
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground/40 font-medium">
                              —
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 bg-muted/30 border-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 text-primary" />
          <span>
            Each colored block represents a doctor&apos;s available schedule for
            that day.
            <span className="font-semibold text-foreground ml-1">
              {schedules.length} doctor{schedules.length !== 1 ? "s" : ""}{" "}
              scheduled
            </span>
          </span>
        </div>
      </Card>
    </div>
  );
}

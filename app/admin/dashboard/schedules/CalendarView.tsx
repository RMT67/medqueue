import { Card } from "@/components/ui/card";
import { Calendar, Clock, Users } from "lucide-react";
import Image from "next/image";
import { DoctorWithSchedule } from "@/types/scheduleTypes";

interface CalendarViewProps {
  schedules: DoctorWithSchedule[];
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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

      <Card className="overflow-hidden border-2">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header - Days of Week */}
            <div className="grid grid-cols-8 border-b-2 bg-muted/30 sticky top-0 z-20">
              <div className="p-4 border-r bg-muted/50">
                <span className="font-bold text-sm">Doctor</span>
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-4 text-center font-bold text-sm border-r last:border-r-0 bg-muted/50"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Doctor Rows */}
            <div>
              {schedules.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No schedules available
                </div>
              ) : (
                schedules.map((schedule, doctorIndex) => (
                  <div
                    key={schedule._id}
                    className="grid grid-cols-8 border-b hover:bg-muted/20 transition-colors"
                  >
                    {/* Doctor Info Column */}
                    <div className="p-4 border-r bg-muted/10 flex items-center gap-3">
                      {schedule.doctorInfo.image && (
                        <Image
                          src={schedule.doctorInfo.image}
                          alt={schedule.doctorInfo.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
                          {schedule.doctorInfo.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {schedule.doctorInfo.specialization}
                        </p>
                      </div>
                    </div>

                    {/* Day Columns */}
                    {DAYS.map((day) => {
                      const daySchedule = getScheduleForDay(schedule, day);

                      return (
                        <div
                          key={`${schedule._id}-${day}`}
                          className="border-r last:border-r-0 p-2 min-h-20 flex items-center justify-center"
                        >
                          {daySchedule ? (
                            <div
                              className={`w-full p-3 rounded-lg border-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${getColorForDoctor(
                                doctorIndex
                              )}`}
                            >
                              <div className="space-y-1.5">
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
                                  <div className="text-[10px] font-semibold bg-white/30 rounded px-1.5 py-0.5 inline-block">
                                    On Time
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground/50">
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
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            Each colored block represents a doctor&apos;s available schedule for
            that day
          </span>
        </div>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, List } from "lucide-react";
import { CalendarView } from "./CalendarView";
import Image from "next/image";
import { DoctorWithSchedule } from "@/types/scheduleTypes";

interface ScheduleTabProps {
  schedules: DoctorWithSchedule[];
}

export function ScheduleTab({ schedules }: ScheduleTabProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  if (schedules.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No schedules found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
            viewMode === "calendar"
              ? "bg-primary text-white border-primary"
              : "bg-card border-border hover:border-primary/50"
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Calendar View</span>
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
            viewMode === "list"
              ? "bg-primary text-white border-primary"
              : "bg-card border-border hover:border-primary/50"
          }`}
        >
          <List className="w-4 h-4" />
          <span className="text-sm font-medium">List View</span>
        </button>
      </div>

      {/* Content */}
      {viewMode === "calendar" ? (
        <CalendarView schedules={schedules} />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {schedules.map((schedule) => (
            <Card
              key={schedule._id}
              className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                {schedule.doctorInfo.image && (
                  <Image
                    src={schedule.doctorInfo.image}
                    alt={schedule.doctorInfo.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-xl mb-1">
                    {schedule.doctorInfo.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {schedule.doctorInfo.specialization}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {schedule.doctorInfo.clinic}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {schedule.dayOfWeek
                  .filter((day) => day.availabel)
                  .map((day, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                    >
                      <span className="text-sm font-medium">{day.hari}</span>
                      <span className="text-sm text-muted-foreground">
                        {day.startTime} - {day.endTime}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                <span className="text-muted-foreground">Max Patients:</span>
                <span className="font-bold">{schedule.maxPatients}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

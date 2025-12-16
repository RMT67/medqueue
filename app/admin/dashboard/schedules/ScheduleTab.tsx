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
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No schedules found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

              {/* Schedule Days */}
              <div className="space-y-2 mb-4">
                {schedule.dayOfWeek
                  .filter((day) => day.available)
                  .map((day, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                    >
                      <span className="text-sm font-medium">
                        {translateDay(day.hari)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {day.startTime} - {day.endTime}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Max Patients
                    </p>
                    <p className="font-bold">{schedule.maxPatients}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delay</p>
                    <p className="font-bold">{schedule.delayMinutes} min</p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                  {schedule.isAvailable ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {schedule.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                {schedule.isOnTime && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    On Time
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(schedule)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onDelete(schedule._id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

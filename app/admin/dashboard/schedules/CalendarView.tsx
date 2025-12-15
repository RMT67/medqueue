import { Card } from "@/components/ui/card";
import { Calendar, Clock, Users } from "lucide-react";
import Image from "next/image";
import { DaySchedule, DoctorWithSchedule } from "@/types/scheduleTypes";

interface CalendarViewProps {
  schedules: DoctorWithSchedule[];
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const COLORS = [
  "bg-green-100 border-green-300 text-green-800",
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
];

export function CalendarView({ schedules }: CalendarViewProps) {
  const getColorForDoctor = (index: number) => {
    return COLORS[index % COLORS.length];
  };

  const getScheduleForDayAndTime = (day: string, time: string) => {
    const results: Array<{
      schedule: DoctorWithSchedule;
      daySchedule: DaySchedule;
      colorClass: string;
    }> = [];

    schedules.forEach((schedule, index) => {
      const daySchedule = schedule.dayOfWeek.find(
        (d) => d.hari === day && d.availabel
      );

      if (daySchedule) {
        const startHour = parseInt(daySchedule.startTime.split(":")[0]);
        const timeHour = parseInt(time.split(":")[0]);

        if (timeHour === startHour) {
          results.push({
            schedule,
            daySchedule,
            colorClass: getColorForDoctor(index),
          });
        }
      }
    });

    return results;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = parseInt(startTime.split(":")[0]);
    const end = parseInt(endTime.split(":")[0]);
    return end - start;
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
              Doctor availability calendar
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-2">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header - Days of Week */}
            <div className="grid grid-cols-8 border-b-2 bg-muted/30">
              <div className="p-4 border-r"></div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-4 text-center font-bold text-sm border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Time Slots Grid */}
            <div className="relative">
              {TIME_SLOTS.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-8 border-b last:border-b-0"
                >
                  {/* Time Label */}
                  <div className="p-4 text-sm text-muted-foreground font-medium border-r bg-muted/20">
                    {time}
                  </div>

                  {/* Day Cells */}
                  {DAYS.map((day) => {
                    const scheduleItems = getScheduleForDayAndTime(day, time);

                    return (
                      <div
                        key={`${day}-${time}`}
                        className="border-r last:border-r-0 min-h-20 p-2 relative"
                      >
                        {scheduleItems.map((item, index) => {
                          const duration = calculateDuration(
                            item.daySchedule.startTime,
                            item.daySchedule.endTime
                          );
                          const height = duration * 80; // 80px per hour

                          return (
                            <div
                              key={`${item.schedule._id}-${index}`}
                              className={`absolute left-2 right-2 p-3 rounded-lg border-2 ${item.colorClass} shadow-sm hover:shadow-md transition-all cursor-pointer`}
                              style={{
                                height: `${height - 8}px`,
                                zIndex: 10,
                              }}
                            >
                              <div className="space-y-1">
                                <p className="font-bold text-sm line-clamp-1">
                                  {item.schedule.doctorInfo.name}
                                </p>
                                <p className="text-xs opacity-80 line-clamp-1">
                                  {item.schedule.doctorInfo.specialization}
                                </p>
                                <div className="flex items-center gap-1 text-xs">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {item.daySchedule.startTime} -{" "}
                                    {item.daySchedule.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <Users className="w-3 h-3" />
                                  <span>Max: {item.schedule.maxPatients}</span>
                                </div>
                                {item.schedule.doctorInfo.image && (
                                  <Image
                                    src={item.schedule.doctorInfo.image}
                                    alt={item.schedule.doctorInfo.name}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded-full object-cover mt-2"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="font-bold text-sm mb-3">Doctors</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {schedules.map((schedule, index) => (
            <div
              key={schedule._id}
              className="flex items-center gap-2 p-2 rounded-lg border"
            >
              <div
                className={`w-4 h-4 rounded ${
                  getColorForDoctor(index).split(" ")[0]
                }`}
              ></div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {schedule.doctorInfo.image && (
                  <Image
                    src={schedule.doctorInfo.image}
                    alt={schedule.doctorInfo.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span className="text-sm font-medium truncate">
                  {schedule.doctorInfo.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

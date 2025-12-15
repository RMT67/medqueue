import { getDb } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";
import DoctorModel from "@/db/models/Doctor";
import DoctorScheduleModel from "@/db/models/DoctorSchedule";

/**
 * Calculate estimated call time based on patients ahead and average service time
 */
export function calculateEstimatedCallTime(
  patientsAhead: number,
  averageServiceTime: number, // in minutes
  currentTime: Date = new Date()
): {
  estimatedTime: number; // total minutes
  estimatedCallTime: string; // HH:mm format
  estimatedCallTimeTimestamp: Date;
  estimatedCallTimeFormatted: string;
} {
  if (patientsAhead === 0) {
    return {
      estimatedTime: 0,
      estimatedCallTime: currentTime.toTimeString().slice(0, 5),
      estimatedCallTimeTimestamp: currentTime,
      estimatedCallTimeFormatted: "Any moment now"
    };
  }

  const totalWaitMinutes = patientsAhead * averageServiceTime;
  const callTime = new Date(currentTime.getTime() + totalWaitMinutes * 60 * 1000);

  const hours = callTime.getHours();
  const minutes = callTime.getMinutes();
  const displayHours = hours.toString().padStart(2, "0");
  const displayMinutes = minutes.toString().padStart(2, "0");

  const minutesUntil = Math.max(0, Math.ceil((callTime.getTime() - currentTime.getTime()) / (60 * 1000)));
  
  let formatted: string;
  if (minutesUntil <= 1) {
    formatted = "Any moment now";
  } else if (minutesUntil < 60) {
    formatted = `In ${minutesUntil} minutes`;
  } else {
    const hoursUntil = Math.floor(minutesUntil / 60);
    const remainingMinutes = minutesUntil % 60;
    formatted = `In ${hoursUntil}h ${remainingMinutes}m`;
  }

  return {
    estimatedTime: totalWaitMinutes,
    estimatedCallTime: `${displayHours}:${displayMinutes}`,
    estimatedCallTimeTimestamp: callTime,
    estimatedCallTimeFormatted: formatted
  };
}

/**
 * Calculate clinic traffic based on current bookings
 */
export async function calculateClinicTraffic(
  doctorId: string,
  scheduleId?: string
): Promise<{
  clinicTraffic: "low" | "normal" | "high" | "very-high";
  clinicTrafficPercentage: number;
  totalBookings: number;
  maxPatients: number;
}> {
  const db = await getDb();
  const bookingsCollection = db.collection("bookings");
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get schedule to know maxPatients
  let maxPatients = 20; // default
  if (scheduleId) {
    const schedule = await DoctorScheduleModel.getById(scheduleId);
    if (schedule && schedule.maxPatients) {
      maxPatients = schedule.maxPatients;
    }
  }

  // Count active bookings for today
  const totalBookings = await bookingsCollection.countDocuments({
    doctorId: doctorId,
    status: { $in: ["confirmed", "in-progress"] },
    appointmentTime: {
      $gte: todayStart,
      $lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  const percentage = maxPatients > 0 ? (totalBookings / maxPatients) * 100 : 0;

  let clinicTraffic: "low" | "normal" | "high" | "very-high";
  if (percentage < 30) {
    clinicTraffic = "low";
  } else if (percentage < 60) {
    clinicTraffic = "normal";
  } else if (percentage < 85) {
    clinicTraffic = "high";
  } else {
    clinicTraffic = "very-high";
  }

  return {
    clinicTraffic,
    clinicTrafficPercentage: Math.round(percentage),
    totalBookings,
    maxPatients
  };
}

/**
 * Calculate schedule status (on-time, delayed, ahead)
 */
export async function calculateScheduleStatus(
  doctorId: string,
  scheduleId?: string,
  firstCallTime?: Date | null
): Promise<{
  scheduleStatus: "on-schedule" | "delayed" | "ahead-of-schedule";
  scheduleDelay: number; // minutes
  isOnTime: boolean;
}> {
  if (!scheduleId || !firstCallTime) {
    return {
      scheduleStatus: "on-schedule",
      scheduleDelay: 0,
      isOnTime: true
    };
  }

  const schedule = await DoctorScheduleModel.getById(scheduleId);
  if (!schedule || !schedule.dayOfWeek || schedule.dayOfWeek.length === 0) {
    return {
      scheduleStatus: "on-schedule",
      scheduleDelay: 0,
      isOnTime: true
    };
  }

  // Get today's schedule
  const today = new Date();
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayName = dayNames[today.getDay()];
  
  const todaySchedule = schedule.dayOfWeek.find(day => day.hari === todayName);
  if (!todaySchedule || !todaySchedule.availabel) {
    return {
      scheduleStatus: "on-schedule",
      scheduleDelay: 0,
      isOnTime: true
    };
  }

  // Parse start time
  const [startHour, startMinute] = todaySchedule.startTime.split(":").map(Number);
  const scheduledStartTime = new Date(today);
  scheduledStartTime.setHours(startHour, startMinute, 0, 0);

  // Calculate delay
  const delayMs = firstCallTime.getTime() - scheduledStartTime.getTime();
  const delayMinutes = Math.round(delayMs / (60 * 1000));

  let scheduleStatus: "on-schedule" | "delayed" | "ahead-of-schedule";
  if (delayMinutes <= 5) {
    scheduleStatus = "on-schedule";
  } else if (delayMinutes > 5) {
    scheduleStatus = "delayed";
  } else {
    scheduleStatus = "ahead-of-schedule";
  }

  return {
    scheduleStatus,
    scheduleDelay: Math.max(0, delayMinutes),
    isOnTime: delayMinutes <= 5
  };
}

/**
 * Generate AI insights using OpenAI API
 */
export async function generateInsights(
  averageServiceTime: number,
  scheduleStatus: "on-schedule" | "delayed" | "ahead-of-schedule",
  scheduleDelay: number,
  clinicTraffic: "low" | "normal" | "high" | "very-high",
  clinicTrafficPercentage: number,
  patientsAhead: number,
  estimatedCallTime: string,
  estimatedCallTimeFormatted: string
): Promise<{
  insights: string[];
  warnings: string[];
  smartSuggestion: {
    arrivalTime: string;
    arrivalTimeTimestamp: Date;
    reason: string;
  };
}> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    // Fallback insights without AI
    return generateFallbackInsights(
      averageServiceTime,
      scheduleStatus,
      scheduleDelay,
      clinicTraffic,
      clinicTrafficPercentage,
      patientsAhead,
      estimatedCallTime,
      estimatedCallTimeFormatted
    );
  }

  try {
    const prompt = `You are a healthcare queue management AI assistant.
Use patient-friendly, calm, and reassuring language.
Do not provide medical advice.

Context:
- Average service time: ${averageServiceTime} minutes per patient
- Schedule status: ${scheduleStatus}${scheduleDelay > 0 ? ` (${scheduleDelay} minutes delay)` : ""}
- Clinic traffic: ${clinicTraffic} (${clinicTrafficPercentage}% capacity)
- Patients ahead: ${patientsAhead}
- Estimated call time: ${estimatedCallTime} (${estimatedCallTimeFormatted})

Generate:
1. 2–3 concise, single-sentence insights about the queue situation
2. Warnings ONLY if:
   - scheduleDelay > 15 minutes OR
   - clinicTrafficPercentage > 80
3. A smart arrival recommendation:
   - arrivalTime must be within 5–10 minutes before estimatedCallTime
   - explain the reason clearly

Format as JSON only:
{
  "insights": [],
  "warnings": [],
  "smartSuggestion": {
    "arrivalTime": "HH:mm",
    "reason": ""
  }
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a healthcare queue management AI assistant. Use patient-friendly, calm, and reassuring language. Do not provide medical advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (content) {
      try {
        const parsed = JSON.parse(content);
        
        // Validate and calculate arrival time timestamp
        const [hours, minutes] = parsed.smartSuggestion.arrivalTime.split(":").map(Number);
        const arrivalTime = new Date();
        arrivalTime.setHours(hours, minutes, 0, 0);
        if (arrivalTime < new Date()) {
          arrivalTime.setDate(arrivalTime.getDate() + 1);
        }

        // Validate arrival time is within 5-10 minutes before estimated call time
        const estimatedTime = new Date();
        const [estHours, estMinutes] = estimatedCallTime.split(":").map(Number);
        estimatedTime.setHours(estHours, estMinutes, 0, 0);
        if (estimatedTime < new Date()) {
          estimatedTime.setDate(estimatedTime.getDate() + 1);
        }

        const diffMinutes = (estimatedTime.getTime() - arrivalTime.getTime()) / (60 * 1000);
        
        // If arrival time is not within 5-10 minutes range, adjust it
        let finalArrivalTime = arrivalTime;
        if (diffMinutes < 5 || diffMinutes > 10) {
          // Set to 7 minutes before (middle of 5-10 range)
          finalArrivalTime = new Date(estimatedTime.getTime() - 7 * 60 * 1000);
          const finalHours = finalArrivalTime.getHours();
          const finalMins = finalArrivalTime.getMinutes();
          parsed.smartSuggestion.arrivalTime = `${finalHours.toString().padStart(2, "0")}:${finalMins.toString().padStart(2, "0")}`;
        }

        return {
          insights: parsed.insights || [],
          warnings: parsed.warnings || [],
          smartSuggestion: {
            arrivalTime: parsed.smartSuggestion.arrivalTime,
            arrivalTimeTimestamp: finalArrivalTime,
            reason: parsed.smartSuggestion.reason || ""
          }
        };
      } catch {
        // If JSON parse fails, use fallback
        return generateFallbackInsights(
          averageServiceTime,
          scheduleStatus,
          scheduleDelay,
          clinicTraffic,
          clinicTrafficPercentage,
          patientsAhead,
          estimatedCallTime,
          estimatedCallTimeFormatted
        );
      }
    }
  } catch (error) {
    console.error("Error generating AI insights:", error);
  }

  // Fallback to non-AI insights
  return generateFallbackInsights(
    averageServiceTime,
    scheduleStatus,
    scheduleDelay,
    clinicTraffic,
    clinicTrafficPercentage,
    patientsAhead,
    estimatedCallTime,
    estimatedCallTimeFormatted
  );
}

/**
 * Generate fallback insights without AI
 */
function generateFallbackInsights(
  averageServiceTime: number,
  scheduleStatus: "on-schedule" | "delayed" | "ahead-of-schedule",
  scheduleDelay: number,
  clinicTraffic: "low" | "normal" | "high" | "very-high",
  clinicTrafficPercentage: number,
  patientsAhead: number,
  estimatedCallTime: string,
  estimatedCallTimeFormatted: string
): {
  insights: string[];
  warnings: string[];
  smartSuggestion: {
    arrivalTime: string;
    arrivalTimeTimestamp: Date;
    reason: string;
  };
} {
  const insights: string[] = [];
  const warnings: string[] = [];

  // Generate insights (patient-friendly, calm, reassuring)
  if (scheduleStatus === "on-schedule") {
    insights.push(`The doctor is running on schedule with an average service time of ${averageServiceTime} minutes per patient.`);
  } else if (scheduleStatus === "delayed") {
    insights.push(`The schedule is running ${scheduleDelay} minutes behind, which may slightly affect your estimated call time.`);
    // Only add warning if delay > 15 minutes
    if (scheduleDelay > 15) {
      warnings.push(`Schedule delay: ${scheduleDelay} minutes`);
    }
  }

  if (clinicTraffic === "low") {
    insights.push(`Clinic traffic is low today (${clinicTrafficPercentage}% capacity), which means shorter wait times.`);
  } else if (clinicTraffic === "normal") {
    insights.push(`Clinic traffic is normal (${clinicTrafficPercentage}% capacity), so wait times should be as expected.`);
  } else if (clinicTraffic === "high" || clinicTraffic === "very-high") {
    insights.push(`Clinic traffic is ${clinicTraffic} (${clinicTrafficPercentage}% capacity), so you may experience slightly longer wait times.`);
    // Only add warning if traffic > 80%
    if (clinicTrafficPercentage > 80) {
      warnings.push(`High clinic traffic: ${clinicTrafficPercentage}% capacity`);
    }
  }

  if (patientsAhead > 0) {
    insights.push(`With ${patientsAhead} patient${patientsAhead !== 1 ? 's' : ''} ahead of you, your estimated call time is ${estimatedCallTime} (${estimatedCallTimeFormatted}).`);
  } else {
    insights.push("You're next in line! Be ready for your appointment.");
  }

  // Calculate smart arrival time (7 minutes before estimated call time - middle of 5-10 range)
  const [hours, minutes] = estimatedCallTime.split(":").map(Number);
  const estimatedTime = new Date();
  estimatedTime.setHours(hours, minutes, 0, 0);
  if (estimatedTime < new Date()) {
    estimatedTime.setDate(estimatedTime.getDate() + 1);
  }

  const arrivalTime = new Date(estimatedTime.getTime() - 7 * 60 * 1000); // 7 minutes before (middle of 5-10 range)
  const arrivalTimeStr = `${arrivalTime.getHours().toString().padStart(2, "0")}:${arrivalTime.getMinutes().toString().padStart(2, "0")}`;

  return {
    insights,
    warnings,
    smartSuggestion: {
      arrivalTime: arrivalTimeStr,
      arrivalTimeTimestamp: arrivalTime,
      reason: `Plan to arrive around ${arrivalTimeStr} to ensure you're ready when your turn comes, while avoiding unnecessary waiting time.`
    }
  };
}


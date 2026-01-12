import { getDb } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";
import DoctorModel from "@/db/models/Doctor";
import DoctorScheduleModel, { DayOfWeek } from "@/db/models/DoctorSchedule";

/**
 * Calculate estimated call time based on patients ahead and average service time
 * Call time starts from schedule startTime, not currentTime
 */
export function calculateEstimatedCallTime(
  patientsAhead: number,
  averageServiceTime: number, // in minutes
  scheduleStartTime?: Date | string | null, // Start time from schedule (e.g., "09:00" or Date)
  scheduleDate?: Date | string | null, // Date for the schedule (to set correct date)
  actualSessionStartTime?: Date | null // Actual time when doctor started the session (if late)
): {
  estimatedTime: number; // total minutes
  estimatedCallTime: string; // HH:mm format
  estimatedCallTimeTimestamp: Date;
  estimatedCallTimeFormatted: string;
} {
  // ✅ If actualSessionStartTime is provided (doctor has started), use it as base time
  // This handles the case when doctor is late - call time will be adjusted accordingly
  if (actualSessionStartTime) {
    // Calculate call time: actualSessionStartTime + (patientsAhead * averageServiceTime)
    const totalWaitMinutes = patientsAhead * averageServiceTime;
    const callTime = new Date(
      actualSessionStartTime.getTime() + totalWaitMinutes * 60 * 1000
    );

    const hours = callTime.getHours();
    const minutes = callTime.getMinutes();
    const displayHours = hours.toString().padStart(2, "0");
    const displayMinutes = minutes.toString().padStart(2, "0");

    const currentTime = new Date();
    const minutesUntil = Math.max(
      0,
      Math.ceil((callTime.getTime() - currentTime.getTime()) / (60 * 1000))
    );

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
      estimatedCallTimeFormatted: formatted,
    };
  }

  // Parse schedule startTime (used when doctor hasn't started yet)
  let startTime: Date;

  if (scheduleStartTime) {
    if (scheduleStartTime instanceof Date) {
      startTime = scheduleStartTime;
    } else if (typeof scheduleStartTime === "string") {
      // Parse "09:00" format
      const [hours, minutes] = scheduleStartTime.split(":").map(Number);

      // ✅ FIX: Use scheduleDate properly, ensuring correct date handling
      let baseDate: Date;
      if (scheduleDate) {
        // If scheduleDate is a string, parse it
        if (typeof scheduleDate === "string") {
          baseDate = new Date(scheduleDate);
        } else {
          baseDate = new Date(scheduleDate);
        }
        // Ensure we use the date part only (reset time to avoid timezone issues)
        baseDate = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate()
        );
      } else {
        // Use today's date if scheduleDate not provided
        const today = new Date();
        baseDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
      }

      // Create startTime with correct date and time (local timezone)
      startTime = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        hours,
        minutes,
        0,
        0
      );
    } else {
      // Invalid scheduleStartTime format, use today with default 09:00
      const today = new Date();
      startTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9,
        0,
        0,
        0
      );
    }
  } else {
    // ✅ FIX: If no scheduleStartTime, use scheduleDate with default 09:00 instead of current time
    if (scheduleDate) {
      const baseDate =
        typeof scheduleDate === "string"
          ? new Date(scheduleDate)
          : new Date(scheduleDate);
      // Use 09:00 as default start time
      startTime = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        9, // Default to 09:00
        0,
        0,
        0
      );
    } else {
      // Last resort: use today at 09:00
      const today = new Date();
      startTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9,
        0,
        0,
        0
      );
    }
  }

  // Calculate call time: startTime + (patientsAhead * averageServiceTime)
  const totalWaitMinutes = patientsAhead * averageServiceTime;
  const callTime = new Date(startTime.getTime() + totalWaitMinutes * 60 * 1000);

  const hours = callTime.getHours();
  const minutes = callTime.getMinutes();
  const displayHours = hours.toString().padStart(2, "0");
  const displayMinutes = minutes.toString().padStart(2, "0");

  const currentTime = new Date();
  const minutesUntil = Math.max(
    0,
    Math.ceil((callTime.getTime() - currentTime.getTime()) / (60 * 1000))
  );

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
    estimatedCallTimeFormatted: formatted,
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
      $lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
    },
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
    maxPatients,
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
      isOnTime: true,
    };
  }

  const schedule = await DoctorScheduleModel.getById(scheduleId);
  if (!schedule || !schedule.dayOfWeek || schedule.dayOfWeek.length === 0) {
    return {
      scheduleStatus: "on-schedule",
      scheduleDelay: 0,
      isOnTime: true,
    };
  }

  // Get today's schedule
  const today = new Date();
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const todayName = dayNames[today.getDay()];

  const todaySchedule = schedule.dayOfWeek.find(
    (day: DayOfWeek) => day.hari === todayName
  );
  if (!todaySchedule || !todaySchedule.availabel) {
    return {
      scheduleStatus: "on-schedule",
      scheduleDelay: 0,
      isOnTime: true,
    };
  }

  // Parse start time
  const [startHour, startMinute] = todaySchedule.startTime
    .split(":")
    .map(Number);
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
    isOnTime: delayMinutes <= 5,
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
    // Calculate recommended arrival time (5 minutes before call time)
    const [callHours, callMinutes] = estimatedCallTime.split(":").map(Number);
    const callTimeDate = new Date();
    callTimeDate.setHours(callHours, callMinutes, 0, 0);
    if (callTimeDate < new Date()) {
      callTimeDate.setDate(callTimeDate.getDate() + 1);
    }

    const bufferMinutes = 5; // Arrive 5 minutes before
    const arrivalTimeDate = new Date(
      callTimeDate.getTime() - bufferMinutes * 60 * 1000
    );
    const arrivalTimeStr = `${arrivalTimeDate
      .getHours()
      .toString()
      .padStart(2, "0")}:${arrivalTimeDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    // Build context string with actual data
    let scheduleStatusDesc = "";
    if (scheduleStatus === "on-schedule") {
      scheduleStatusDesc = "running on schedule";
    } else if (scheduleStatus === "delayed") {
      scheduleStatusDesc = `running ${scheduleDelay} minutes behind schedule`;
    } else {
      scheduleStatusDesc = "running ahead of schedule";
    }

    let trafficDesc = "";
    if (clinicTraffic === "low") {
      trafficDesc = `low traffic (${clinicTrafficPercentage}% capacity)`;
    } else if (clinicTraffic === "normal") {
      trafficDesc = `normal traffic (${clinicTrafficPercentage}% capacity)`;
    } else if (clinicTraffic === "high") {
      trafficDesc = `high traffic (${clinicTrafficPercentage}% capacity)`;
    } else {
      trafficDesc = `very high traffic (${clinicTrafficPercentage}% capacity)`;
    }

    // Generate varied examples based on the situation
    const queueVariations =
      patientsAhead === 0
        ? [
            "You're up next - almost your turn!",
            "Great news, you're first in line!",
            "You're next - no waiting!",
            "It's your turn soon!",
            "You're at the front of the queue!",
          ]
        : [
            `Just ${patientsAhead} ${
              patientsAhead === 1 ? "person" : "people"
            } ahead of you`,
            `Only ${patientsAhead} ${
              patientsAhead === 1 ? "patient" : "patients"
            } before you`,
            `There are ${patientsAhead} ${
              patientsAhead === 1 ? "person" : "people"
            } in front of you`,
            `You've got ${patientsAhead} ${
              patientsAhead === 1 ? "person" : "people"
            } ahead`,
          ];

    const trafficVariations =
      clinicTraffic === "low"
        ? [
            "super quiet",
            "really quiet",
            "pretty empty",
            "not busy at all",
            "very quiet",
            "hardly anyone there",
          ]
        : clinicTraffic === "normal"
        ? [
            "normal busyness",
            "moderately busy",
            "average traffic",
            "typical day",
            "regular pace",
          ]
        : ["quite busy", "pretty packed", "getting crowded", "busy day"];

    const prompt = `You are a friendly healthcare assistant. Write like you're texting a friend - casual, warm, and varied. NEVER use the same phrases twice. Be creative and use different expressions every time.

Current situation:
- Queue: ${
      patientsAhead === 0
        ? "You're next!"
        : `${patientsAhead} ${patientsAhead === 1 ? "person" : "people"} ahead`
    }
- Schedule: ${scheduleStatusDesc}
- Clinic: ${trafficDesc}
- Visit time: ${averageServiceTime} minutes average
- Your time: ${estimatedCallTime} (${estimatedCallTimeFormatted})
- Arrive by: ${arrivalTimeStr} (5 min before)

CRITICAL: Write 3-5 LONG, DETAILED insights (2-3 sentences each) that are DIFFERENT every time. Each insight should explain the "why" and "what to expect", not just state facts. Use varied expressions:
- For queue: ${queueVariations.join(", ")}
- For traffic: ${trafficVariations.join(", ")}

Make insights SUBSTANTIAL and DETAILED:
- Explain what the situation means
- Explain why it matters
- Explain what they can expect
- Add helpful context or tips

DO NOT use these boring phrases (they're too template-like):
❌ "Currently, there are no patients ahead"
❌ "The clinic is running on schedule"
❌ "Based on the current situation"
❌ "You can expect"
❌ "Minimal wait time"
❌ "Quick and efficient"

INSTEAD, use creative variations like:
✅ "You're up next - almost your turn!"
✅ "The clinic is super quiet today"
✅ "Looks like you'll breeze right through"
✅ "Things are moving smoothly"
✅ "You won't be waiting long at all"
✅ "It's a great day for a quick visit"
✅ "The wait should be a breeze"

For smart suggestion:
- arrivalTime: "${arrivalTimeStr}" (exact)
- reason: Write a LONG, DETAILED suggestion (3-5 sentences) that explains:
  * WHY arriving early is beneficial
  * WHAT they can do during the wait time
  * HOW it helps their visit experience
  * Any additional helpful tips or context
- Use different styles each time but make it COMPREHENSIVE:
  * Example (Casual): "Why not aim for ${arrivalTimeStr}? That way you're all set when they call you at ${estimatedCallTime}. You'll have time to check in, find a seat, and maybe grab a water or use the restroom. Arriving a bit early also means you won't feel rushed if traffic is heavier than expected. Plus, if there are any forms to fill out, you'll have plenty of time without feeling pressured. It's all about making your visit as smooth and stress-free as possible!"
  * Example (Friendly): "Try to get here around ${arrivalTimeStr} - perfect timing before your ${estimatedCallTime} slot! This gives you a few minutes to settle in, check in at the front desk, and mentally prepare for your appointment. You can use this time to review any questions you want to ask the doctor or just take a moment to relax. Being here early also means you won't miss your turn if things are moving faster than expected. It's a small thing that makes a big difference in how your visit goes!"

VARY YOUR LANGUAGE - don't repeat patterns. Make each response unique and fresh!

Return JSON:
{
  "insights": ["detailed insight 1 (2-3 sentences)", "detailed insight 2 (2-3 sentences)", "detailed insight 3 (2-3 sentences)", "detailed insight 4 (optional, 2-3 sentences)", "detailed insight 5 (optional, 2-3 sentences)"],
  "warnings": ${
    scheduleDelay > 15 || clinicTrafficPercentage > 80
      ? '["warning if needed"]'
      : "[]"
  },
  "smartSuggestion": {
    "arrivalTime": "${arrivalTimeStr}",
    "reason": "LONG, DETAILED suggestion (3-5 sentences minimum) explaining why arriving at ${arrivalTimeStr} is beneficial, what to do during wait, how it helps, and any tips - must include ${arrivalTimeStr} and ${estimatedCallTime}"
  }
}

CRITICAL INSTRUCTIONS:
- Insights MUST be LONG (2-3 sentences each minimum) - explain the full picture, not just facts
- Smart suggestion MUST be LONG (3-5 sentences minimum) - comprehensive explanation
- Don't be brief - be detailed, helpful, and thorough!
- Each insight should explain: what it means, why it matters, what to expect
- Smart suggestion should explain: why early arrival helps, what to do during wait, how it improves experience

IMPORTANT: Make insights LONGER and MORE DETAILED. Each insight should be 2-3 sentences explaining the situation thoroughly. Smart suggestion should be 3-5 sentences with full explanation.`;

    console.log("🤖 Calling OpenAI API for AI insights...", {
      patientsAhead,
      scheduleStatus,
      scheduleDelay,
      clinicTraffic,
      clinicTrafficPercentage,
      estimatedCallTime,
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a creative, friendly healthcare assistant. Write like you're texting a friend - casual, warm, and ALWAYS use different expressions. Never repeat the same phrases. Be creative, varied, and natural. Vary your language style every time. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 1.0, // Maximum creativity for varied responses
        top_p: 0.95, // Nucleus sampling for more diverse outputs
        frequency_penalty: 0.7, // Penalize repetition to encourage variety
        presence_penalty: 0.6, // Encourage new topics/phrases
        max_tokens: 1200, // Much more tokens for longer, detailed responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenAI API error:", response.status, errorText);

      // Handle specific error types
      if (response.status === 401) {
        console.error("❌ Invalid OpenAI API key");
      } else if (response.status === 429) {
        console.error("❌ OpenAI API rate limit exceeded");
      } else if (response.status >= 500) {
        console.error("❌ OpenAI API server error");
      }

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.warn("⚠️ OpenAI returned empty content, using fallback");
      throw new Error("OpenAI returned empty content");
    }

    console.log("✅ OpenAI API response received");

    try {
      // Try to parse JSON response
      let parsed = JSON.parse(content);

      // Validate structure
      if (!parsed.insights || !Array.isArray(parsed.insights)) {
        throw new Error("Invalid insights structure");
      }
      if (!parsed.smartSuggestion || !parsed.smartSuggestion.arrivalTime) {
        throw new Error("Invalid smartSuggestion structure");
      }

      // Validate and calculate arrival time timestamp
      const [hours, minutes] = parsed.smartSuggestion.arrivalTime
        .split(":")
        .map(Number);
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

      const diffMinutes =
        (estimatedTime.getTime() - arrivalTime.getTime()) / (60 * 1000);

      // If arrival time is not within 5-10 minutes range, adjust it
      let finalArrivalTime = arrivalTime;
      if (diffMinutes < 5 || diffMinutes > 10) {
        // Set to 7 minutes before (middle of 5-10 range)
        finalArrivalTime = new Date(estimatedTime.getTime() - 7 * 60 * 1000);
        const finalHours = finalArrivalTime.getHours();
        const finalMins = finalArrivalTime.getMinutes();
        parsed.smartSuggestion.arrivalTime = `${finalHours
          .toString()
          .padStart(2, "0")}:${finalMins.toString().padStart(2, "0")}`;
      }

      // Validate and ensure reason is not empty
      const expectedReason = `Plan to arrive around ${parsed.smartSuggestion.arrivalTime} to ensure you're ready when your turn comes at ${estimatedCallTime}, while avoiding unnecessary waiting time.`;

      console.log("✅ Successfully generated insights using OpenAI API");

      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        smartSuggestion: {
          arrivalTime: parsed.smartSuggestion.arrivalTime, // Always use validated arrival time
          arrivalTimeTimestamp: finalArrivalTime,
          reason: parsed.smartSuggestion.reason || expectedReason, // Use validated reason
        },
      };
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI JSON response:", parseError);
      console.error("Raw content:", content);
      throw new Error("Failed to parse OpenAI response");
    }
  } catch (error) {
    console.error("❌ Error generating AI insights with OpenAI:", error);
    console.log("⚠️ Falling back to non-AI insights");
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
    insights.push(
      `The doctor is running on schedule with an average service time of ${averageServiceTime} minutes per patient.`
    );
  } else if (scheduleStatus === "delayed") {
    insights.push(
      `The schedule is running ${scheduleDelay} minutes behind, which may slightly affect your estimated call time.`
    );
    // Only add warning if delay > 15 minutes
    if (scheduleDelay > 15) {
      warnings.push(`Schedule delay: ${scheduleDelay} minutes`);
    }
  }

  if (clinicTraffic === "low") {
    insights.push(
      `Clinic traffic is low today (${clinicTrafficPercentage}% capacity), which means shorter wait times.`
    );
  } else if (clinicTraffic === "normal") {
    insights.push(
      `Clinic traffic is normal (${clinicTrafficPercentage}% capacity), so wait times should be as expected.`
    );
  } else if (clinicTraffic === "high" || clinicTraffic === "very-high") {
    insights.push(
      `Clinic traffic is ${clinicTraffic} (${clinicTrafficPercentage}% capacity), so you may experience slightly longer wait times.`
    );
    // Only add warning if traffic > 80%
    if (clinicTrafficPercentage > 80) {
      warnings.push(
        `High clinic traffic: ${clinicTrafficPercentage}% capacity`
      );
    }
  }

  if (patientsAhead > 0) {
    insights.push(
      `With ${patientsAhead} patient${
        patientsAhead !== 1 ? "s" : ""
      } ahead of you, your estimated call time is ${estimatedCallTime} (${estimatedCallTimeFormatted}).`
    );
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
  const arrivalTimeStr = `${arrivalTime
    .getHours()
    .toString()
    .padStart(2, "0")}:${arrivalTime.getMinutes().toString().padStart(2, "0")}`;

  return {
    insights,
    warnings,
    smartSuggestion: {
      arrivalTime: arrivalTimeStr,
      arrivalTimeTimestamp: arrivalTime,
      reason: `Plan to arrive around ${arrivalTimeStr} to ensure you're ready when your turn comes, while avoiding unnecessary waiting time.`,
    },
  };
}

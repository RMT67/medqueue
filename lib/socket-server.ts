import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

// Get Socket.IO instance from global (set by server.js)
export function getSocketIO(): SocketIOServer | null {
  if (typeof global !== "undefined" && global.io) {
    return global.io;
  }
  return null;
}

// Emit queue position update
export function emitQueuePositionUpdate(
  bookingId: string,
  data: {
    currentlyServing: string;
    patientsAhead: number;
    queueNumber: string;
  }
) {
  const io = getSocketIO();
  if (io) {
    io.to(`queue:${bookingId}`).emit("queue:position-update", {
      bookingId,
      ...data
    });
  }
}

// Emit queue status change
export function emitQueueStatusChange(
  bookingId: string,
  data: {
    queueStatus: "waiting" | "being-served" | "completed";
    estimatedCallTime?: string;
    estimatedCallTimeTimestamp?: string;
  }
) {
  const io = getSocketIO();
  if (io) {
    io.to(`queue:${bookingId}`).emit("queue:status-change", {
      bookingId,
      ...data
    });
  }
}

// Emit call time update
export function emitCallTimeUpdate(
  bookingId: string,
  data: {
    estimatedCallTime: string;
    estimatedCallTimeTimestamp: string;
    patientsAhead: number;
    estimatedTime: number;
  }
) {
  const io = getSocketIO();
  if (io) {
    io.to(`queue:${bookingId}`).emit("queue:call-time-update", {
      bookingId,
      ...data
    });
  }
}


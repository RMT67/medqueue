"use client"

import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket | null {
  if (typeof window === "undefined") {
    return null
  }

  if (!socket) {
    const token = localStorage.getItem("medqueue_token")
    if (!token) {
      return null
    }

    socket = io(window.location.origin, {
      auth: {
        token: token
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id)
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected")
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })
  }

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinQueueRoom(bookingId: string) {
  const socketInstance = getSocket()
  if (socketInstance) {
    socketInstance.emit("join:queue", { bookingId })
  }
}

export function leaveQueueRoom(bookingId: string) {
  const socketInstance = getSocket()
  if (socketInstance) {
    socketInstance.emit("leave:queue", { bookingId })
  }
}


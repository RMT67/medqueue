import { Server as SocketIOServer } from "socket.io";

declare global {
  var io: SocketIOServer | undefined;

  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      JWT_SECRET: string;
      NEXT_PUBLIC_SOCKET_URL?: string;
      MIDTRANS_SERVER_KEY?: string;
      MIDTRANS_CLIENT_KEY?: string;
      NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?: string;
      NEXT_PUBLIC_APP_URL?: string;
    }
  }

  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export {};


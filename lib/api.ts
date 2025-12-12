// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiFetchOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  token?: string;
  skipAuth?: boolean; // Set to true to skip auto-injecting token
}

interface ApiErrorShape {
  message?: string;
  error?: string;
}

/**
 * Helper function to get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("medqueue_token");
}

/**
 * API fetch helper that automatically injects Authorization header from localStorage
 * 
 * @param path - API endpoint path (e.g., "/api/auth/me")
 * @param options - Fetch options
 * @returns Promise with typed response
 * 
 * @example
 * // Auto-injects token from localStorage
 * const user = await apiFetch<User>("/api/auth/me");
 * 
 * // Skip auth (for public endpoints)
 * const data = await apiFetch<Data>("/api/public", { skipAuth: true });
 * 
 * // Manual token override
 * const data = await apiFetch<Data>("/api/endpoint", { token: "custom-token" });
 */
export async function apiFetch<TResponse, TBody = unknown>(
  path: string,
  options: ApiFetchOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", body, token, skipAuth = false } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Auto-inject token from localStorage if not skipped and no manual token provided
  if (!skipAuth) {
    const authToken = token || getAuthToken();
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
  } else if (token) {
    // Manual token override even when skipAuth is true
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const rawData = (await res.json().catch(() => null)) as
    | TResponse
    | ApiErrorShape
    | null;

  if (!res.ok) {
    const maybeError = rawData as ApiErrorShape | null;

    const message =
      maybeError?.message ??
      maybeError?.error ??
      `Request failed with status ${res.status}`;

    throw new Error(message);
  }

  return rawData as TResponse;
}

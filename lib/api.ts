// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiFetchOptions<TBody> {
  method?: HttpMethod;
  body?: TBody;
  token?: string;
}

interface ApiErrorShape {
  message?: string;
  error?: string;
}

export async function apiFetch<TResponse, TBody = unknown>(
  path: string,
  options: ApiFetchOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", body, token } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
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

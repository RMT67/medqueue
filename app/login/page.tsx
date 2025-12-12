// app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type LoginResponse = {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: "admin" | "doctor" | "patient";
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await apiFetch<
        LoginResponse,
        { email: string; password: string }
      >("/api/login", {
        method: "POST",
        body: { email, password },
      });

      // Simpan token & user di localStorage (sementara, nanti bisa dinaikkan ke context/zustand)
      if (typeof window !== "undefined") {
        localStorage.setItem("medqueue_token", data.token);
        localStorage.setItem("medqueue_user", JSON.stringify(data.user));
      }

      // Redirect berdasar role
      if (data.user.role === "admin") {
        router.push("/admin");
      } else if (data.user.role === "doctor") {
        router.push("/doctor");
      } else {
        router.push("/my-queue");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Login gagal, coba lagi.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Masuk ke MedQueue.ai
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Pantau antrian klinik secara real-time dan dapatkan ETA.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
              placeholder="contoh: user@medqueue.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 focus:ring-offset-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-50 dark:focus:ring-offset-zinc-900"
          >
            {isLoading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <p>
            Belum punya akun?{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              Hubungi admin klinik
            </span>
          </p>
          <p className="mt-1">
            Role yang didukung: <strong>Admin</strong>, <strong>Dokter</strong>,
            dan <strong>Pasien</strong>.
          </p>
          <p className="mt-3">
            <Link
              href="/"
              className="text-xs font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
            >
              ← Kembali ke beranda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

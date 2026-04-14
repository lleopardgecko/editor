"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { name: "Alice", email: "alice@demo.com", password: "password123" },
    { name: "Bob", email: "bob@demo.com", password: "password123" },
  ];

  async function signIn(e_mail: string, pw: string) {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e_mail, password: pw });
    if (error) {
      // Auto-create demo accounts on first use
      if (error.message === "Invalid login credentials") {
        const { error: signUpErr } = await supabase.auth.signUp({ email: e_mail, password: pw });
        if (signUpErr) {
          setError(signUpErr.message);
          setLoading(false);
          return;
        }
        // Sign in after creating
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email: e_mail, password: pw });
        if (retryErr) {
          setError(retryErr.message);
          setLoading(false);
          return;
        }
      } else {
        setError(error.message);
        setLoading(false);
        return;
      }
    }
    router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      return signIn(email, password);
    }

    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {mode === "login"
              ? "Enter your credentials to continue."
              : "Sign up with your email and password."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          {mode === "login" ? "No account? " : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="underline text-neutral-900"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>

        <div className="border-t border-neutral-200 pt-5">
          <p className="text-xs text-neutral-400 mb-3">Demo accounts</p>
          <div className="flex gap-2">
            {demoAccounts.map((acct) => (
              <button
                key={acct.email}
                onClick={() => signIn(acct.email, acct.password)}
                disabled={loading}
                className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {acct.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

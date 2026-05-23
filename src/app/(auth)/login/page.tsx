"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (authData.user) {
      // Check if profile is approved
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("id", authData.user.id)
        .single();

      if (!profile) {
        await supabase.auth.signOut();
        setError("Your account was rejected or does not exist.");
        setLoading(false);
      } else if (!profile.is_approved) {
        await supabase.auth.signOut();
        setError("Your account is pending admin approval.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl" glow>
      <CardHeader className="text-center pt-8 pb-4 border-b-0 px-6 sm:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome back</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Enter your credentials to access your dashboard
        </p>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardBody className="space-y-5 px-6 sm:px-8 py-2">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
              {error}
            </div>
          )}
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="doctor@meddash.com"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              Forgot password?
            </Link>
          </div>
        </CardBody>
        <CardFooter className="flex flex-col gap-5 pt-4 pb-8 border-t-0 px-6 sm:px-8">
          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
            >
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

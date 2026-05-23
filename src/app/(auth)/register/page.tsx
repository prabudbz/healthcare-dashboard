"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import { Stethoscope, UserCircle } from "lucide-react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const role = formData.get("role") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          role,
        }
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Sign out immediately so they aren't auto-logged in locally with a pending status
      await supabase.auth.signOut();
      
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl" glow>
      <CardHeader className="text-center pt-8 pb-4 border-b-0 px-6 sm:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Create an account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Join MedDash to manage your practice
        </p>
      </CardHeader>
      
      {success ? (
        <CardBody className="px-6 sm:px-8 py-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Registration Successful</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 pb-4">
            Your account has been created and is currently pending administrator approval. You will not be able to log in until your account type is verified.
          </p>
          <Link href="/login" className="block w-full text-center py-2.5 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors">
            Return to Login
          </Link>
        </CardBody>
      ) : (
        <form onSubmit={handleRegister}>
          <CardBody className="space-y-5 px-6 sm:px-8 py-2">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Account Type</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <label className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50 dark:has-[:checked]:bg-teal-500/10 dark:has-[:checked]:border-teal-500 transition-all group">
                  <input type="radio" name="role" value="staff" className="sr-only" defaultChecked />
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-has-[:checked]:bg-teal-100 group-has-[:checked]:text-teal-600 dark:group-has-[:checked]:bg-teal-500/20 dark:group-has-[:checked]:text-teal-400 transition-colors">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-has-[:checked]:text-teal-700 dark:group-has-[:checked]:text-teal-400">Staff</span>
                </label>
                
                <label className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50 dark:has-[:checked]:bg-teal-500/10 dark:has-[:checked]:border-teal-500 transition-all group">
                  <input type="radio" name="role" value="doctor" className="sr-only" />
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-has-[:checked]:bg-teal-100 group-has-[:checked]:text-teal-600 dark:group-has-[:checked]:bg-teal-500/20 dark:group-has-[:checked]:text-teal-400 transition-colors">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-has-[:checked]:text-teal-700 dark:group-has-[:checked]:text-teal-400">Doctor</span>
                </label>
              </div>
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="user@meddash.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              helperText="Must be at least 6 characters"
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </CardBody>
          <CardFooter className="flex flex-col gap-5 pt-4 pb-8 border-t-0 px-6 sm:px-8">
            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

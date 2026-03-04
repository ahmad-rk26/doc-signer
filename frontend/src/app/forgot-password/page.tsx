"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setEmailSent(true);
            toast.success("Password reset link sent to your email");
        } catch (error: any) {
            toast.error(error.message || "Failed to send reset link");
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Check Your Email
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We've sent a password reset link to <span className="font-medium text-gray-900">{email}</span>
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Click the link in the email to reset your password. The link will expire in 1 hour.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-gray-600">
                        No worries, we'll send you reset instructions
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Login
                        </Link>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

"use client";

import { useAuth } from "@/app/hooks/useAuth";
import AuthForm from "@/app/components/AuthForm";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function RegisterPage() {
    const { register: registerUser, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace("/dashboard");
        }
    }, [isAuthenticated, isLoading, router]);

    const handleRegister = async (email: string, password: string, name?: string) => {
        await registerUser(email, password, name);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 pt-16">
            <div className="hidden lg:block relative">
                <img
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2000"
                    alt="Team collaboration"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-indigo-700/90 flex flex-col justify-center px-20 text-white">
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Join DoSign Today
                    </h1>
                    <p className="text-lg text-white/90 max-w-md mb-8">
                        Create your account and start signing documents in seconds. No credit card required.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span>Free forever plan</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span>Unlimited documents</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span>Bank-level security</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span>24/7 support</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center bg-gray-50 px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white shadow-xl rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">
                                Create Account
                            </h2>
                            <p className="text-gray-600 mt-2">
                                Get started in less than a minute
                            </p>
                        </div>

                        <AuthForm onSubmit={handleRegister} isRegister={true} />

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="text-indigo-600 font-semibold hover:text-indigo-700"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        By creating an account, you agree to our{" "}
                        <a href="#" className="text-indigo-600 hover:underline">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-indigo-600 hover:underline">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

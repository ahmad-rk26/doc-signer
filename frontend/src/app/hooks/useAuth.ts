"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/app/lib/supabaseClient";
import { attachToken } from "@/app/lib/api";

interface AuthState {
    token: string | null;
    user: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    authReady: boolean;
}

export const useAuth = () => {
    const router = useRouter();

    const [state, setState] = useState<AuthState>({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: true,
        authReady: false,
    });

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (error) throw error;

                const session = data.session;

                if (!mounted) return;

                if (session) {
                    attachToken(session.access_token);
                    setState({
                        token: session.access_token,
                        user: session.user,
                        isAuthenticated: true,
                        isLoading: false,
                        authReady: true,
                    });
                } else {
                    attachToken(null);
                    setState({
                        token: null,
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        authReady: true,
                    });
                }
            } catch (err) {
                console.error("Auth init error:", err);

                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    authReady: true,
                }));
            }
        };

        initSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                attachToken(session.access_token);
                setState({
                    token: session.access_token,
                    user: session.user,
                    isAuthenticated: true,
                    isLoading: false,
                    authReady: true,
                });
            } else {
                attachToken(null);
                setState({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    authReady: true,
                });
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                attachToken(data.session.access_token);
                setState({
                    token: data.session.access_token,
                    user: data.session.user,
                    isAuthenticated: true,
                    isLoading: false,
                    authReady: true,
                });

                toast.success("Login successful");
                router.push("/dashboard");
            }
        } catch (err: any) {
            console.error(err);

            if (err.message.includes("Invalid login credentials")) {
                toast.error("Invalid email or password");
            } else if (err.message.includes("Email not confirmed")) {
                toast.error("Please verify your email first");
            } else {
                toast.error(err.message || "Login failed");
            }

            throw err;
        }
    };

    const register = async (email: string, password: string, name?: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                if (data.user.identities && data.user.identities.length === 0) {
                    toast.error("Email already registered");
                    throw new Error("Email already registered");
                }

                toast.success("Registration successful! Please check your email to verify your account.");
                router.push("/login");
            }
        } catch (err: any) {
            console.error(err);

            if (err.message.includes("already registered")) {
                toast.error("Email already registered");
            } else if (err.message.includes("Password should be")) {
                toast.error("Password must be at least 6 characters");
            } else {
                toast.error(err.message || "Registration failed");
            }

            throw err;
        }
    };

    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut();

            attachToken(null);
            setState({
                token: null,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                authReady: true,
            });

            toast.success("Logged out successfully");
            router.push("/login");
        } catch (err) {
            console.error(err);
            toast.error("Logout failed");
        }
    }, [router]);

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            toast.success("Password reset email sent");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to send reset email");
            throw err;
        }
    };

    const updatePassword = async (newPassword: string) => {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            // Sign out after password change to force re-login
            await supabase.auth.signOut();

            setState({
                token: null,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                authReady: true,
            });

            toast.success("Password updated successfully! Please login again.");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to update password");
            throw err;
        }
    };

    const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
        try {
            const { error } = await supabase.auth.updateUser({
                data,
            });

            if (error) throw error;

            toast.success("Profile updated successfully");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to update profile");
            throw err;
        }
    };

    return {
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        authReady: state.authReady,
        login,
        register,
        logout,
        resetPassword,
        updatePassword,
        updateProfile,
    };
};

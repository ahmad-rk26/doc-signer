"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, logout, user } = useAuth();
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target as Node)
            ) {
                setProfileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        logout();
        setProfileMenuOpen(false);
    };

    // Get user initials from name or email
    const getInitials = () => {
        if (user?.user_metadata?.full_name) {
            const names = user.user_metadata.full_name.trim().split(" ");
            if (names.length >= 3) {
                // First, Middle, Last
                return `${names[0][0]}${names[1][0]}${names[names.length - 1][0]}`.toUpperCase();
            } else if (names.length === 2) {
                // First, Last
                return `${names[0][0]}${names[1][0]}`.toUpperCase();
            } else {
                // Single name
                return names[0].substring(0, 2).toUpperCase();
            }
        }
        // Fallback to email
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return "U";
    };

    const getUserName = () => {
        return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
    };

    // Check if current route is active
    const isActive = (path: string) => pathname === path;

    // Check if we're on a public signing page
    const isPublicSigningPage = pathname?.startsWith("/sign/");

    // Don't show navbar on public signing pages
    if (isPublicSigningPage) {
        return (
            <nav className="fixed top-0 w-full bg-white border-b z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center">
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                DoSign
                            </span>
                        </Link>
                        <div className="text-sm text-gray-600">
                            Secure Document Signing
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="fixed top-0 w-full bg-white border-b z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link
                        href={isAuthenticated ? "/dashboard" : "/"}
                        className="flex items-center"
                    >
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            DoSign
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    {isAuthenticated ? (
                        <div className="hidden md:flex items-center gap-6">
                            <Link
                                href="/dashboard"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${isActive("/dashboard")
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                    }`}
                            >
                                Dashboard
                            </Link>

                            {/* Profile Dropdown */}
                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                                        {getInitials()}
                                    </div>
                                    <svg
                                        className={`w-4 h-4 text-gray-600 transition-transform ${profileMenuOpen ? "rotate-180" : ""
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2">
                                        <div className="px-4 py-3 border-b">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {getUserName()}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user?.email}
                                            </p>
                                        </div>

                                        <div className="py-2">
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                                    />
                                                </svg>
                                                Dashboard
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                    />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        {mobileMenuOpen ? (
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t bg-white">
                    {isAuthenticated ? (
                        <div className="px-4 py-4 space-y-3">
                            <div className="flex items-center gap-3 pb-3 border-b">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                    {getInitials()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {getUserName()}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/dashboard"
                                className={`block px-3 py-2 rounded-lg text-sm font-medium ${isActive("/dashboard")
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-gray-700"
                                    }`}
                            >
                                Dashboard
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="px-4 py-4 space-y-3">
                            <Link
                                href="/login"
                                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="block px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white text-center"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}

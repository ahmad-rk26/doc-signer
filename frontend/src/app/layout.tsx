import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
    title: "Document Signature App",
    description: "Secure digital signatures for modern workflows",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
                <Navbar />

                <main className="flex-grow">{children}</main>

                <Footer />

                {/* Toast Provider */}
                <Toaster
                    position="top-right"
                    reverseOrder={false}
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: "#111827",
                            color: "#ffffff",
                            borderRadius: "14px",
                            padding: "12px 16px",
                            fontSize: "14px",
                        },
                        success: {
                            iconTheme: {
                                primary: "#10b981",
                                secondary: "#ffffff",
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: "#ef4444",
                                secondary: "#ffffff",
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
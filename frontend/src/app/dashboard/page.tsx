"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/app/lib/api";
import Link from "next/link";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type DocumentItem = {
    id: string;
    file_path: string;
    status: string;
    created_at?: string;
};

export default function DashboardPage() {
    const { token, isAuthenticated, isLoading, authReady } = useAuth();
    const router = useRouter();

    const [docs, setDocs] = useState<DocumentItem[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [shareModal, setShareModal] = useState<{
        open: boolean;
        docId: string;
    }>({ open: false, docId: "" });
    const [recipientEmail, setRecipientEmail] = useState("");

    const fetchDocuments = useCallback(async () => {
        if (!token) return;

        try {
            const res = await api.get("/api/docs");

            setDocs(res.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                toast.error("Session expired. Please login again.");
                router.replace("/login");
            } else {
                toast.error("Failed to load documents");
            }
        } finally {
            setLoadingDocs(false);
        }
    }, [token, router]);

    useEffect(() => {
        if (!authReady || isLoading) return;

        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }

        fetchDocuments();
    }, [isLoading, isAuthenticated, authReady, fetchDocuments, router]);

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            toast.loading("Uploading...", { id: "upload" });
            await api.post("/api/docs/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success("Document uploaded", { id: "upload" });
            fetchDocuments();
        } catch {
            toast.error("Upload failed", { id: "upload" });
        }
    };

    const handleDelete = async (docId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Delete this document? This cannot be undone.")) return;

        try {
            toast.loading("Deleting...", { id: "delete" });
            await api.delete(`/api/docs/${docId}`);

            toast.success("Document deleted", { id: "delete" });
            fetchDocuments();
        } catch {
            toast.error("Delete failed", { id: "delete" });
        }
    };

    const handleShare = async () => {
        if (!recipientEmail) {
            toast.error("Enter recipient email");
            return;
        }

        try {
            toast.loading("Sending...", { id: "share" });
            await api.post("/api/share", {
                documentId: shareModal.docId,
                recipientEmail,
            });

            toast.success("Signing link sent", { id: "share" });
            setShareModal({ open: false, docId: "" });
            setRecipientEmail("");
        } catch {
            toast.error("Failed to send", { id: "share" });
        }
    };

    const openShareModal = (docId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShareModal({ open: true, docId });
    };

    if (isLoading || !isAuthenticated) return null;

    const totalDocs = docs.length;
    const signedDocs = docs.filter((d) => d.status === "signed").length;
    const pendingDocs = docs.filter((d) => d.status !== "signed").length;

    return (
        <div className="pt-20 min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        My Documents
                    </h1>
                    <p className="text-gray-600">
                        Manage and sign your documents securely
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                                <h2 className="text-3xl font-bold text-gray-900 mt-2">{totalDocs}</h2>
                            </div>
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Signed</p>
                                <h2 className="text-3xl font-bold text-green-600 mt-2">{signedDocs}</h2>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <h2 className="text-3xl font-bold text-orange-500 mt-2">{pendingDocs}</h2>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Area */}
                <div className="mb-10">
                    <label className="block w-full cursor-pointer group">
                        <div className="border-2 border-dashed border-gray-300 bg-white hover:border-indigo-500 hover:bg-indigo-50 transition rounded-xl p-10 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition">
                                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className="text-lg font-semibold text-gray-700 mb-1">
                                    Upload PDF Document
                                </p>
                                <p className="text-sm text-gray-500">
                                    Click to browse or drag and drop your file here
                                </p>
                            </div>
                        </div>
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>

                {/* Documents Grid */}
                {loadingDocs ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : docs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No documents yet
                        </h3>
                        <p className="text-gray-500">
                            Upload your first document to get started
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {docs.map((doc) => (
                            <Link
                                key={doc.id}
                                href={`/docs/${doc.id}`}
                                className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition truncate">
                                                {doc.file_path.split("/").pop()}
                                            </h3>
                                            {doc.created_at && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(doc.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <span
                                        className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize flex-shrink-0 ${doc.status === "signed"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-orange-100 text-orange-700"
                                            }`}
                                    >
                                        {doc.status}
                                    </span>
                                </div>

                                <div className="flex gap-2 mt-4" onClick={(e) => e.preventDefault()}>
                                    <button
                                        onClick={(e) => openShareModal(doc.id, e)}
                                        className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        Share
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(doc.id, e)}
                                        className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {shareModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Share for Signing
                            </h2>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Recipient Email
                            </label>
                            <input
                                type="email"
                                placeholder="recipient@example.com"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleShare}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                            >
                                Send Link
                            </button>
                            <button
                                onClick={() => {
                                    setShareModal({ open: false, docId: "" });
                                    setRecipientEmail("");
                                }}
                                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

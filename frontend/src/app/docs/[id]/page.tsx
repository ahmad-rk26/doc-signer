"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { api, attachToken } from "@/app/lib/api";

import PDFViewer from "@/app/components/PDFViewer";
import SignaturePlacer from "@/app/components/SignaturePlacer";
import SignaturePad from "@/app/components/SignaturePad";
import AuditLog from "@/app/components/AuditLog";

import toast from "react-hot-toast";
import { DndContext, DragEndEvent } from "@dnd-kit/core";

type SigningSession = {
    id: string;
    recipient_email: string;
    token: string;
    expires_at: string;
    created_at: string;
    status?: string;
    signed_at?: string;
};

export default function DocumentPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { token, isAuthenticated, authReady } = useAuth();

    const [doc, setDoc] = useState<any>(null);
    const [fileUrl, setFileUrl] = useState("");
    const [signatureImage, setSignatureImage] = useState("");
    const [sessions, setSessions] = useState<SigningSession[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [bulkEmails, setBulkEmails] = useState("");
    const [auditRefresh, setAuditRefresh] = useState(0);
    const [pdfNumPages, setPdfNumPages] = useState(1);

    const [signaturePos, setSignaturePos] = useState({
        x: 180,
        y: 120,
        page: 1,
    });

    useEffect(() => {
        attachToken(token);
    }, [token]);

    const loadSessions = useCallback(async () => {
        if (!id || !token) return;

        try {
            const res = await api.get(`/api/sessions/${id}`);
            setSessions(res.data);
        } catch (err) {
            console.error("Failed to load sessions");
        }
    }, [id, token]);

    const loadDocument = useCallback(async () => {
        if (!id || !authReady || !isAuthenticated) return;

        try {
            const docRes = await api.get(`/api/docs/${id}`);
            setDoc(docRes.data);

            const encoded = encodeURIComponent(docRes.data.file_path);

            const urlRes = await api.get(
                `/api/public/storage?path=${encoded}`
            );

            setFileUrl(urlRes.data.url);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load document");
        }
    }, [id, authReady, isAuthenticated]);

    useEffect(() => {
        loadDocument();
        loadSessions();
    }, [loadDocument, loadSessions]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { delta } = event;

        setSignaturePos((prev) => ({
            ...prev,
            x: prev.x + delta.x,
            y: prev.y + delta.y,
        }));
    };

    const saveSignature = async () => {
        try {
            if (!signatureImage)
                return toast.error("Please add a signature first");

            toast.loading("Saving signature...", { id: "sig" });

            const uploadRes = await api.post("/api/upload-signature", {
                image: signatureImage,
            });

            const signaturePath = uploadRes.data.signaturePath;

            await api.post("/api/signatures", {
                documentId: id,
                ...signaturePos,
                signaturePath,
                width: 160,
                height: 60,
            });

            toast.success("Signature added", { id: "sig" });

            const finalizeRes = await api.post("/api/finalize", {
                documentId: id,
            });

            if (finalizeRes.data.signedPath) {
                const encoded = encodeURIComponent(finalizeRes.data.signedPath);
                const downloadRes = await api.get(
                    `/api/public/storage?path=${encoded}`
                );

                const link = document.createElement("a");
                link.href = downloadRes.data.url;
                link.download = `signed-${doc?.file_path?.split("/").pop()}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success("Document downloaded", { id: "download" });

                // Refresh all data without page reload
                await loadDocument();
                await loadSessions();
                setAuditRefresh(prev => prev + 1);
            }
        } catch (err: any) {
            console.error("ERROR:", err?.response?.data || err);

            toast.error(
                err?.response?.data?.error || "Failed to save signature",
                { id: "sig" }
            );
        }
    };

    const handleShare = async () => {
        if (!recipientEmail) {
            toast.error("Enter recipient email");
            return;
        }

        try {
            toast.loading("Sending...", { id: "share" });

            const response = await api.post("/api/share", {
                documentId: id,
                recipientEmail,
            }, {
                timeout: 30000 // 30 second timeout
            });

            console.log("Share response:", response.data);

            if (response.data.warning) {
                toast.success(response.data.message, { id: "share" });
                toast.error(response.data.warning, { duration: 5000 });
            } else {
                toast.success("Signing link sent", { id: "share" });
            }

            setRecipientEmail("");
            setShowShareModal(false);
            await loadSessions();
        } catch (err: any) {
            console.error("Share error:", err);
            const errorMsg = err?.response?.data?.error || err?.message || "Failed to send";
            toast.error(errorMsg, { id: "share" });
        }
    };

    const handleBulkShare = async () => {
        const emails = bulkEmails
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e);

        if (emails.length === 0) {
            toast.error("Enter at least one email");
            return;
        }

        try {
            toast.loading("Sending to multiple recipients...", { id: "bulk" });

            const response = await api.post("/api/share/bulk", {
                documentId: id,
                recipients: emails,
            }, {
                timeout: 60000 // 60 second timeout for bulk
            });

            console.log("Bulk share response:", response.data);

            const successCount = response.data.sessions?.length || 0;
            const failCount = response.data.errors?.length || 0;

            if (failCount > 0) {
                toast.success(`Sent to ${successCount} recipients`, { id: "bulk" });
                toast.error(`Failed for ${failCount} recipients`, { duration: 5000 });
            } else {
                toast.success(`Sent to ${successCount} recipients`, { id: "bulk" });
            }

            setBulkEmails("");
            setShowShareModal(false);
            await loadSessions();
        } catch (err: any) {
            console.error("Bulk share error:", err);
            const errorMsg = err?.response?.data?.error || err?.message || "Failed to send";
            toast.error(errorMsg, { id: "bulk" });
        }
    };

    const handleRevokeSession = async (sessionToken: string) => {
        if (!confirm("Revoke this signing link?")) return;

        try {
            toast.loading("Revoking...", { id: "revoke" });
            await api.delete(`/api/sessions/${sessionToken}`);
            toast.success("Session revoked", { id: "revoke" });
            loadSessions();
        } catch {
            toast.error("Failed to revoke", { id: "revoke" });
        }
    };

    const handleResendSession = async (sessionToken: string) => {
        try {
            toast.loading("Resending...", { id: "resend" });
            await api.post(`/api/sessions/${sessionToken}/resend`);
            toast.success("Link resent", { id: "resend" });
        } catch {
            toast.error("Failed to resend", { id: "resend" });
        }
    };

    const handleDownloadSigned = async () => {
        try {
            toast.loading("Preparing download...", { id: "dl" });
            const res = await api.get(`/api/docs/${id}/download`);

            const link = document.createElement("a");
            link.href = res.data.downloadUrl;
            link.download = `signed-${doc?.file_path?.split("/").pop()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Download started", { id: "dl" });
        } catch {
            toast.error("Download failed", { id: "dl" });
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this document? This cannot be undone.")) return;

        try {
            toast.loading("Deleting...", { id: "delete" });
            await api.delete(`/api/docs/${id}`);
            toast.success("Document deleted", { id: "delete" });
            router.push("/dashboard");
        } catch {
            toast.error("Delete failed", { id: "delete" });
        }
    };

    if (!fileUrl) {
        return (
            <div className="pt-20 min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading document...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-20 min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {doc?.file_path?.split("/").pop()}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${doc?.status === "signed"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-orange-100 text-orange-700"
                                            }`}
                                    >
                                        {doc?.status === "signed" && (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        {doc?.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {doc?.status === "signed" && (
                                <button
                                    onClick={handleDownloadSigned}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Signed
                                </button>
                            )}

                            <button
                                onClick={() => setShowShareModal(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share
                            </button>

                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Document Preview</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Place signature on page:</span>
                            <select
                                value={signaturePos.page}
                                onChange={(e) => setSignaturePos(prev => ({ ...prev, page: parseInt(e.target.value) }))}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                {Array.from({ length: pdfNumPages }, (_, i) => i + 1).map(pageNum => (
                                    <option key={pageNum} value={pageNum}>Page {pageNum}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DndContext onDragEnd={handleDragEnd}>
                        <PDFViewer
                            fileUrl={fileUrl}
                            currentPage={signaturePos.page}
                            onLoadSuccess={(numPages) => setPdfNumPages(numPages)}
                        >
                            <SignaturePlacer {...signaturePos} />
                        </PDFViewer>
                    </DndContext>
                </div>

                {/* Signature Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Your Signature</h2>
                    <SignaturePad onSave={setSignatureImage} />

                    <button
                        onClick={saveSignature}
                        className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Sign & Download Document
                    </button>
                </div>

                {/* Signing Sessions */}
                {sessions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Signing Sessions</h2>
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-200 transition"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {session.recipient_email}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Expires: {new Date(session.expires_at).toLocaleDateString()}
                                            </p>
                                            {session.status === "completed" && session.signed_at && (
                                                <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Signed on {new Date(session.signed_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {session.status !== "completed" ? (
                                            <>
                                                <button
                                                    onClick={() => handleResendSession(session.token)}
                                                    className="px-3 py-2 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition"
                                                >
                                                    Resend
                                                </button>
                                                <button
                                                    onClick={() => handleRevokeSession(session.token)}
                                                    className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition"
                                                >
                                                    Revoke
                                                </button>
                                            </>
                                        ) : (
                                            <span className="px-3 py-2 bg-green-100 text-green-700 text-sm rounded-lg font-medium">
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <AuditLog docId={id} refreshTrigger={auditRefresh} />

                {/* Share Modal */}
                {showShareModal && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
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
                                    Single Recipient
                                </label>
                                <input
                                    type="email"
                                    placeholder="recipient@example.com"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleShare}
                                    className="w-full mt-3 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                                >
                                    Send Link
                                </button>
                            </div>

                            <div className="border-t pt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Multiple Recipients (comma-separated)
                                </label>
                                <textarea
                                    placeholder="email1@example.com, email2@example.com"
                                    value={bulkEmails}
                                    onChange={(e) => setBulkEmails(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={3}
                                />
                                <button
                                    onClick={handleBulkShare}
                                    className="w-full mt-3 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                                >
                                    Send to Multiple
                                </button>
                            </div>

                            <button
                                onClick={() => setShowShareModal(false)}
                                className="w-full mt-6 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";
import PDFViewer from "@/app/components/PDFViewer";
import SignaturePlacer from "@/app/components/SignaturePlacer";
import SignaturePad from "@/app/components/SignaturePad";
import toast from "react-hot-toast";
import { DndContext, DragEndEvent } from "@dnd-kit/core";

type SessionStatus = {
    valid: boolean;
    expired: boolean;
    documentStatus: string;
    recipientEmail: string;
    expiresAt: string;
};

export default function SignDocumentPage() {
    const params = useParams();
    const token =
        typeof params?.token === "string" ? params.token : undefined;

    const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
        null
    );
    const [fileUrl, setFileUrl] = useState("");
    const [signatureImage, setSignatureImage] = useState("");
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(true);
    const [signed, setSigned] = useState(false);

    const [signaturePos, setSignaturePos] = useState({
        x: 180,
        y: 120,
        page: 1,
    });

    useEffect(() => {
        if (!token) return;

        const validateAndLoad = async () => {
            try {
                const statusRes = await api.get(
                    `/api/public/session/${token}/status`
                );

                setSessionStatus(statusRes.data);

                if (statusRes.data.expired) {
                    toast.error("This signing link has expired");
                    setLoading(false);
                    return;
                }

                if (statusRes.data.documentStatus === "signed") {
                    toast.error("This document has already been signed");
                    setSigned(true);
                }

                const docRes = await api.get(
                    `/api/public/docs/${token}`
                );

                const encoded = encodeURIComponent(docRes.data.file_path);
                const urlRes = await api.get(
                    `/api/public/storage?path=${encoded}`
                );

                setFileUrl(urlRes.data.url);
                setFileName(docRes.data.file_path.split("/").pop());
                setLoading(false);
            } catch (err: any) {
                console.error(err);
                toast.error(
                    err?.response?.data?.error || "Failed to load document"
                );
                setLoading(false);
            }
        };

        validateAndLoad();
    }, [token]);

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
            if (!signatureImage) {
                return toast.error("Please add a signature first");
            }

            toast.loading("Signing document...", { id: "sign" });

            const upload = await api.post(
                "/api/public/upload-signature",
                { image: signatureImage, token }
            );

            const signRes = await api.post(
                "/api/public/sign",
                {
                    token,
                    ...signaturePos,
                    signaturePath: upload.data.path,
                    width: 160,
                    height: 60,
                }
            );

            toast.success("Document signed", { id: "sign" });
            setSigned(true);

            if (signRes.data.downloadUrl) {
                const link = document.createElement("a");
                link.href = signRes.data.downloadUrl;
                link.download = `signed-${fileName}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success("Document downloaded");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Signing failed", {
                id: "sign",
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-indigo-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading document...</p>
                </div>
            </div>
        );
    }

    if (sessionStatus?.expired) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Link Expired
                    </h1>
                    <p className="text-sm text-gray-600">
                        This signing link has expired. Please contact the document owner to request a new link.
                    </p>
                </div>
            </div>
        );
    }

    if (signed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Document Signed
                    </h1>
                    <p className="text-sm text-gray-600">
                        This document has been successfully signed. The signed PDF has been downloaded to your device.
                    </p>
                </div>
            </div>
        );
    }

    if (!fileUrl) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Invalid Link
                    </h1>
                    <p className="text-sm text-gray-600">
                        This signing link is invalid or has been revoked.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Sign Document</h1>
                            {sessionStatus && (
                                <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                    <span className="inline-block">{sessionStatus.recipientEmail}</span>
                                    <span className="mx-2 hidden sm:inline">•</span>
                                    <span className="inline-block sm:inline">
                                        Expires {new Date(sessionStatus.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={saveSignature}
                            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Sign & Download
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* PDF Viewer - Takes 2 columns on large screens */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                            <DndContext onDragEnd={handleDragEnd}>
                                <PDFViewer fileUrl={fileUrl}>
                                    <SignaturePlacer {...signaturePos} />
                                </PDFViewer>
                            </DndContext>
                        </div>
                    </div>

                    {/* Signature Panel - Takes 1 column on large screens */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-24">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Your Signature</h2>
                            <SignaturePad onSave={setSignatureImage} />

                            {/* Instructions */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">How to sign</h3>
                                <ol className="space-y-2 text-xs text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">1</span>
                                        <span>Draw or upload your signature</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">2</span>
                                        <span>Drag the signature box to position it</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">3</span>
                                        <span>Click "Sign & Download"</span>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

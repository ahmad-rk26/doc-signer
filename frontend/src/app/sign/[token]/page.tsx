"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";
import PDFViewer from "@/app/components/PDFViewer";
import ResizableSignaturePlacer from "@/app/components/ResizableSignaturePlacer";
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
        width: 160,
        height: 60,
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
                    toast.error("This document has already been signed by all recipients");
                    setSigned(true);
                    setLoading(false);
                    return;
                }

                // Check if this specific session is already completed
                if (statusRes.data.sessionStatus === "completed") {
                    toast.error("You have already signed this document");
                    setSigned(true);
                    setLoading(false);
                    return;
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

    const handleResize = (width: number, height: number) => {
        setSignaturePos((prev) => ({
            ...prev,
            width,
            height,
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
            <div className="pt-24 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading document...</p>
                </div>
            </div>
        );
    }

    if (sessionStatus?.expired) {
        return (
            <div className="pt-24 min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">⏰</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Link Expired
                    </h1>
                    <p className="text-gray-600">
                        This signing link has expired. Please contact the document
                        owner to request a new link.
                    </p>
                </div>
            </div>
        );
    }

    if (signed) {
        return (
            <div className="pt-24 min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Document Signed
                    </h1>
                    <p className="text-gray-600">
                        This document has been successfully signed. The signed PDF
                        has been downloaded to your device.
                    </p>
                </div>
            </div>
        );
    }

    if (!fileUrl) {
        return (
            <div className="pt-24 min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Invalid Link
                    </h1>
                    <p className="text-gray-600">
                        This signing link is invalid or has been revoked.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-20 min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Sign Document</h1>
                    {sessionStatus && (
                        <div className="text-sm text-gray-600">
                            <p>Recipient: {sessionStatus.recipientEmail}</p>
                            <p>
                                Expires:{" "}
                                {new Date(sessionStatus.expiresAt).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>

                <DndContext onDragEnd={handleDragEnd}>
                    <PDFViewer fileUrl={fileUrl}>
                        <ResizableSignaturePlacer
                            {...signaturePos}
                            onResize={handleResize}
                        />
                    </PDFViewer>
                </DndContext>

                <div className="mt-10">
                    <SignaturePad onSave={setSignatureImage} />

                    <button
                        onClick={saveSignature}
                        className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Sign & Download Document
                    </button>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                        How to sign:
                    </h3>
                    <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                        <li>Draw your signature or upload an image</li>
                        <li>Drag the signature to position it on the document</li>
                        <li>Click "Sign & Download Document"</li>
                        <li>The signed PDF will download automatically</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

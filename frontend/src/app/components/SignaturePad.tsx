"use client";

import SignatureCanvas from "react-signature-canvas";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SignaturePad({
    onSave,
}: {
    onSave: (dataUrl: string) => void;
}) {
    const ref = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<"draw" | "upload">("draw");
    const [uploadedImage, setUploadedImage] = useState<string>("");
    const [canvasWidth, setCanvasWidth] = useState(400);

    useEffect(() => {
        const updateCanvasWidth = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setCanvasWidth(Math.min(width - 2, 400));
            }
        };

        updateCanvasWidth();
        window.addEventListener("resize", updateCanvasWidth);
        return () => window.removeEventListener("resize", updateCanvasWidth);
    }, []);

    const save = () => {
        if (mode === "draw") {
            if (!ref.current) return;
            const dataUrl = ref.current.toDataURL("image/png");
            onSave(dataUrl);
            toast.success("Signature saved");
        } else {
            if (!uploadedImage) {
                toast.error("Please upload an image first");
                return;
            }
            onSave(uploadedImage);
            toast.success("Signature saved");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setUploadedImage(dataUrl);
            toast.success("Image uploaded");
        };
        reader.readAsDataURL(file);
    };

    return (
        <div>
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setMode("draw")}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "draw"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    Draw
                </button>
                <button
                    onClick={() => setMode("upload")}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "upload"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    Upload
                </button>
            </div>

            {/* Canvas/Upload Area */}
            <div ref={containerRef} className="mb-3">
                {mode === "draw" ? (
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <SignatureCanvas
                            ref={ref}
                            penColor="black"
                            canvasProps={{
                                width: canvasWidth,
                                height: 150,
                                className: "w-full",
                            }}
                        />
                    </div>
                ) : (
                    <div className="border border-gray-300 rounded-lg p-4 h-[150px] flex items-center justify-center bg-gray-50">
                        {uploadedImage ? (
                            <img
                                src={uploadedImage}
                                alt="Uploaded signature"
                                className="max-h-full max-w-full object-contain"
                            />
                        ) : (
                            <div className="text-center">
                                <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-xs text-gray-500">No image uploaded</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                {mode === "draw" ? (
                    <>
                        <button
                            onClick={() => ref.current?.clear()}
                            className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            onClick={save}
                            className="flex-1 px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Save
                        </button>
                    </>
                ) : (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Choose File
                        </button>
                        {uploadedImage && (
                            <>
                                <button
                                    onClick={() => setUploadedImage("")}
                                    className="px-3 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={save}
                                    className="px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Save
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
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
                setCanvasWidth(width);
            }
        };

        updateCanvasWidth();
        window.addEventListener("resize", updateCanvasWidth);
        return () => window.removeEventListener("resize", updateCanvasWidth);
    }, []);

    const save = () => {
        if (mode === "draw") {
            if (!ref.current || ref.current.isEmpty()) {
                toast.error("Please draw your signature first");
                return;
            }
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
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === "draw"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                >
                    <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Draw
                </button>
                <button
                    onClick={() => setMode("upload")}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === "upload"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                >
                    <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload
                </button>
            </div>

            {/* Canvas/Upload Area */}
            <div ref={containerRef} className="mb-4">
                {mode === "draw" ? (
                    <div className="border-2 border-gray-300 rounded-lg bg-white relative">
                        <SignatureCanvas
                            ref={ref}
                            penColor="#000000"
                            canvasProps={{
                                width: canvasWidth,
                                height: 180,
                                className: "w-full touch-none",
                                style: { display: 'block' }
                            }}
                        />
                        <div className="absolute top-2 left-2 text-xs text-gray-400 pointer-events-none select-none">
                            Sign here
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 h-[180px] flex items-center justify-center bg-gray-50">
                        {uploadedImage ? (
                            <img
                                src={uploadedImage}
                                alt="Uploaded signature"
                                className="max-h-full max-w-full object-contain"
                            />
                        ) : (
                            <div className="text-center">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm text-gray-500">No image selected</p>
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
                            className="flex-1 px-4 py-2.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            onClick={save}
                            className="flex-1 px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Save Signature
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
                            className="flex-1 px-4 py-2.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Choose File
                        </button>
                        {uploadedImage && (
                            <>
                                <button
                                    onClick={() => setUploadedImage("")}
                                    className="px-4 py-2.5 text-sm font-medium bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={save}
                                    className="px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
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

"use client";

import SignatureCanvas from "react-signature-canvas";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

export default function SignaturePad({
    onSave,
}: {
    onSave: (dataUrl: string) => void;
}) {
    const ref = useRef<SignatureCanvas>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<"draw" | "upload">("draw");
    const [uploadedImage, setUploadedImage] = useState<string>("");

    const save = () => {
        if (mode === "draw") {
            if (!ref.current) return;
            const dataUrl = ref.current.toDataURL("image/png");
            onSave(dataUrl);
        } else {
            if (!uploadedImage) {
                toast.error("Please upload an image first");
                return;
            }
            onSave(uploadedImage);
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
        <div className="p-4 border rounded-lg bg-white">
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setMode("draw")}
                    className={`px-4 py-2 rounded ${mode === "draw"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                        }`}
                >
                    Draw Signature
                </button>
                <button
                    onClick={() => setMode("upload")}
                    className={`px-4 py-2 rounded ${mode === "upload"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                        }`}
                >
                    Upload Image
                </button>
            </div>

            {mode === "draw" ? (
                <SignatureCanvas
                    ref={ref}
                    penColor="black"
                    canvasProps={{
                        width: 400,
                        height: 150,
                        className: "border rounded",
                    }}
                />
            ) : (
                <div className="border rounded p-4 h-[150px] flex items-center justify-center bg-gray-50">
                    {uploadedImage ? (
                        <img
                            src={uploadedImage}
                            alt="Uploaded signature"
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <p className="text-gray-500">No image uploaded</p>
                    )}
                </div>
            )}

            <div className="flex gap-3 mt-3">
                {mode === "draw" ? (
                    <button
                        onClick={() => ref.current?.clear()}
                        className="px-3 py-1 bg-gray-200 rounded"
                    >
                        Clear
                    </button>
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
                            className="px-3 py-1 bg-gray-200 rounded"
                        >
                            Choose File
                        </button>
                        {uploadedImage && (
                            <button
                                onClick={() => setUploadedImage("")}
                                className="px-3 py-1 bg-red-500 text-white rounded"
                            >
                                Remove
                            </button>
                        )}
                    </>
                )}

                <button
                    onClick={save}
                    className="px-4 py-1 bg-blue-600 text-white rounded"
                >
                    Save Signature
                </button>
            </div>
        </div>
    );
}
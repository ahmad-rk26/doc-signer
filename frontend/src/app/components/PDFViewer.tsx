"use client";

import { useEffect, useState } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

type PDFViewerProps = {
    fileUrl: string;
    children?: React.ReactNode;
    currentPage?: number; // The page where signature should appear
    onLoadSuccess?: (numPages: number) => void; // Callback when PDF loads
};

export default function PDFViewer({ fileUrl, children, currentPage = 1, onLoadSuccess: onLoadSuccessCallback }: PDFViewerProps) {
    const [Document, setDocument] = useState<any>(null);
    const [Page, setPage] = useState<any>(null);
    const [numPages, setNumPages] = useState(0);

    useEffect(() => {
        const loadPdf = async () => {
            const mod = await import("react-pdf");

            // ✅ ALWAYS MATCHING VERSION (react-pdf internal worker)
            mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                "react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
                import.meta.url
            ).toString();

            setDocument(() => mod.Document);
            setPage(() => mod.Page);
        };

        loadPdf();
    }, []);

    const onLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        if (onLoadSuccessCallback) {
            onLoadSuccessCallback(numPages);
        }
    };

    if (!Document || !Page) {
        return (
            <div className="p-10 text-center text-gray-500">
                Loading PDF engine...
            </div>
        );
    }

    return (
        <div className="overflow-auto">
            <Document file={fileUrl} onLoadSuccess={onLoadSuccess}>
                {Array.from(new Array(numPages), (_, index) => {
                    const pageNumber = index + 1;
                    return (
                        <div key={index} className="relative mb-6">
                            <Page pageNumber={pageNumber} />
                            {/* Only render children on the selected page */}
                            {pageNumber === currentPage && children}
                        </div>
                    );
                })}
            </Document>
        </div>
    );
}
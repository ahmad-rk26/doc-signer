"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState, useRef } from "react";

type Props = {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    onResize: (width: number, height: number) => void;
};

export default function ResizableSignaturePlacer({
    page,
    x,
    y,
    width,
    height,
    onResize
}: Props) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `signature-${page}`,
        });

    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const style = {
        position: "absolute" as const,
        left: x,
        top: y,
        width: width,
        height: height,
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging || isResizing ? 50 : 10,
        transition: !isDragging && !isResizing ? "transform 0.15s ease" : undefined,
    };

    const handleResizeStart = (e: React.MouseEvent, corner: string) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: width,
            height: height
        });

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - resizeStart.x;
            const deltaY = moveEvent.clientY - resizeStart.y;

            let newWidth = resizeStart.width;
            let newHeight = resizeStart.height;

            if (corner.includes('right')) {
                newWidth = Math.max(100, resizeStart.width + deltaX);
            }
            if (corner.includes('bottom')) {
                newHeight = Math.max(40, resizeStart.height + deltaY);
            }

            onResize(newWidth, newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                bg-white/90 backdrop-blur-sm border-2 border-dashed
                ${isDragging || isResizing ? "border-indigo-500 shadow-xl" : "border-indigo-400"}
                rounded-lg
                select-none
                transition-all
                ${isDragging ? "opacity-90 cursor-move" : "hover:shadow-lg hover:border-indigo-500"}
                relative
                group
            `}
        >
            {/* Drag handle */}
            <div
                {...listeners}
                {...attributes}
                className="absolute inset-0 flex items-center justify-center cursor-move"
            >
                <div className="flex flex-col items-center gap-1 text-indigo-600 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <span className="text-xs font-medium">Signature</span>
                    <span className="text-[10px] text-indigo-500">{Math.round(width)}×{Math.round(height)}</span>
                </div>
            </div>

            {/* Resize handles */}
            {/* Bottom-right corner */}
            <div
                onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-125"
                style={{ zIndex: 60 }}
            />

            {/* Right edge */}
            <div
                onMouseDown={(e) => handleResizeStart(e, 'right')}
                className="absolute top-1/2 -right-1 w-3 h-8 -translate-y-1/2 bg-indigo-600 border-2 border-white rounded-full cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{ zIndex: 60 }}
            />

            {/* Bottom edge */}
            <div
                onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                className="absolute -bottom-1 left-1/2 w-8 h-3 -translate-x-1/2 bg-indigo-600 border-2 border-white rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{ zIndex: 60 }}
            />

            {/* Instructions tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Drag to move • Resize from edges
            </div>
        </div>
    );
}

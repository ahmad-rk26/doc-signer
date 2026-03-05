"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type Props = {
    page: number;
    x: number;
    y: number;
};

export default function SignaturePlacer({ page, x, y }: Props) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `signature-${page}`,
        });

    const style = {
        position: "absolute" as const,
        left: x,
        top: y,
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : 10,
        transition: !isDragging ? "transform 0.15s ease" : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                bg-white border-2 border-dashed
                ${isDragging ? "border-indigo-500 shadow-lg" : "border-indigo-400"}
                px-4 py-3
                rounded-lg
                cursor-move
                text-xs font-medium text-indigo-700
                select-none
                flex items-center gap-2
                transition-all
                ${isDragging ? "opacity-90 scale-105" : "hover:shadow-md hover:border-indigo-500"}
            `}
        >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span className="hidden sm:inline">Drag to position</span>
            <span className="sm:hidden">Drag</span>
        </div>
    );
}
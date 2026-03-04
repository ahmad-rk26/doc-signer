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
        bg-gradient-to-r from-blue-50 to-blue-100
        border-2 border-blue-500/70
        px-5 py-2.5
        rounded-lg
        cursor-move
        shadow-lg
        text-sm font-medium text-blue-800
        select-none
        flex items-center gap-2
        ${isDragging
                    ? "opacity-90 scale-105 shadow-2xl ring-2 ring-blue-400"
                    : "hover:shadow-xl"
                }
      `}
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.5 10a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
            </svg>

            Drag to place signature
        </div>
    );
}
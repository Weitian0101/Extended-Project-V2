import React from 'react';
import { StickyNote as StickyNoteType } from '@/types';
import { cn } from '@/lib/utils';

interface StickyNoteProps {
    note: StickyNoteType;
    className?: string;
    // In a real Tldraw implementation this would be handled differently, 
    // but for simple HTML canvas:
    style?: React.CSSProperties;
}

export function StickyNote({ note, className, style }: StickyNoteProps) {
    return (
        <div
            className={cn(
                "w-48 h-48 p-4 shadow-md rotate-1 transform hover:rotate-0 transition-transform cursor-move flex flex-col",
                {
                    'bg-yellow-200': note.color === 'yellow' || !note.color,
                    'bg-blue-200': note.color === 'blue',
                    'bg-green-200': note.color === 'green',
                    'bg-pink-200': note.color === 'pink',
                },
                className
            )}
            style={style}
        >
            <div className="flex-1 font-handwriting text-gray-800 text-lg leading-tight overflow-hidden whitespace-pre-wrap">
                {note.content}
            </div>
            {note.tags && note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded-full text-black/60">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

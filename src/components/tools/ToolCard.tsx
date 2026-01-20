import React from 'react';
import { MethodCard } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowRight, Play } from 'lucide-react';

interface ToolCardProps {
    card: MethodCard;
    onClick: () => void;
    colorTheme?: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
}

export function ToolCard({ card, onClick, colorTheme = 'gray' }: ToolCardProps) {
    const colorStyles = {
        green: 'border-green-200 hover:border-green-400 hover:bg-green-50',
        red: 'border-red-200 hover:border-red-400 hover:bg-red-50',
        yellow: 'border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50',
        blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
        gray: 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
    };

    return (
        <div
            className={cn(
                "bg-white border rounded-xl p-6 transition-all cursor-pointer group flex flex-col h-full shadow-sm relative overflow-hidden",
                colorStyles[colorTheme]
            )}
            onClick={onClick}
        >
            <div className="flex-1 z-10">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {card.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                    {card.purpose}
                </p>
            </div>

            <div className="mt-4 flex items-center text-sm font-medium opacity-60 group-hover:opacity-100 transition-opacity z-10">
                <span className="flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" /> Use Tool
                </span>
            </div>

            {/* Decorative circle */}
            <div className={cn(
                "absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150",
                {
                    'bg-green-500': colorTheme === 'green',
                    'bg-red-500': colorTheme === 'red',
                    'bg-yellow-500': colorTheme === 'yellow',
                    'bg-blue-500': colorTheme === 'blue',
                    'bg-gray-500': colorTheme === 'gray',
                }
            )} />
        </div>
    );
}

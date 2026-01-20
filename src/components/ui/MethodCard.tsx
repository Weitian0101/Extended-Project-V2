import React from 'react';
import { MethodCard as MethodCardType } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface MethodCardProps {
    card: MethodCardType;
    onClick?: () => void;
    className?: string;
}

export function MethodCard({ card, onClick, className }: MethodCardProps) {
    return (
        <div
            className={cn(
                "bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full",
                className
            )}
            onClick={onClick}
        >
            <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {card.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {card.purpose}
                </p>
            </div>

            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Open Guide <ArrowRight className="w-4 h-4 ml-1" />
            </div>
        </div>
    );
}

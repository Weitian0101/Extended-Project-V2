import React from 'react';
import Image from 'next/image';
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
        green: 'border-emerald-200 hover:border-emerald-400',
        red: 'border-rose-200 hover:border-rose-400',
        yellow: 'border-amber-200 hover:border-amber-400',
        blue: 'border-sky-200 hover:border-sky-400',
        gray: 'border-slate-200 hover:border-slate-400',
    };

    const heroStyles = {
        green: 'from-emerald-100 via-emerald-50 to-white',
        red: 'from-rose-100 via-rose-50 to-white',
        yellow: 'from-amber-100 via-amber-50 to-white',
        blue: 'from-sky-100 via-sky-50 to-white',
        gray: 'from-slate-100 via-slate-50 to-white',
    };

    return (
        <div
            className={cn(
                "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border bg-white p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(15,23,42,0.12)]",
                colorStyles[colorTheme]
            )}
            onClick={onClick}
        >
            <div className={cn(
                "relative overflow-hidden rounded-[22px] border border-white/70 bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
                heroStyles[colorTheme]
            )}>
                <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_72%)]" />
                <div className="relative h-72">
                    <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes="(min-width: 1280px) 23vw, (min-width: 768px) 40vw, 100vw"
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                        className="p-4 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                </div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col px-1 pb-1 pt-5">
                {card.category && (
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {card.category}
                    </div>
                )}
                <h3 className="mt-2 text-xl font-display font-semibold text-slate-950">
                    {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {card.purpose}
                </p>

                <div className="mt-5 flex items-center justify-between text-sm font-medium text-slate-500 transition-colors group-hover:text-slate-900">
                    <span className="inline-flex items-center gap-2">
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Use Tool
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
            </div>
        </div>
    );
}

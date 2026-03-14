import React from 'react';
import Image from 'next/image';
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
                "group flex h-full cursor-pointer flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(15,23,42,0.12)]",
                className
            )}
            onClick={onClick}
        >
            <div className="relative overflow-hidden rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,#f8fbff,#ffffff)]">
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

            <div className="flex-1 px-1 pb-1 pt-5">
                <h3 className="text-xl font-display font-semibold text-slate-950 transition-colors group-hover:text-sky-600">
                    {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {card.purpose}
                </p>
            </div>

            <div className="mt-2 flex items-center text-sm font-medium text-sky-600 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                Open Guide <ArrowRight className="ml-1 h-4 w-4" />
            </div>
        </div>
    );
}

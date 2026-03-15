'use client';

import React from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

interface BrandedLoadingScreenProps {
    label: string;
    detail?: string;
    fullscreen?: boolean;
    compact?: boolean;
    className?: string;
}

export function BrandedLoadingScreen({
    label,
    detail = 'Preparing the workspace and live context...',
    fullscreen = false,
    compact = false,
    className
}: BrandedLoadingScreenProps) {
    return (
        <div
            className={cn(
                'relative flex items-center justify-center overflow-hidden',
                fullscreen ? 'min-h-screen bg-[var(--background)] px-6' : 'h-full min-h-[18rem] px-6 py-10',
                className
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom,rgba(52,211,153,0.1),transparent_28%)]" />
            <div className={cn('surface-panel-strong relative overflow-hidden rounded-[30px] border px-8 py-8 text-center', compact ? 'w-full max-w-md' : 'w-full max-w-xl')}>
                <div className="pointer-events-none absolute inset-x-[18%] top-[-18%] h-28 rounded-full bg-sky-300/18 blur-[84px] dark:bg-sky-400/10" />
                <div className="relative mx-auto flex w-full max-w-sm flex-col items-center">
                    <div className="loading-orbit-shell relative flex h-28 w-28 items-center justify-center rounded-full">
                        <span className="loading-orbit loading-orbit-outer absolute inset-0 rounded-full border border-sky-400/18" />
                        <span className="loading-orbit loading-orbit-inner absolute inset-[0.8rem] rounded-full border border-emerald-400/20" />
                        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border border-[var(--panel-border)] bg-white/92 shadow-[0_18px_36px_rgba(15,23,42,0.12)] dark:bg-slate-950/72">
                            <Image
                                src="/images/logo.png"
                                alt="Academy of Design Thinking"
                                fill
                                sizes="80px"
                                style={{ objectFit: 'contain', objectPosition: 'center' }}
                                className="p-3"
                            />
                        </div>
                    </div>

                    <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--foreground-muted)]">
                        Academy of Design Thinking
                    </div>
                    <div className="mt-3 text-2xl font-display font-semibold text-[var(--foreground)]">
                        {label}
                    </div>
                    <div className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--foreground-soft)]">
                        {detail}
                    </div>

                    <div className="mt-5 flex items-center gap-2">
                        <span className="loading-dot h-2.5 w-2.5 rounded-full bg-sky-400/90" />
                        <span className="loading-dot h-2.5 w-2.5 rounded-full bg-emerald-400/90" style={{ animationDelay: '120ms' }} />
                        <span className="loading-dot h-2.5 w-2.5 rounded-full bg-amber-300/90" style={{ animationDelay: '240ms' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

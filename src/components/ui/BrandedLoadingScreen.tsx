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
    fullscreen = false,
    compact = false,
    className
}: BrandedLoadingScreenProps) {
    const [logoSrc, setLogoSrc] = React.useState('/images/logo-small.avif');

    return (
        <div
            className={cn(
                'relative flex items-center justify-center overflow-hidden',
                fullscreen ? 'min-h-screen bg-[var(--background)] px-6' : 'h-full min-h-[18rem] px-6 py-10',
                className
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.12),transparent_28%)]" />
            <div className={cn('relative mx-auto flex w-full flex-col items-center text-center', compact ? 'max-w-sm' : 'max-w-md')}>
                <div className="pointer-events-none absolute inset-x-[14%] top-[-8%] h-32 rounded-full bg-sky-300/22 blur-[96px] dark:bg-sky-400/12" />

                <div className="relative flex h-40 w-40 items-center justify-center">
                    <div className="loading-logo-breathe absolute inset-0 rounded-full bg-sky-400/16 blur-[44px] dark:bg-sky-400/14" />
                    <div className="loading-logo-breathe absolute inset-[14%] rounded-full bg-amber-300/10 blur-[28px]" style={{ animationDelay: '-1.2s' }} />
                    <div className="loading-logo-breathe relative h-24 w-24 sm:h-28 sm:w-28">
                        <Image
                            src={logoSrc}
                            alt="Academy of Design Thinking"
                            width={112}
                            height={112}
                            priority
                            unoptimized
                            fetchPriority="high"
                            decoding="sync"
                            draggable={false}
                            sizes="112px"
                            className="h-full w-full object-contain object-center"
                            onError={() => {
                                if (logoSrc !== '/images/logo.png') {
                                    setLogoSrc('/images/logo.png');
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="mt-3 text-lg font-display font-semibold text-[var(--foreground)]">
                    Loading...
                </div>

                <div className="mt-5 w-full max-w-xs">
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--panel)]/80">
                        <div className="loading-progress-bar h-full rounded-full bg-[linear-gradient(90deg,rgba(56,189,248,0.9),rgba(96,165,250,0.82),rgba(251,191,36,0.76))]" />
                    </div>
                </div>
            </div>
        </div>
    );
}

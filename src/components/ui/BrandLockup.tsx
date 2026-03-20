'use client';

import React from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { useAppTheme } from '@/components/ui/AppThemeProvider';

interface BrandLockupProps {
    compact?: boolean;
    className?: string;
    accent?: string;
    title?: string;
    subtitle?: string;
    onClick?: () => void;
}

export function BrandLockup({
    compact = false,
    className,
    accent = 'Powered by Academy of Design Thinking',
    title = 'Innovation Sandbox',
    subtitle = 'Beyond Post-its operating layer',
    onClick
}: BrandLockupProps) {
    const { theme } = useAppTheme();
    const Container = onClick ? 'button' : 'div';

    return (
        <Container
            {...(onClick ? { type: 'button', onClick } : {})}
            className={cn(
                'flex items-center gap-3 text-left transition-all duration-300',
                onClick && 'cursor-pointer rounded-[26px] hover:-translate-y-0.5 hover:scale-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40',
                className
            )}
        >
            <div
                className={cn(
                    'relative shrink-0 overflow-hidden rounded-[22px] border bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)]',
                    compact ? 'h-[3.75rem] w-40 px-3' : 'h-[4.2rem] w-48 px-4',
                    theme === 'dark' ? 'border-white/12 shadow-[0_20px_45px_rgba(2,6,23,0.28)]' : 'border-slate-200/80'
                )}
            >
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.72))]" />
                <div className="relative h-full w-full">
                    <Image
                        src="/images/logo.png"
                        alt="Academy of Design Thinking"
                        fill
                        loading="eager"
                        sizes={compact ? '144px' : '176px'}
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                        className={theme === 'light' ? 'mix-blend-multiply' : ''}
                    />
                </div>
            </div>
            {!compact && (
                <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--foreground-muted)]">
                        {accent}
                    </div>
                    <div className="mt-1 text-base font-display font-semibold text-[var(--foreground)]">
                        {title}
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)]">
                        {subtitle}
                    </div>
                </div>
            )}
        </Container>
    );
}

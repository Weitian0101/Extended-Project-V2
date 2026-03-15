'use client';

import React from 'react';
import { MoonStar, SunMedium } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppTheme } from '@/components/ui/AppThemeProvider';

interface ThemeToggleProps {
    compact?: boolean;
    className?: string;
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
    const { theme, toggleTheme } = useAppTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
                'inline-flex items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5',
                compact
                    ? 'h-11 w-11 border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground)] shadow-[0_14px_28px_rgba(15,23,42,0.08)]'
                    : 'gap-2.5 px-4 py-2 border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground)] shadow-[0_16px_32px_rgba(15,23,42,0.08)]',
                className
            )}
        >
            <span
                className={cn(
                    'flex items-center justify-center rounded-full transition-all duration-300 will-change-transform',
                    compact ? 'h-8 w-8' : 'h-8 w-8',
                    isDark ? 'rotate-180 bg-sky-500/16 text-sky-300' : 'rotate-0 bg-amber-500/14 text-amber-600'
                )}
            >
                {isDark ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
            </span>
            {!compact && (
                <span className="text-sm font-medium tracking-tight">
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
            )}
        </button>
    );
}

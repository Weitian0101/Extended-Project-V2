'use client';

import React from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ProfilePanelProps {
    compact?: boolean;
    className?: string;
    name?: string;
    title?: string;
    onClick?: () => void;
}

export function ProfilePanel({ compact = false, className, name = 'User', title = 'Workspace Owner', onClick }: ProfilePanelProps) {
    if (compact) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    'inline-flex items-center gap-3 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-2 text-left shadow-[0_16px_34px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5',
                    className
                )}
                title={`${name} - ${title}`}
            >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-xs font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)]">
                    US
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--panel-strong)] bg-emerald-400" />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</div>
                    <div className="truncate text-xs text-[var(--foreground-muted)]">{title}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-3 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-2 text-left shadow-[0_18px_35px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5',
                className
            )}
        >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-sm font-semibold text-white">
                US
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[var(--panel-strong)] bg-emerald-400" />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
                </div>
                <div className="truncate text-xs text-[var(--foreground-muted)]">{title}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
        </button>
    );
}

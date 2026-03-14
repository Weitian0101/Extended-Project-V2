'use client';

import React from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

import { MembershipBadge, getMembershipLabel, getMembershipMeta } from '@/components/ui/MembershipBadge';
import { cn } from '@/lib/utils';
import { MembershipTier } from '@/types';

interface ProfilePanelProps {
    compact?: boolean;
    className?: string;
    name?: string;
    title?: string;
    tier?: MembershipTier;
    onClick?: () => void;
}

function getInitials(name: string) {
    const parts = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase());

    return parts.join('') || 'US';
}

export function ProfilePanel({
    compact = false,
    className,
    name = 'User',
    title = 'Workspace Owner',
    tier,
    onClick
}: ProfilePanelProps) {
    const membershipMeta = tier ? getMembershipMeta(tier) : null;
    const initials = getInitials(name);
    const subtitle = tier ? getMembershipLabel(tier, true) : title;

    if (compact) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    'inline-flex items-center gap-3 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-2 text-left shadow-[0_16px_34px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5',
                    className
                )}
                title={`${name} - ${subtitle}${tier ? ` · ${title}` : ''}`}
            >
                <div
                    className={cn(
                        'relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)]',
                        membershipMeta
                            ? `bg-[linear-gradient(135deg,var(--tw-gradient-stops))] ${membershipMeta.avatarGradient}`
                            : 'bg-[linear-gradient(135deg,#2563eb,#38bdf8)]'
                    )}
                >
                    {initials}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--panel-strong)] bg-emerald-400" />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</div>
                    {tier ? (
                        <MembershipBadge tier={tier} size="xs" showMemberLabel className="mt-1" />
                    ) : (
                        <div className="truncate text-xs text-[var(--foreground-muted)]">{title}</div>
                    )}
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
            <div
                className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold text-white',
                    membershipMeta
                        ? `bg-[linear-gradient(135deg,var(--tw-gradient-stops))] ${membershipMeta.avatarGradient}`
                        : 'bg-[linear-gradient(135deg,#0f172a,#2563eb)]'
                )}
            >
                {initials}
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[var(--panel-strong)] bg-emerald-400" />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</span>
                    {!tier && <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />}
                </div>
                {tier ? (
                    <MembershipBadge tier={tier} size="xs" showMemberLabel className="mt-1" />
                ) : (
                    <div className="truncate text-xs text-[var(--foreground-muted)]">{title}</div>
                )}
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
        </button>
    );
}

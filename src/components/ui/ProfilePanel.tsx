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
    const trimmedName = name.trim();

    if (!trimmedName) {
        return 'US';
    }

    const parts = trimmedName.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }

    const compactName = trimmedName.replace(/\s+/g, '');

    if (compactName.length >= 2) {
        return compactName.slice(0, 2).toUpperCase();
    }

    return compactName.charAt(0).toUpperCase() || 'US';
}

export function ProfilePanel({
    compact = false,
    className,
    name = 'User',
    title = 'Workspace Owner',
    tier,
    onClick
}: ProfilePanelProps) {
    const displayName = name.trim() || 'User';
    const membershipMeta = tier ? getMembershipMeta(tier) : null;
    const initials = getInitials(displayName);
    const subtitle = tier ? getMembershipLabel(tier, true) : title;
    const avatarBackground = membershipMeta?.avatarBackground || 'linear-gradient(135deg,#2563eb,#38bdf8)';
    const expandedAvatarBackground = membershipMeta?.avatarBackground || 'linear-gradient(135deg,#0f172a,#2563eb)';

    if (compact) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    'inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-2 py-1.5 text-left shadow-[0_10px_20px_rgba(15,23,42,0.06)] transition-all duration-300 dark:shadow-[0_18px_34px_rgba(2,6,23,0.28)]',
                    className
                )}
                title={`${displayName} - ${subtitle}`}
            >
                <div
                    className="relative flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold uppercase leading-none text-white shadow-[0_8px_16px_rgba(37,99,235,0.16)]"
                    style={{ backgroundImage: avatarBackground }}
                >
                    {initials}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--panel-strong)] bg-emerald-400" />
                </div>
                <div className="min-w-0 pr-1">
                    <div className="truncate text-xs font-semibold leading-tight text-[var(--foreground)]">{displayName}</div>
                    <div className="truncate text-[10px] leading-tight text-[var(--foreground-muted)]">{subtitle}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-3 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-2 text-left shadow-[0_18px_35px_rgba(15,23,42,0.08)] transition-all duration-300 dark:shadow-[0_24px_44px_rgba(2,6,23,0.32)]',
                className
            )}
        >
            <div
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold uppercase leading-none text-white"
                style={{ backgroundImage: expandedAvatarBackground }}
            >
                {initials}
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[var(--panel-strong)] bg-emerald-400" />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</span>
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

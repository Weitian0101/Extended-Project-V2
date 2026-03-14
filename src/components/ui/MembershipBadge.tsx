import React from 'react';
import { Crown, Gem, ShieldCheck, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { MembershipTier } from '@/types';

const MEMBERSHIP_META = {
    free: {
        title: 'Free',
        memberLabel: 'Free member',
        Icon: ShieldCheck,
        pillClassName: 'border-slate-200 bg-slate-100 text-slate-700',
        solidClassName: 'border-slate-400/30 bg-[linear-gradient(135deg,#64748b,#334155)] text-white',
        avatarBackground: 'linear-gradient(135deg,#64748b,#334155)'
    },
    plus: {
        title: 'Plus',
        memberLabel: 'Plus member',
        Icon: Sparkles,
        pillClassName: 'border-sky-200 bg-sky-50 text-sky-700',
        solidClassName: 'border-sky-400/20 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white',
        avatarBackground: 'linear-gradient(135deg,#0ea5e9,#2563eb)'
    },
    ultra: {
        title: 'Ultra',
        memberLabel: 'Ultra member',
        Icon: Gem,
        pillClassName: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
        solidClassName: 'border-fuchsia-400/20 bg-[linear-gradient(135deg,#d946ef,#7c3aed)] text-white',
        avatarBackground: 'linear-gradient(135deg,#d946ef,#7c3aed)'
    },
    business: {
        title: 'Business',
        memberLabel: 'Business member',
        Icon: Crown,
        pillClassName: 'border-amber-200 bg-amber-50 text-amber-700',
        solidClassName: 'border-amber-400/20 bg-[linear-gradient(135deg,#f59e0b,#f97316)] text-white',
        avatarBackground: 'linear-gradient(135deg,#f59e0b,#f97316)'
    }
} satisfies Record<MembershipTier, {
    title: string;
    memberLabel: string;
    Icon: React.ComponentType<{ className?: string }>;
    pillClassName: string;
    solidClassName: string;
    avatarBackground: string;
}>;

interface MembershipBadgeProps {
    tier: MembershipTier;
    className?: string;
    variant?: 'pill' | 'solid';
    size?: 'xs' | 'sm' | 'md';
    showMemberLabel?: boolean;
}

export function getMembershipMeta(tier: MembershipTier) {
    return MEMBERSHIP_META[tier];
}

export function getMembershipLabel(tier: MembershipTier, showMemberLabel = false) {
    return showMemberLabel ? MEMBERSHIP_META[tier].memberLabel : MEMBERSHIP_META[tier].title;
}

export function MembershipBadge({
    tier,
    className,
    variant = 'pill',
    size = 'sm',
    showMemberLabel = false
}: MembershipBadgeProps) {
    const meta = getMembershipMeta(tier);
    const Icon = meta.Icon;
    const label = getMembershipLabel(tier, showMemberLabel);

    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 rounded-full border font-semibold',
                variant === 'solid' ? meta.solidClassName : meta.pillClassName,
                size === 'xs' && 'px-2.5 py-1 text-[11px] tracking-[0.14em]',
                size === 'sm' && 'px-3 py-1.5 text-xs tracking-[0.16em]',
                size === 'md' && 'px-4 py-2 text-sm tracking-[0.18em]',
                className
            )}
        >
            <Icon className={cn(size === 'xs' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4.5 w-4.5' : 'h-4 w-4')} />
            <span className="uppercase">{label}</span>
        </span>
    );
}

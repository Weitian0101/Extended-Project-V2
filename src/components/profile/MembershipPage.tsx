'use client';

import React from 'react';
import { ArrowLeft, Building2, ShieldCheck, Sparkles, Zap } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { MEMBERSHIP_PLANS } from '@/lib/membership';
import { BillingCycle, MembershipTier } from '@/types';

interface MembershipPageProps {
    currentTier: MembershipTier;
    billingCycle: BillingCycle;
    isUpdatingPlan?: boolean;
    onBack: () => void;
    onSelectPlan: (tier: MembershipTier) => void | Promise<void>;
}

const PLAN_ACCENTS: Record<MembershipTier, string> = {
    free: 'from-slate-200 via-slate-100 to-white',
    plus: 'from-sky-500 via-blue-500 to-cyan-400',
    ultra: 'from-fuchsia-500 via-violet-500 to-indigo-500',
    business: 'from-emerald-500 via-teal-500 to-cyan-400'
};

const PLAN_ICONS: Record<MembershipTier, React.ComponentType<{ className?: string }>> = {
    free: ShieldCheck,
    plus: Sparkles,
    ultra: Zap,
    business: Building2
};

const PLAN_EYEBROWS: Partial<Record<MembershipTier, string>> = {
    ultra: 'For teams and consultants'
};

function getActionLabel(tier: MembershipTier, currentTier: MembershipTier) {
    if (tier === currentTier) {
        return 'Current Plan';
    }

    if (tier === 'free') {
        return 'Choose Free';
    }

    if (tier === 'plus') {
        return 'Switch to Plus';
    }

    if (tier === 'ultra') {
        return 'Switch to Ultra';
    }

    return 'Switch to Business';
}

export function MembershipPage({ currentTier, billingCycle, isUpdatingPlan = false, onBack, onSelectPlan }: MembershipPageProps) {
    return (
        <section className="relative overflow-hidden rounded-[38px] border border-[var(--panel-border)] bg-[var(--panel-strong)] p-6 lg:p-8">
            <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)
                    `,
                    backgroundSize: '48px 48px'
                }}
            />

            <div className="relative">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to profile
                </button>

                <div className="mt-8 max-w-3xl">
                    <h2 className="text-4xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">Membership</h2>
                    <p className="mt-3 text-base leading-relaxed text-[var(--foreground-soft)]">
                        Choose the plan shape that matches your solo work, consulting practice, or delivery team.
                        Pricing is shown in {billingCycle} billing.
                    </p>
                </div>

                <div className="mt-10 grid gap-5 xl:grid-cols-4">
                    {Object.values(MEMBERSHIP_PLANS).map((plan) => {
                        const Icon = PLAN_ICONS[plan.id];
                        const accent = PLAN_ACCENTS[plan.id];
                        const eyebrow = PLAN_EYEBROWS[plan.id];
                        const isCurrent = plan.id === currentTier;

                        return (
                            <div
                                key={plan.id}
                                className={[
                                    'relative flex h-full flex-col rounded-[30px] border bg-white/90 p-6 shadow-[0_24px_54px_rgba(15,23,42,0.08)] backdrop-blur-xl',
                                    isCurrent ? 'border-sky-400 shadow-[0_28px_60px_rgba(14,165,233,0.14)]' : 'border-white/70'
                                ].join(' ')}
                            >
                                {eyebrow && (
                                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(135deg,#4f46e5,#2563eb)] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.22)]">
                                        {eyebrow}
                                    </div>
                                )}

                                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br ${accent} text-white shadow-[0_18px_40px_rgba(37,99,235,0.18)]`}>
                                    <Icon className="h-7 w-7" />
                                </div>

                                <div className="mt-7 text-4xl font-display font-semibold text-slate-950">{plan.title}</div>
                                <p className="mt-4 text-sm leading-relaxed text-slate-500">{plan.summary}</p>

                                <div className="mt-10 flex items-end gap-2 text-slate-950">
                                    <span className="text-lg font-medium">US$</span>
                                    <span className="text-5xl font-display font-semibold">{billingCycle === 'yearly' ? plan.priceMonthly * 10 : plan.priceMonthly}</span>
                                    <span className="pb-1 text-xl text-slate-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                                </div>

                                <Button
                                    type="button"
                                    className="mt-8 w-full justify-center"
                                    variant={isCurrent ? 'secondary' : 'primary'}
                                    disabled={isUpdatingPlan || isCurrent}
                                    onClick={() => void onSelectPlan(plan.id)}
                                >
                                    {isUpdatingPlan && !isCurrent ? 'Updating...' : getActionLabel(plan.id, currentTier)}
                                </Button>

                                <div className="mt-9 text-base font-semibold text-slate-950">Included:</div>
                                <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-600">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}

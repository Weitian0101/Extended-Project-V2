'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Building2, CreditCard, Mail, MapPin, PencilLine, ReceiptText, Smartphone } from 'lucide-react';

import { MembershipPage } from '@/components/profile/MembershipPage';
import { PlanCheckoutDialog } from '@/components/profile/PlanCheckoutDialog';
import { MembershipBadge, getMembershipMeta } from '@/components/ui/MembershipBadge';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { buildMembershipProfile, getMembershipPlan, getMembershipPrice } from '@/lib/membership';
import { cn } from '@/lib/utils';
import { BillingCycle, MembershipCheckoutDraft, MembershipTier, UserProfileData } from '@/types';

interface ProfilePageProps {
    profile: UserProfileData;
    onUpdateProfile: (updates: Partial<UserProfileData>) => void | Promise<void>;
    onBack: () => void;
    isSaving?: boolean;
}

type ProfileView = 'overview' | 'personal' | 'workspace' | 'billing' | 'membership';

function formatDate(value?: string | null) {
    if (!value) return 'Not available';
    return new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatMoney(amount: number, currency: string) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency
    }).format(amount);
}

function formatSubscriptionStatus(status: UserProfileData['subscriptionStatus']) {
    switch (status) {
        case 'trial':
            return 'Trial';
        case 'active':
            return 'Active';
        case 'past_due':
            return 'Past due';
        case 'canceled':
            return 'Canceled';
        default:
            return 'Inactive';
    }
}

function derivePaymentMethodLabel(checkout: MembershipCheckoutDraft) {
    if (checkout.tier === 'free') {
        return 'No payment method required';
    }

    const digits = checkout.cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4) || '0000';
    return `Visa ending in ${last4}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{label}</div>
            <div className="mt-1 min-w-0 truncate whitespace-nowrap text-sm text-[var(--foreground-soft)]" title={typeof value === 'string' ? value : undefined}>{value}</div>
        </div>
    );
}

function ProfileHeroTile({
    icon: Icon,
    label,
    value,
    helper,
    tone = 'slate',
    pulse = false
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    helper?: string;
    tone?: 'slate' | 'sky' | 'violet' | 'emerald';
    pulse?: boolean;
}) {
    const toneStyles = {
        slate: {
            panel: 'border-slate-200/70 bg-[linear-gradient(180deg,rgba(148,163,184,0.10),rgba(148,163,184,0.03))]',
            bar: 'from-slate-300/20 via-slate-300/80 to-slate-300/20',
            icon: 'border-slate-200/80 bg-slate-500/8 text-slate-500 dark:border-slate-700/70 dark:bg-slate-400/10 dark:text-slate-300',
            value: 'text-[var(--foreground)]'
        },
        sky: {
            panel: 'border-sky-200/70 bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(56,189,248,0.03))]',
            bar: 'from-sky-300/20 via-sky-400/75 to-cyan-300/20',
            icon: 'border-sky-200/80 bg-sky-500/10 text-sky-600 dark:border-sky-700/60 dark:bg-sky-400/10 dark:text-sky-300',
            value: 'text-[var(--foreground)]'
        },
        violet: {
            panel: 'border-violet-200/70 bg-[linear-gradient(180deg,rgba(167,139,250,0.10),rgba(167,139,250,0.03))]',
            bar: 'from-violet-300/20 via-violet-400/75 to-fuchsia-300/20',
            icon: 'border-violet-200/80 bg-violet-500/10 text-violet-600 dark:border-violet-700/60 dark:bg-violet-400/10 dark:text-violet-300',
            value: 'text-[var(--foreground)]'
        },
        emerald: {
            panel: 'border-emerald-200/70 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))]',
            bar: 'from-emerald-300/20 via-emerald-400/75 to-teal-300/20',
            icon: 'border-emerald-200/80 bg-emerald-500/10 text-emerald-600 dark:border-emerald-700/60 dark:bg-emerald-400/10 dark:text-emerald-300',
            value: 'text-emerald-700 dark:text-emerald-300'
        }
    }[tone];

    return (
        <div className={cn('relative overflow-hidden rounded-[20px] border px-3 py-2.5 lg:px-3.5 lg:py-3', toneStyles.panel)}>
            <div className={cn('absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r', toneStyles.bar)} />
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border', toneStyles.icon)}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                        {label}
                    </div>
                </div>
                {pulse && (
                    <span className="relative mt-0.5 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                    </span>
                )}
            </div>
            <div
                className={cn(
                    'mt-3 min-w-0 truncate whitespace-nowrap text-[15px] font-semibold leading-tight lg:text-base',
                    toneStyles.value
                )}
                title={typeof value === 'string' ? value : undefined}
            >
                {value}
            </div>
            {helper && (
                <div className="mt-0.5 min-w-0 truncate whitespace-nowrap text-[11px] text-[var(--foreground-muted)]" title={helper}>
                    {helper}
                </div>
            )}
        </div>
    );
}

export function ProfilePage({ profile, onUpdateProfile, onBack, isSaving = false }: ProfilePageProps) {
    const [view, setView] = useState<ProfileView>('overview');
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
    const [membershipCycle, setMembershipCycle] = useState<BillingCycle>(profile.billingCycle);
    const [checkoutTier, setCheckoutTier] = useState<MembershipTier | null>(null);
    const [checkoutReturnView, setCheckoutReturnView] = useState<ProfileView>('billing');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [draft, setDraft] = useState({
        name: profile.name,
        title: profile.title,
        phone: profile.phone,
        location: profile.location,
        workspace: profile.workspace,
        company: profile.company,
        billingEmail: profile.billingEmail
    });

    useEffect(() => {
        setDraft({
            name: profile.name,
            title: profile.title,
            phone: profile.phone,
            location: profile.location,
            workspace: profile.workspace,
            company: profile.company,
            billingEmail: profile.billingEmail
        });
        setMembershipCycle(profile.billingCycle);
    }, [
        profile.billingCycle,
        profile.billingEmail,
        profile.company,
        profile.location,
        profile.name,
        profile.phone,
        profile.title,
        profile.workspace
    ]);

    const handleSave = async () => {
        setStatusMessage(null);
        await onUpdateProfile(draft);
        setStatusMessage('Profile changes saved.');
        setView('overview');
    };

    const handleSelectPlan = (tier: MembershipTier) => {
        setStatusMessage(null);
        setCheckoutReturnView('billing');
        setCheckoutTier(tier);
    };

    const handleCheckoutSubmit = async (checkout: MembershipCheckoutDraft) => {
        setIsUpdatingPlan(true);
        setStatusMessage(null);

        try {
            const isPaymentMethodUpdate = checkout.tier === profile.subscriptionTier
                && checkout.billingCycle === profile.billingCycle;
            const membershipUpdates = isPaymentMethodUpdate
                ? {
                    subscriptionTier: profile.subscriptionTier,
                    billingCycle: profile.billingCycle,
                    subscriptionStatus: profile.subscriptionStatus,
                    renewalDate: profile.renewalDate,
                    paymentMethodLabel: derivePaymentMethodLabel(checkout),
                    billingInvoices: profile.billingInvoices
                }
                : buildMembershipProfile(
                    checkout.tier,
                    checkout.billingCycle,
                    'active',
                    derivePaymentMethodLabel(checkout)
                );

            await onUpdateProfile({
                company: checkout.company,
                billingEmail: checkout.billingEmail,
                ...membershipUpdates
            });
            setMembershipCycle(checkout.billingCycle);
            setStatusMessage(
                isPaymentMethodUpdate
                    ? 'Payment method updated.'
                    : `${getMembershipPlan(checkout.tier).title} plan confirmed.`
            );
        } finally {
            setIsUpdatingPlan(false);
        }
    };

    const currentPlan = getMembershipPlan(profile.subscriptionTier);
    const membershipMeta = getMembershipMeta(profile.subscriptionTier);
    const MembershipIcon = membershipMeta.Icon;
    const statusLabel = formatSubscriptionStatus(profile.subscriptionStatus);
    const isActiveSubscription = profile.subscriptionStatus === 'active';

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <header className="sticky top-0 z-30 border-b border-[var(--panel-border)] bg-[var(--panel-strong)] backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={onBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <BrandLockup compact />
                    </div>
                    <ThemeToggle compact />
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">
                {statusMessage && (
                    <div className="mb-6 rounded-[22px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                        {statusMessage}
                    </div>
                )}

                {view === 'overview' && (
                    <>
                        <section className="surface-panel-strong rounded-[36px] p-6 lg:p-10">
                            <div className="grid gap-8 lg:grid-cols-[0.84fr_1.16fr]">
                                <div>
                                    <div className="eyebrow">Profile</div>
                                    <h1 className="mt-4 text-4xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">{profile.name}</h1>
                                    <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--foreground-soft)]">{profile.title}</p>
                                    <div className="mt-5 flex flex-wrap items-center gap-3">
                                        <MembershipBadge tier={profile.subscriptionTier} variant="solid" size="md" showMemberLabel />
                                    </div>
                                </div>

                                <div className="rounded-[30px] border border-[var(--panel-border)] bg-[var(--panel)] p-4 lg:p-5">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <ProfileHeroTile
                                            icon={Mail}
                                            label="Email"
                                            value={profile.email}
                                            tone="sky"
                                        />
                                        <ProfileHeroTile
                                            icon={Building2}
                                            label="Workspace"
                                            value={profile.workspace}
                                            tone="slate"
                                        />
                                        <ProfileHeroTile
                                            icon={MembershipIcon}
                                            label="Plan"
                                            value={currentPlan.title}
                                            helper={`${currentPlan.includedSeats} seat${currentPlan.includedSeats === 1 ? '' : 's'} included`}
                                            tone="violet"
                                        />
                                        <ProfileHeroTile
                                            icon={BadgeCheck}
                                            label="Status"
                                            value={statusLabel}
                                            helper={`${profile.billingCycle} billing`}
                                            tone={isActiveSubscription ? 'emerald' : 'slate'}
                                            pulse={isActiveSubscription}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mt-8 grid gap-6 lg:grid-cols-3">
                            <button
                                type="button"
                                onClick={() => setView('personal')}
                                className="group surface-panel rounded-[30px] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.1)]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                                        <PencilLine className="h-5 w-5" />
                                    </div>
                                    <span className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
                                        Edit
                                    </span>
                                </div>
                                <div className="mt-5 text-2xl font-display font-semibold text-[var(--foreground)]">Personal details</div>
                                <div className="mt-5 space-y-3 text-sm text-[var(--foreground-soft)]">
                                    <DetailRow label="Full name" value={profile.name} />
                                    <DetailRow label="Email" value={profile.email} />
                                    <DetailRow label="Location" value={profile.location || 'Add location'} />
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setView('workspace')}
                                className="group surface-panel rounded-[30px] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.1)]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <span className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
                                        View
                                    </span>
                                </div>
                                <div className="mt-5 text-2xl font-display font-semibold text-[var(--foreground)]">Workspace identity</div>
                                <div className="mt-5 space-y-3 text-sm text-[var(--foreground-soft)]">
                                    <DetailRow label="Workspace" value={profile.workspace} />
                                    <DetailRow label="Company" value={profile.company || 'Add company'} />
                                    <DetailRow label="Contact" value={profile.billingEmail} />
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setView('billing')}
                                className="group surface-panel rounded-[30px] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.1)]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-white shadow-[0_18px_38px_rgba(15,23,42,0.1)] ${membershipMeta.solidClassName}`}>
                                        <MembershipIcon className="h-5 w-5" />
                                    </div>
                                    <span className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
                                        Manage
                                    </span>
                                </div>
                                <div className="mt-5 text-2xl font-display font-semibold text-[var(--foreground)]">Billing & subscription</div>
                                <div className="mt-5 space-y-3 text-sm text-[var(--foreground-soft)]">
                                    <DetailRow label="Plan" value={<MembershipBadge tier={profile.subscriptionTier} size="xs" showMemberLabel />} />
                                    <DetailRow label="Status" value={formatSubscriptionStatus(profile.subscriptionStatus)} />
                                    <DetailRow label="Current total" value={formatMoney(getMembershipPrice(profile.subscriptionTier, profile.billingCycle), 'USD')} />
                                </div>
                            </button>
                        </section>
                    </>
                )}

                {view === 'personal' && (
                    <section className="surface-panel-strong rounded-[34px] p-6 lg:p-8">
                        <div className="mb-8">
                            <button
                                type="button"
                                onClick={() => setView('overview')}
                                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to profile
                            </button>
                            <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)]">Personal details</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)]">
                                Update the details your collaborators see across the workspace.
                            </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <label className="block">
                                <span className="text-sm font-semibold text-[var(--foreground)]">Full name</span>
                                <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                            </label>
                            <label className="block">
                                <span className="text-sm font-semibold text-[var(--foreground)]">Title</span>
                                <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                            </label>
                            <label className="block">
                                <span className="text-sm font-semibold text-[var(--foreground)]">Phone</span>
                                <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
                                    <Smartphone className="h-4 w-4 text-[var(--foreground-muted)]" />
                                    <input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} className="w-full bg-transparent text-[var(--foreground)] outline-none" />
                                </div>
                            </label>
                            <label className="block">
                                <span className="text-sm font-semibold text-[var(--foreground)]">Location</span>
                                <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
                                    <MapPin className="h-4 w-4 text-[var(--foreground-muted)]" />
                                    <input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} className="w-full bg-transparent text-[var(--foreground)] outline-none" />
                                </div>
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setView('overview')}>Cancel</Button>
                            <Button onClick={() => void handleSave()} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save changes'}
                            </Button>
                        </div>
                    </section>
                )}

                {view === 'workspace' && (
                    <section className="surface-panel-strong rounded-[34px] p-6 lg:p-8">
                        <div className="mb-8">
                            <button
                                type="button"
                                onClick={() => setView('overview')}
                                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to profile
                            </button>
                            <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)]">Workspace identity</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)]">
                                Keep your workspace name, company details, and account contact information up to date.
                            </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <label className="block">
                                <span className="text-sm font-semibold text-[var(--foreground)]">Workspace name</span>
                                <input value={draft.workspace} onChange={(event) => setDraft((current) => ({ ...current, workspace: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                            </label>
                            <label className="block">
                                <span className="text-sm font-semibold text-[var(--foreground)]">Company</span>
                                <input value={draft.company} onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                            </label>
                            <label className="block lg:col-span-2">
                                <span className="text-sm font-semibold text-[var(--foreground)]">Contact email</span>
                                <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
                                    <Mail className="h-4 w-4 text-[var(--foreground-muted)]" />
                                    <input value={draft.billingEmail} onChange={(event) => setDraft((current) => ({ ...current, billingEmail: event.target.value }))} className="w-full bg-transparent text-[var(--foreground)] outline-none" />
                                </div>
                            </label>
                        </div>

                        <div className="mt-8 grid gap-4 lg:grid-cols-3">
                            <DetailRow label="Created" value={formatDate(profile.createdAt)} />
                            <DetailRow label="Last sign-in" value={formatDate(profile.lastSignInAt)} />
                            <DetailRow label="Account role" value={profile.accountRole || 'Workspace member'} />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setView('overview')}>Cancel</Button>
                            <Button onClick={() => void handleSave()} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save workspace details'}
                            </Button>
                        </div>
                    </section>
                )}

                {view === 'billing' && (
                    <section className="surface-panel-strong rounded-[34px] p-6 lg:p-8">
                        <div className="mb-8">
                            <button
                                type="button"
                                onClick={() => setView('overview')}
                                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to profile
                            </button>
                            <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)]">Billing & subscription</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)]">
                                Review your plan, payment details, renewal cadence, and billing history.
                            </p>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-3">
                            <div className="surface-panel rounded-[24px] p-5">
                                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-white shadow-[0_16px_34px_rgba(15,23,42,0.1)] ${membershipMeta.solidClassName}`}>
                                    <MembershipIcon className="h-5 w-5" />
                                </div>
                                <div className="mt-4 text-sm font-semibold text-[var(--foreground)]">Plan</div>
                                <div className="mt-3">
                                    <MembershipBadge tier={profile.subscriptionTier} size="sm" showMemberLabel />
                                </div>
                                <div className="mt-2 text-sm text-[var(--foreground-soft)]">
                                    {formatSubscriptionStatus(profile.subscriptionStatus)} / {profile.billingCycle}
                                </div>
                                <div className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                                    {formatMoney(getMembershipPrice(profile.subscriptionTier, profile.billingCycle), 'USD')}
                                </div>
                            </div>
                            <div className="surface-panel rounded-[24px] p-5">
                                <ReceiptText className="h-5 w-5 text-amber-500" />
                                <div className="mt-4 text-sm font-semibold text-[var(--foreground)]">Renewal</div>
                                <div className="mt-3 text-lg font-semibold text-[var(--foreground)]">{formatDate(profile.renewalDate)}</div>
                                <div className="mt-2 text-sm text-[var(--foreground-soft)]">{currentPlan.includedSeats} included seats</div>
                            </div>
                            <div className="surface-panel rounded-[24px] p-5">
                                <CreditCard className="h-5 w-5 text-emerald-500" />
                                <div className="mt-4 text-sm font-semibold text-[var(--foreground)]">Payment method</div>
                                <div className="mt-3 text-lg font-semibold text-[var(--foreground)]">{profile.paymentMethodLabel}</div>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                            <div className="surface-panel rounded-[24px] p-5">
                                <div className="text-sm font-semibold text-[var(--foreground)]">Recent invoices</div>
                                <div className="mt-4 space-y-3">
                                    {profile.billingInvoices.length > 0 ? profile.billingInvoices.map((invoice) => (
                                        <div key={invoice.id} className="flex flex-col gap-3 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="font-medium text-[var(--foreground)]">{invoice.label}</div>
                                                <div className="mt-1 text-sm text-[var(--foreground-soft)]">{formatDate(invoice.issuedAt)}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                                                    {invoice.status}
                                                </span>
                                                <span className="text-sm font-semibold text-[var(--foreground)]">
                                                    {formatMoney(invoice.amount, invoice.currency)}
                                                </span>
                                                <Button size="sm" variant="secondary" disabled>
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4 text-sm text-[var(--foreground-soft)]">
                                            No invoices available yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="surface-panel rounded-[24px] p-5">
                                <div className="text-sm font-semibold text-[var(--foreground)]">Subscription actions</div>
                                <div className="mt-4 space-y-3">
                                    <Button className="w-full justify-center" onClick={() => setView('membership')}>
                                        Change Plan
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full justify-center"
                                        onClick={() => {
                                            setCheckoutReturnView('billing');
                                            setCheckoutTier(profile.subscriptionTier);
                                        }}
                                        disabled={profile.subscriptionTier === 'free'}
                                    >
                                        Update Payment Method
                                    </Button>
                                    <Button variant="outline" className="w-full justify-center" onClick={() => setView('membership')}>
                                        Compare Plans
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {view === 'membership' && (
                    <MembershipPage
                        currentTier={profile.subscriptionTier}
                        billingCycle={membershipCycle}
                        isUpdatingPlan={isUpdatingPlan}
                        onBack={() => setView('billing')}
                        onBillingCycleChange={setMembershipCycle}
                        onSelectPlan={handleSelectPlan}
                    />
                )}
            </main>

            <PlanCheckoutDialog
                open={checkoutTier !== null}
                currentTier={profile.subscriptionTier}
                targetTier={checkoutTier}
                initialBillingCycle={membershipCycle}
                initialBillingEmail={profile.billingEmail}
                initialCompany={profile.company}
                initialCardholderName={profile.name}
                currentPaymentMethodLabel={profile.paymentMethodLabel}
                isSubmitting={isUpdatingPlan}
                onClose={() => setCheckoutTier(null)}
                onSuccessComplete={() => {
                    setCheckoutTier(null);
                    setView(checkoutReturnView);
                }}
                onSubmit={handleCheckoutSubmit}
            />
        </div>
    );
}

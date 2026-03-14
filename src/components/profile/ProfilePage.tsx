'use client';

import React, { useMemo, useState } from 'react';
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    Check,
    ChevronRight,
    CreditCard,
    Crown,
    PencilLine,
    Receipt,
    ShieldCheck,
    Sparkles,
    User2,
    Zap
} from 'lucide-react';

import { BrandLockup } from '@/components/ui/BrandLockup';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BillingCycle, MembershipTier, UserProfileData } from '@/types';
import { cn } from '@/lib/utils';

interface ProfilePageProps {
    profile: UserProfileData;
    onUpdateProfile: (updates: Partial<UserProfileData>) => void;
    onBack: () => void;
}

type ProfileView = 'overview' | 'personal' | 'membership' | 'billing' | 'checkout';

const PLAN_OPTIONS: Array<{
    id: MembershipTier;
    name: string;
    priceMonthly: number;
    badge?: string;
    subtitle: string;
    cta: string;
    features: string[];
}> = [
    {
        id: 'free',
        name: 'Free',
        priceMonthly: 0,
        subtitle: 'A simple sandbox for solo exploration and light experimentation.',
        cta: 'Choose Free',
        features: ['1 private workspace', 'Explore / Imagine / Implement / Tell Story access', 'Basic AI prompt board', '1 active member']
    },
    {
        id: 'plus',
        name: 'Plus',
        priceMonthly: 12,
        subtitle: 'Best for independent practitioners who need richer facilitation support.',
        cta: 'Upgrade to Plus',
        features: ['Unlimited private boards', 'Full AI facilitator access', 'Exportable reference decks', 'Priority email support']
    },
    {
        id: 'ultra',
        name: 'Ultra',
        priceMonthly: 24,
        badge: 'Best for teams and consultants',
        subtitle: 'Built for multi-project collaboration, stronger AI workflows, and more seats.',
        cta: 'Switch to Ultra',
        features: ['5 included seats', 'Advanced AI facilitator flows', 'Shared workspace templates', 'Project-level permissions']
    },
    {
        id: 'business',
        name: 'Business',
        priceMonthly: 48,
        subtitle: 'For delivery teams that need governance, deeper access control, and reporting.',
        cta: 'Move to Business',
        features: ['10 included seats', 'Centralized permission controls', 'Billing admin tools', 'Workspace analytics']
    }
];

const PLAN_LABELS: Record<MembershipTier, string> = {
    free: 'Free',
    plus: 'Plus',
    ultra: 'Ultra',
    business: 'Business'
};

const PLAN_ACCENTS: Record<MembershipTier, string> = {
    free: 'from-slate-400 to-slate-200',
    plus: 'from-sky-500 to-blue-500',
    ultra: 'from-fuchsia-500 to-violet-500',
    business: 'from-emerald-500 to-teal-500'
};

function getPlanPrice(planId: MembershipTier, cycle: BillingCycle) {
    const plan = PLAN_OPTIONS.find(option => option.id === planId);
    if (!plan) return 0;
    return cycle === 'yearly' ? plan.priceMonthly * 10 : plan.priceMonthly;
}

function getRenewalDate(cycle: BillingCycle) {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + (cycle === 'yearly' ? 12 : 1));
    return nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ProfilePage({ profile, onUpdateProfile, onBack }: ProfilePageProps) {
    const [view, setView] = useState<ProfileView>('overview');
    const [personalDraft, setPersonalDraft] = useState({
        name: profile.name,
        email: profile.email,
        title: profile.title,
        phone: profile.phone,
        location: profile.location,
        workspace: profile.workspace,
        company: profile.company
    });
    const [billingDraft, setBillingDraft] = useState({
        billingEmail: profile.billingEmail,
        seats: profile.seats,
        billingCycle: profile.billingCycle,
        paymentMethod: profile.paymentMethod,
        company: profile.company
    });
    const [checkoutPlan, setCheckoutPlan] = useState<MembershipTier>(profile.membership);
    const [checkoutDetails, setCheckoutDetails] = useState({
        seats: profile.seats,
        billingCycle: profile.billingCycle,
        cardNumber: '4242 4242 4242 4242',
        expiry: '04/29',
        cvc: '424',
        country: 'United Kingdom',
        postalCode: 'SW1A 1AA',
        companyInfo: profile.company
    });

    const selectedPlan = useMemo(
        () => PLAN_OPTIONS.find(option => option.id === checkoutPlan) || PLAN_OPTIONS[0],
        [checkoutPlan]
    );
    const subtotal = getPlanPrice(checkoutPlan, checkoutDetails.billingCycle) * Math.max(checkoutDetails.seats, 1);
    const tax = subtotal * 0.2;
    const total = subtotal + tax;

    const openCheckout = (planId: MembershipTier) => {
        setCheckoutPlan(planId);
        setCheckoutDetails(current => ({
            ...current,
            billingCycle: planId === 'free' ? 'monthly' : current.billingCycle
        }));
        setView('checkout');
    };

    const handleSavePersonal = () => {
        onUpdateProfile(personalDraft);
        setView('overview');
    };

    const handleSaveBilling = () => {
        onUpdateProfile({
            billingEmail: billingDraft.billingEmail,
            seats: billingDraft.seats,
            billingCycle: billingDraft.billingCycle,
            paymentMethod: billingDraft.paymentMethod,
            company: billingDraft.company,
            usage: `${billingDraft.seats} of ${billingDraft.seats} seats active`
        });
        setView('overview');
    };

    const handleConfirmCheckout = () => {
        const membershipLabel = PLAN_LABELS[checkoutPlan];
        onUpdateProfile({
            membership: checkoutPlan,
            membershipLabel,
            plan: `${membershipLabel} Membership`,
            billingCycle: checkoutDetails.billingCycle,
            seats: checkoutDetails.seats,
            renewalDate: getRenewalDate(checkoutDetails.billingCycle),
            paymentMethod: checkoutPlan === 'free' ? 'No payment required' : 'Visa ending in 4242',
            billingEmail: billingDraft.billingEmail,
            company: checkoutDetails.companyInfo || billingDraft.company,
            usage: `${checkoutDetails.seats} of ${checkoutDetails.seats} seats active`
        });
        setBillingDraft(current => ({
            ...current,
            seats: checkoutDetails.seats,
            billingCycle: checkoutDetails.billingCycle,
            paymentMethod: checkoutPlan === 'free' ? 'No payment required' : 'Visa ending in 4242',
            company: checkoutDetails.companyInfo || current.company
        }));
        setView('overview');
    };

    const renderOverviewCard = (
        icon: React.ReactNode,
        title: string,
        description: string,
        details: string[],
        onOpen: () => void
    ) => (
        <button
            type="button"
            onClick={onOpen}
            className="group surface-panel relative rounded-[28px] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.1)]"
        >
            <div className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <PencilLine className="h-3.5 w-3.5" />
                Edit
            </div>
            {icon}
            <div className="mt-4 text-lg font-semibold text-[var(--foreground)]">{title}</div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">{description}</p>
            <div className="mt-5 space-y-2">
                {details.map(detail => (
                    <div key={detail} className="rounded-[16px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
                        {detail}
                    </div>
                ))}
            </div>
        </button>
    );

    const renderSubpageIntro = (title: string, description: string) => (
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <button
                    type="button"
                    onClick={() => setView('overview')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to profile
                </button>
                <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)]">{title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)]">{description}</p>
            </div>
        </div>
    );

    const renderMembership = () => (
        <section className="surface-panel-strong rounded-[34px] p-6 lg:p-8">
            {renderSubpageIntro(
                'Membership',
                'Choose the plan shape that matches your solo work, consulting practice, or delivery team.'
            )}
            <div className="grid gap-5 xl:grid-cols-4">
                {PLAN_OPTIONS.map(plan => {
                    const isCurrent = profile.membership === plan.id;
                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                'relative overflow-hidden rounded-[28px] border bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]',
                                isCurrent ? 'border-sky-400 shadow-[0_18px_50px_rgba(37,99,235,0.12)]' : 'border-slate-200'
                            )}
                        >
                            {plan.badge && (
                                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(135deg,#2563eb,#4f46e5)] px-4 py-2 text-xs font-semibold text-white shadow-lg">
                                    {plan.badge}
                                </div>
                            )}
                            <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white', PLAN_ACCENTS[plan.id])}>
                                {plan.id === 'free' ? <ShieldCheck className="h-5 w-5" /> : plan.id === 'plus' ? <Sparkles className="h-5 w-5" /> : plan.id === 'ultra' ? <Zap className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                            </div>
                            <div className="mt-5 text-3xl font-display font-semibold text-slate-950">{plan.name}</div>
                            <p className="mt-3 text-sm leading-relaxed text-slate-500">{plan.subtitle}</p>
                            <div className="mt-6 text-slate-950">
                                <span className="text-sm align-top">US$</span>
                                <span className="text-4xl font-semibold">{plan.priceMonthly}</span>
                                <span className="ml-2 text-base text-slate-500">/month</span>
                            </div>
                            <Button
                                className="mt-6 w-full"
                                variant={isCurrent ? 'secondary' : 'primary'}
                                onClick={() => (isCurrent ? setView('billing') : openCheckout(plan.id))}
                            >
                                {isCurrent ? 'Manage Current Plan' : plan.cta}
                            </Button>
                            <div className="mt-6 text-sm font-semibold text-slate-950">Included:</div>
                            <div className="mt-4 space-y-3">
                                {plan.features.map(feature => (
                                    <div key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                                        <Check className="mt-0.5 h-4 w-4 text-sky-500" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );

    const renderCheckout = () => (
        <section className="surface-panel-strong rounded-[34px] p-6 lg:p-8">
            {renderSubpageIntro(
                `${selectedPlan.name} checkout`,
                'Review the plan shape, adjust billing details, and confirm the mocked payment flow.'
            )}
            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm">
                {['Your new plan', 'Payment details', 'Review and confirm'].map((step, index) => (
                    <div key={step} className="inline-flex items-center gap-3 text-[var(--foreground-soft)]">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold', index === 0 ? 'bg-blue-600 text-white' : 'bg-[var(--panel)] text-[var(--foreground-muted)]')}>
                            {index + 1}
                        </div>
                        <span>{step}</span>
                    </div>
                ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[28px] border border-[var(--panel-border)] bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                    <div className="text-2xl font-display font-semibold text-slate-950">{selectedPlan.name} plan: payment details</div>
                    <div className="mt-6 grid gap-6">
                        <label className="block">
                            <span className="text-sm font-semibold text-slate-900">Licenses</span>
                            <select
                                value={checkoutDetails.seats}
                                onChange={event => setCheckoutDetails(current => ({ ...current, seats: Number(event.target.value) }))}
                                className="mt-2 w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                            >
                                {[1, 2, 3, 5, 10].map(seatCount => (
                                    <option key={seatCount} value={seatCount}>{seatCount} member{seatCount > 1 ? 's' : ''}</option>
                                ))}
                            </select>
                        </label>

                        <div>
                            <div className="text-sm font-semibold text-slate-900">Billing period</div>
                            <div className="mt-3 space-y-3">
                                {(['yearly', 'monthly'] as BillingCycle[]).map(cycle => (
                                    <label key={cycle} className="flex items-center justify-between rounded-[16px] border border-slate-200 px-4 py-3 text-sm text-slate-700">
                                        <span className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                checked={checkoutDetails.billingCycle === cycle}
                                                onChange={() => setCheckoutDetails(current => ({ ...current, billingCycle: cycle }))}
                                            />
                                            {cycle === 'yearly' ? 'Yearly billing' : 'Monthly billing'}
                                        </span>
                                        <span>${getPlanPrice(checkoutPlan, cycle)} / member</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <label className="block lg:col-span-2">
                            <span className="text-sm font-semibold text-slate-900">Company information</span>
                            <input
                                value={checkoutDetails.companyInfo}
                                onChange={event => setCheckoutDetails(current => ({ ...current, companyInfo: event.target.value }))}
                                className="mt-2 w-full rounded-[16px] border border-slate-200 px-4 py-3 text-slate-900 outline-none"
                            />
                        </label>

                        {checkoutPlan !== 'free' && (
                            <>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">Choose payment method</div>
                                    <div className="mt-3 inline-flex items-center gap-3 rounded-[20px] border-2 border-blue-500 px-5 py-4 text-slate-900">
                                        <CreditCard className="h-5 w-5 text-blue-600" />
                                        <span className="font-semibold">Card</span>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="block md:col-span-2">
                                        <span className="text-sm font-semibold text-slate-900">Card number</span>
                                        <input value={checkoutDetails.cardNumber} onChange={event => setCheckoutDetails(current => ({ ...current, cardNumber: event.target.value }))} className="mt-2 w-full rounded-[16px] border border-slate-200 px-4 py-3 text-slate-900 outline-none" />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-900">Expiration date</span>
                                        <input value={checkoutDetails.expiry} onChange={event => setCheckoutDetails(current => ({ ...current, expiry: event.target.value }))} className="mt-2 w-full rounded-[16px] border border-slate-200 px-4 py-3 text-slate-900 outline-none" />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-900">Security code</span>
                                        <input value={checkoutDetails.cvc} onChange={event => setCheckoutDetails(current => ({ ...current, cvc: event.target.value }))} className="mt-2 w-full rounded-[16px] border border-slate-200 px-4 py-3 text-slate-900 outline-none" />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-900">Country</span>
                                        <input value={checkoutDetails.country} onChange={event => setCheckoutDetails(current => ({ ...current, country: event.target.value }))} className="mt-2 w-full rounded-[16px] border border-slate-200 px-4 py-3 text-slate-900 outline-none" />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-900">Postal code</span>
                                        <input value={checkoutDetails.postalCode} onChange={event => setCheckoutDetails(current => ({ ...current, postalCode: event.target.value }))} className="mt-2 w-full rounded-[16px] border border-slate-200 px-4 py-3 text-slate-900 outline-none" />
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="rounded-[28px] border border-[var(--panel-border)] bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                    <div className="text-2xl font-display font-semibold text-slate-950">Order summary</div>
                    <div className="mt-6 space-y-4 border-b border-slate-200 pb-5 text-sm text-slate-700">
                        <div className="flex items-center justify-between">
                            <span>{selectedPlan.name} x {checkoutDetails.seats} member{checkoutDetails.seats > 1 ? 's' : ''}</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Tax (20%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-xl font-semibold text-slate-950">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <Button className="mt-6 w-full" onClick={handleConfirmCheckout}>
                        {checkoutPlan === 'free' ? 'Confirm downgrade' : 'Confirm plan change'}
                    </Button>
                    <div className="mt-6 rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                        This is a simulated checkout. The payment form behaves like a real plan-change flow, but no external billing provider is called.
                    </div>
                </div>
            </div>
        </section>
    );

    const renderContent = () => {
        if (view === 'personal') {
            return (
                <section className="surface-panel-strong rounded-[34px] p-6 lg:p-8">
                    {renderSubpageIntro('Personal information', 'Update the identity and contact information shown across the workspace.')}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block">
                            <span className="text-sm font-semibold text-[var(--foreground)]">Full name</span>
                            <input value={personalDraft.name} onChange={event => setPersonalDraft(current => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-semibold text-[var(--foreground)]">Title</span>
                            <input value={personalDraft.title} onChange={event => setPersonalDraft(current => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-semibold text-[var(--foreground)]">Email</span>
                            <input value={personalDraft.email} onChange={event => setPersonalDraft(current => ({ ...current, email: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-semibold text-[var(--foreground)]">Phone</span>
                            <input value={personalDraft.phone} onChange={event => setPersonalDraft(current => ({ ...current, phone: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-semibold text-[var(--foreground)]">Location</span>
                            <input value={personalDraft.location} onChange={event => setPersonalDraft(current => ({ ...current, location: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-semibold text-[var(--foreground)]">Workspace</span>
                            <input value={personalDraft.workspace} onChange={event => setPersonalDraft(current => ({ ...current, workspace: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                        </label>
                        <label className="block lg:col-span-2">
                            <span className="text-sm font-semibold text-[var(--foreground)]">Company</span>
                            <input value={personalDraft.company} onChange={event => setPersonalDraft(current => ({ ...current, company: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                        </label>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setView('overview')}>Cancel</Button>
                        <Button onClick={handleSavePersonal}>Save changes</Button>
                    </div>
                </section>
            );
        }

        if (view === 'membership') return renderMembership();

        if (view === 'billing') {
            return (
                <section className="surface-panel-strong rounded-[34px] p-6 lg:p-8">
                    {renderSubpageIntro('Plan & billing', 'Adjust billing contact details, seat count, billing cadence, and current payment method.')}
                    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                        <div className="space-y-5">
                            <div className="surface-panel rounded-[26px] p-5">
                                <div className="flex items-center gap-2 text-[var(--foreground)]">
                                    <Receipt className="h-4 w-4 text-sky-500" />
                                    <span className="text-sm font-semibold">Billing contact</span>
                                </div>
                                <div className="mt-4 grid gap-4">
                                    <label className="block">
                                        <span className="text-sm font-semibold text-[var(--foreground)]">Billing email</span>
                                        <input value={billingDraft.billingEmail} onChange={event => setBillingDraft(current => ({ ...current, billingEmail: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-[var(--foreground)]">Company</span>
                                        <input value={billingDraft.company} onChange={event => setBillingDraft(current => ({ ...current, company: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                                    </label>
                                </div>
                            </div>

                            <div className="surface-panel rounded-[26px] p-5">
                                <div className="flex items-center gap-2 text-[var(--foreground)]">
                                    <CreditCard className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm font-semibold">Billing controls</span>
                                </div>
                                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-semibold text-[var(--foreground)]">Seats</span>
                                        <select value={billingDraft.seats} onChange={event => setBillingDraft(current => ({ ...current, seats: Number(event.target.value) }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none">
                                            {[1, 2, 3, 5, 10].map(seatCount => <option key={seatCount} value={seatCount}>{seatCount} member{seatCount > 1 ? 's' : ''}</option>)}
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-semibold text-[var(--foreground)]">Billing cycle</span>
                                        <select value={billingDraft.billingCycle} onChange={event => setBillingDraft(current => ({ ...current, billingCycle: event.target.value as BillingCycle }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none">
                                            <option value="yearly">Yearly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </label>
                                    <label className="block lg:col-span-2">
                                        <span className="text-sm font-semibold text-[var(--foreground)]">Payment method</span>
                                        <input value={billingDraft.paymentMethod} onChange={event => setBillingDraft(current => ({ ...current, paymentMethod: event.target.value }))} className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="surface-panel rounded-[26px] p-5">
                            <div className="flex items-center gap-2 text-[var(--foreground)]">
                                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-semibold">Current subscription</span>
                            </div>
                            <div className="mt-5 rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] p-5">
                                <div className="text-xs uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Membership</div>
                                <div className="mt-2 text-2xl font-display font-semibold text-[var(--foreground)]">{profile.membershipLabel}</div>
                                <div className="mt-2 text-sm text-[var(--foreground-soft)]">{profile.plan}</div>
                                <div className="mt-5 space-y-3 text-sm text-[var(--foreground-soft)]">
                                    <div className="flex items-center justify-between"><span>Renewal</span><span>{profile.renewalDate}</span></div>
                                    <div className="flex items-center justify-between"><span>Usage</span><span>{profile.usage}</span></div>
                                </div>
                            </div>
                            <Button className="mt-5 w-full" variant="secondary" onClick={() => setView('membership')}>Change membership</Button>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setView('overview')}>Cancel</Button>
                        <Button onClick={handleSaveBilling}>Save billing details</Button>
                    </div>
                </section>
            );
        }

        if (view === 'checkout') return renderCheckout();

        return (
            <>
                <section className="surface-panel-strong rounded-[36px] p-6 lg:p-10">
                    <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
                        <div>
                            <div className="eyebrow">User Profile</div>
                            <h1 className="mt-4 text-4xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">{profile.name}</h1>
                            <p className="mt-3 text-base leading-relaxed text-[var(--foreground-soft)]">{profile.title}</p>
                            <div className="mt-6 rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel)] p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-lg font-semibold text-white">US</div>
                                    <div>
                                        <div className="text-base font-semibold text-[var(--foreground)]">{profile.email}</div>
                                        <div className="text-sm text-[var(--foreground-muted)]">{profile.workspace}</div>
                                    </div>
                                </div>
                                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                    <Crown className="h-3.5 w-3.5" />
                                    {profile.membershipLabel} membership
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-3">
                            {renderOverviewCard(<User2 className="h-5 w-5 text-sky-500" />, 'Personal Information', 'Update the identity and contact information shown across the workspace.', [`${profile.name} · ${profile.title}`, profile.email, `${profile.location} · ${profile.phone}`], () => setView('personal'))}
                            {renderOverviewCard(<Sparkles className="h-5 w-5 text-fuchsia-500" />, 'Membership', 'Compare Free, Plus, Ultra, and Business plans, then move into checkout.', [profile.plan, `${profile.membershipLabel} membership`, `Renews ${profile.renewalDate}`], () => setView('membership'))}
                            {renderOverviewCard(<CreditCard className="h-5 w-5 text-amber-500" />, 'Plan & Billing', 'Manage billing email, payment method, seat count, and billing cadence.', [profile.billingEmail, profile.paymentMethod, `${profile.seats} seat · ${profile.billingCycle}`], () => setView('billing'))}
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="surface-panel rounded-[30px] p-6">
                        <div className="flex items-center gap-2 text-[var(--foreground)]">
                            <Receipt className="h-4 w-4 text-rose-500" />
                            <span className="text-sm font-semibold">Recent account activity</span>
                        </div>
                        <div className="mt-5 grid gap-3 text-sm text-[var(--foreground-soft)]">
                            <div className="flex items-center justify-between rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3"><span>Membership renewed successfully</span><span>{profile.renewalDate}</span></div>
                            <div className="flex items-center justify-between rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3"><span>Payment method last reviewed</span><span>11 Mar 2026</span></div>
                            <div className="flex items-center justify-between rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3"><span>Workspace profile updated</span><span>05 Mar 2026</span></div>
                        </div>
                    </div>

                    <div className="surface-panel rounded-[30px] p-6">
                        <div className="flex items-center gap-2 text-[var(--foreground)]">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-semibold">Workspace access snapshot</span>
                        </div>
                        <div className="mt-5 space-y-3 text-sm text-[var(--foreground-soft)]">
                            <div className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">Role: Workspace owner with project edit and invite permissions.</div>
                            <div className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">Current plan: {profile.plan} with {profile.seats} active seat{profile.seats > 1 ? 's' : ''}.</div>
                            <div className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">Billing contact: {profile.billingEmail}</div>
                        </div>
                    </div>
                </section>
            </>
        );
    };

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
                {renderContent()}
                {view === 'overview' && (
                    <button type="button" onClick={() => setView('personal')} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700">
                        Open the editable account center
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </main>
        </div>
    );
}

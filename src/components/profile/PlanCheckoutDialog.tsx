'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, CreditCard, LockKeyhole, Mail, MapPin, ReceiptText, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { getMembershipPlan, getMembershipPrice, getMembershipYearlySavings } from '@/lib/membership';
import { BillingCycle, MembershipCheckoutDraft, MembershipTier } from '@/types';

interface PlanCheckoutDialogProps {
    open: boolean;
    currentTier: MembershipTier;
    targetTier: MembershipTier | null;
    initialBillingCycle: BillingCycle;
    initialBillingEmail: string;
    initialCompany: string;
    initialCardholderName: string;
    currentPaymentMethodLabel: string;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (draft: MembershipCheckoutDraft) => void | Promise<void>;
}

type CheckoutStep = 'details' | 'review' | 'success';

const DEFAULT_COUNTRY = 'United Kingdom';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatCardNumber(value: string) {
    return value
        .replace(/\D/g, '')
        .slice(0, 16)
        .replace(/(.{4})/g, '$1 ')
        .trim();
}

function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);

    if (digits.length < 3) {
        return digits;
    }

    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function maskCardNumber(value: string) {
    const digits = value.replace(/\D/g, '');
    const last4 = digits.slice(-4);

    return last4 ? `•••• •••• •••• ${last4}` : 'No card selected';
}

function buildInitialDraft(
    tier: MembershipTier,
    billingCycle: BillingCycle,
    billingEmail: string,
    company: string,
    cardholderName: string
): MembershipCheckoutDraft {
    return {
        tier,
        billingCycle,
        billingEmail,
        company,
        country: DEFAULT_COUNTRY,
        postalCode: '',
        taxId: '',
        cardholderName,
        cardNumber: '',
        expiry: '',
        cvc: ''
    };
}

export function PlanCheckoutDialog({
    open,
    currentTier,
    targetTier,
    initialBillingCycle,
    initialBillingEmail,
    initialCompany,
    initialCardholderName,
    currentPaymentMethodLabel,
    isSubmitting = false,
    onClose,
    onSubmit
}: PlanCheckoutDialogProps) {
    const resolvedTier = targetTier || currentTier;
    const [step, setStep] = useState<CheckoutStep>('details');
    const [checkoutMode] = useState<'plan-change' | 'payment-method'>(() => (
        resolvedTier === currentTier ? 'payment-method' : 'plan-change'
    ));
    const [draft, setDraft] = useState<MembershipCheckoutDraft>(() => buildInitialDraft(
        resolvedTier,
        initialBillingCycle,
        initialBillingEmail,
        initialCompany,
        initialCardholderName
    ));
    const [error, setError] = useState<string | null>(null);

    const plan = useMemo(() => (
        getMembershipPlan(draft.tier)
    ), [draft]);
    const planPrice = getMembershipPrice(draft.tier, draft.billingCycle);
    const yearlySavings = getMembershipYearlySavings(draft.tier);
    const needsPayment = draft.tier !== 'free';
    const isUpdatingPaymentMethodOnly = checkoutMode === 'payment-method';

    if (!open || !targetTier) {
        return null;
    }

    const heading = isUpdatingPaymentMethodOnly
        ? 'Update payment method'
        : draft.tier === 'free'
            ? 'Confirm plan change'
            : `Checkout for ${plan.title}`;

    const subtitle = isUpdatingPaymentMethodOnly
        ? 'Replace the default card used for future renewals and invoice recovery.'
        : draft.tier === 'free'
            ? 'Review the downgrade details before switching your workspace billing.'
            : 'Enter your billing details, review the order summary, and confirm the new plan.';

    const validateDetails = () => {
        if (!draft.billingEmail.trim() || !draft.billingEmail.includes('@')) {
            return 'Enter a valid billing email.';
        }

        if (!needsPayment) {
            return null;
        }

        if (!draft.country.trim()) {
            return 'Select a billing country or region.';
        }

        if (!draft.postalCode.trim()) {
            return 'Enter a billing postcode.';
        }

        if (!draft.cardholderName.trim()) {
            return 'Enter the cardholder name.';
        }

        if (draft.cardNumber.replace(/\D/g, '').length < 12) {
            return 'Enter a valid card number.';
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(draft.expiry)) {
            return 'Enter the expiry in MM/YY format.';
        }

        if (!/^\d{3,4}$/.test(draft.cvc)) {
            return 'Enter a valid security code.';
        }

        return null;
    };

    const handleContinue = () => {
        const nextError = validateDetails();

        if (nextError) {
            setError(nextError);
            return;
        }

        setError(null);
        setStep('review');
    };

    const handleConfirm = async () => {
        const nextError = validateDetails();

        if (nextError) {
            setError(nextError);
            setStep('details');
            return;
        }

        setError(null);
        await onSubmit(draft);
        setStep('success');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={isSubmitting ? undefined : onClose} />

            <div className="relative z-10 grid w-full max-w-6xl gap-6 rounded-[34px] border border-white/70 bg-white p-4 shadow-[0_32px_90px_rgba(15,23,42,0.2)] lg:grid-cols-[1.05fr_0.95fr] lg:p-6">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-6 lg:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={step === 'details' ? onClose : () => setStep('details')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {step === 'details' ? 'Close checkout' : 'Back to details'}
                        </button>
                        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {step === 'details' ? 'Step 1 of 3' : step === 'review' ? 'Step 2 of 3' : 'Step 3 of 3'}
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-3xl font-display font-semibold text-slate-950">{heading}</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">{subtitle}</p>
                    </div>

                    {error && (
                        <div className="mt-5 rounded-[18px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            {error}
                        </div>
                    )}

                    {step === 'details' && (
                        <div className="mt-6 space-y-6">
                            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-950">Billing cycle</div>
                                        <div className="mt-1 text-sm text-slate-500">Choose the cadence you want the new plan to renew on.</div>
                                    </div>
                                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setDraft((current) => current ? { ...current, billingCycle: 'monthly' } : current)}
                                            className={[
                                                'rounded-full px-4 py-2 text-sm font-semibold transition-all',
                                                draft.billingCycle === 'monthly'
                                                    ? 'bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_12px_26px_rgba(37,99,235,0.2)]'
                                                    : 'text-slate-500 hover:text-slate-900'
                                            ].join(' ')}
                                        >
                                            Monthly
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDraft((current) => current ? { ...current, billingCycle: 'yearly' } : current)}
                                            className={[
                                                'rounded-full px-4 py-2 text-sm font-semibold transition-all',
                                                draft.billingCycle === 'yearly'
                                                    ? 'bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_12px_26px_rgba(37,99,235,0.2)]'
                                                    : 'text-slate-500 hover:text-slate-900'
                                            ].join(' ')}
                                        >
                                            Yearly
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-sky-500" />
                                    <div className="text-sm font-semibold text-slate-950">Billing information</div>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <label className="block md:col-span-2">
                                        <span className="text-sm font-medium text-slate-700">Billing email</span>
                                        <input
                                            type="email"
                                            value={draft.billingEmail}
                                            onChange={(event) => setDraft((current) => current ? { ...current, billingEmail: event.target.value } : current)}
                                            className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Company or team</span>
                                        <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                            <input
                                                value={draft.company}
                                                onChange={(event) => setDraft((current) => current ? { ...current, company: event.target.value } : current)}
                                                className="w-full bg-transparent text-slate-950 outline-none"
                                                placeholder="Studio name or company"
                                            />
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">VAT / tax ID</span>
                                        <input
                                            value={draft.taxId}
                                            onChange={(event) => setDraft((current) => current ? { ...current, taxId: event.target.value } : current)}
                                            className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                            placeholder="Optional"
                                        />
                                    </label>
                                </div>
                            </div>

                            {needsPayment && (
                                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-emerald-500" />
                                        <div className="text-sm font-semibold text-slate-950">Payment method</div>
                                    </div>
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <label className="block md:col-span-2">
                                            <span className="text-sm font-medium text-slate-700">Cardholder name</span>
                                            <input
                                                value={draft.cardholderName}
                                                onChange={(event) => setDraft((current) => current ? { ...current, cardholderName: event.target.value } : current)}
                                                className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                                placeholder="Name on card"
                                            />
                                        </label>
                                        <label className="block md:col-span-2">
                                            <span className="text-sm font-medium text-slate-700">Card number</span>
                                            <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                                                <CreditCard className="h-4 w-4 text-slate-400" />
                                                <input
                                                    value={draft.cardNumber}
                                                    onChange={(event) => setDraft((current) => current ? { ...current, cardNumber: formatCardNumber(event.target.value) } : current)}
                                                    className="w-full bg-transparent text-slate-950 outline-none"
                                                    placeholder="1234 5678 9012 3456"
                                                    inputMode="numeric"
                                                />
                                            </div>
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">Expiry</span>
                                            <input
                                                value={draft.expiry}
                                                onChange={(event) => setDraft((current) => current ? { ...current, expiry: formatExpiry(event.target.value) } : current)}
                                                className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                                placeholder="MM/YY"
                                                inputMode="numeric"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">Security code</span>
                                            <input
                                                value={draft.cvc}
                                                onChange={(event) => setDraft((current) => current ? { ...current, cvc: event.target.value.replace(/\D/g, '').slice(0, 4) } : current)}
                                                className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                                placeholder="CVC"
                                                inputMode="numeric"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {needsPayment && (
                                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-5 w-5 text-violet-500" />
                                        <div className="text-sm font-semibold text-slate-950">Billing address</div>
                                    </div>
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">Country or region</span>
                                            <input
                                                value={draft.country}
                                                onChange={(event) => setDraft((current) => current ? { ...current, country: event.target.value } : current)}
                                                className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">Postcode</span>
                                            <input
                                                value={draft.postalCode}
                                                onChange={(event) => setDraft((current) => current ? { ...current, postalCode: event.target.value } : current)}
                                                className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="button" onClick={handleContinue}>
                                    Continue to review
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="mt-6 space-y-5">
                            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                                <div className="text-sm font-semibold text-slate-950">Review your billing details</div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Billing email</div>
                                        <div className="mt-1 text-sm text-slate-700">{draft.billingEmail}</div>
                                    </div>
                                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Company</div>
                                        <div className="mt-1 text-sm text-slate-700">{draft.company || 'Individual account'}</div>
                                    </div>
                                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Billing address</div>
                                        <div className="mt-1 text-sm text-slate-700">{draft.country}, {draft.postalCode}</div>
                                    </div>
                                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Payment method</div>
                                        <div className="mt-1 text-sm text-slate-700">
                                            {needsPayment ? `${draft.cardholderName} · ${maskCardNumber(draft.cardNumber)}` : 'No payment method required'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-relaxed text-emerald-800">
                                {isUpdatingPaymentMethodOnly
                                    ? 'The updated card becomes the default payment method for future renewals and invoice recovery.'
                                    : draft.tier === 'free'
                                        ? 'Your workspace changes to the Free plan immediately after confirmation. Paid invoices stay in your billing history.'
                                        : 'Your new plan starts immediately after confirmation and renews automatically until changed.'}
                            </div>

                            <div className="flex flex-wrap justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={() => setStep('details')}>
                                    Edit details
                                </Button>
                                <Button type="button" onClick={() => void handleConfirm()} disabled={isSubmitting}>
                                    {isSubmitting
                                        ? 'Processing...'
                                        : isUpdatingPaymentMethodOnly
                                            ? 'Save payment method'
                                            : draft.tier === 'free'
                                                ? 'Confirm change'
                                                : `Activate ${plan.title}`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="mt-6 rounded-[28px] border border-emerald-100 bg-emerald-50 p-6">
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h3 className="mt-5 text-2xl font-display font-semibold text-slate-950">
                                {isUpdatingPaymentMethodOnly ? 'Payment method updated' : `${plan.title} is ready`}
                            </h3>
                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
                                {isUpdatingPaymentMethodOnly
                                    ? `The default payment method is now ${maskCardNumber(draft.cardNumber)}.`
                                    : draft.tier === 'free'
                                        ? 'Your workspace has moved to the Free plan.'
                                        : `Your workspace is now set to the ${plan.title} plan on ${draft.billingCycle} billing.`}
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button type="button" onClick={onClose}>
                                    Return to billing
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a,#111827)] p-6 text-white lg:p-7">
                    <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">
                        <ReceiptText className="h-4 w-4" />
                        Order summary
                    </div>

                    <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-2xl font-display font-semibold">{plan.title}</div>
                                <div className="mt-2 text-sm leading-relaxed text-slate-300">{plan.summary}</div>
                            </div>
                            <div className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">
                                {draft.billingCycle}
                            </div>
                        </div>

                        <div className="mt-6 space-y-3 text-sm text-slate-200">
                            <div className="flex items-center justify-between">
                                <span>Included seats</span>
                                <span>{plan.includedSeats}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Plan subtotal</span>
                                <span>{formatCurrency(planPrice)}</span>
                            </div>
                            {draft.billingCycle === 'yearly' && planPrice > 0 && (
                                <div className="flex items-center justify-between text-emerald-200">
                                    <span>Annual savings</span>
                                    <span>-{formatCurrency(yearlySavings)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span>Taxes</span>
                                <span>{planPrice > 0 ? 'Calculated at billing' : 'Included'}</span>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div className="flex items-center justify-between text-base font-semibold text-white">
                                <span>Total due today</span>
                                <span>{formatCurrency(planPrice)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-3 text-sm font-semibold text-white">
                            <LockKeyhole className="h-4 w-4 text-sky-300" />
                            Secure checkout
                        </div>
                        <div className="mt-3 text-sm leading-relaxed text-slate-300">
                            Review billing details, confirm the selected payment method, and keep the account ready for the next renewal.
                        </div>
                    </div>

                    {needsPayment && (
                        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
                            <div className="text-sm font-semibold text-white">Current default payment method</div>
                            <div className="mt-3 text-sm text-slate-300">
                                {currentPaymentMethodLabel}
                            </div>
                        </div>
                    )}

                    <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
                        <div className="text-sm font-semibold text-white">Included in this plan</div>
                        <div className="mt-4 space-y-3 text-sm text-slate-300">
                            {plan.features.map((feature) => (
                                <div key={feature} className="flex items-start gap-3">
                                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-400" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

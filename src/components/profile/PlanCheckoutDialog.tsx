'use client';

import React, { useMemo, useState } from 'react';
import {
    ArrowLeft,
    Building2,
    CreditCard,
    LockKeyhole,
    Mail,
    MapPin,
    ReceiptText,
    ShieldCheck
} from 'lucide-react';

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
    onSuccessComplete?: () => void;
    onSubmit: (draft: MembershipCheckoutDraft) => void | Promise<void>;
}

type CheckoutStep = 'details' | 'review' | 'success';
type CheckoutMode = 'plan-change' | 'downgrade' | 'payment-method';

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

    return last4 ? `**** **** **** ${last4}` : 'No card selected';
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

function Section({
    title,
    icon,
    children
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
                {icon}
                <div className="text-sm font-semibold text-slate-950">{title}</div>
            </div>
            <div className="mt-4">{children}</div>
        </div>
    );
}

function TextInput({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    inputMode,
    leadingIcon
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    leadingIcon?: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            {leadingIcon ? (
                <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                    {leadingIcon}
                    <input
                        type={type}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        className="w-full bg-transparent text-slate-950 outline-none"
                        placeholder={placeholder}
                        inputMode={inputMode}
                    />
                </div>
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    placeholder={placeholder}
                    inputMode={inputMode}
                />
            )}
        </label>
    );
}

function PlanCheckoutDialogInner({
    currentTier,
    targetTier,
    initialBillingCycle,
    initialBillingEmail,
    initialCompany,
    initialCardholderName,
    currentPaymentMethodLabel,
    isSubmitting = false,
    onClose,
    onSuccessComplete,
    onSubmit
}: Omit<PlanCheckoutDialogProps, 'open' | 'targetTier'> & { targetTier: MembershipTier }) {
    const resolvedTier = targetTier;
    const [checkoutMode] = useState<CheckoutMode>(() => {
        if (resolvedTier === currentTier) {
            return 'payment-method';
        }

        return resolvedTier === 'free' ? 'downgrade' : 'plan-change';
    });
    const [step, setStep] = useState<CheckoutStep>('details');
    const [draft, setDraft] = useState<MembershipCheckoutDraft>(() => buildInitialDraft(
        resolvedTier,
        initialBillingCycle,
        initialBillingEmail,
        initialCompany,
        initialCardholderName
    ));
    const [error, setError] = useState<string | null>(null);

    const plan = useMemo(() => getMembershipPlan(draft.tier), [draft.tier]);
    const planPrice = getMembershipPrice(draft.tier, draft.billingCycle);
    const yearlySavings = getMembershipYearlySavings(draft.tier);
    const needsPayment = draft.tier !== 'free';
    const isUpdatingPaymentMethodOnly = checkoutMode === 'payment-method';

    const validateDetails = () => {
        if (!draft.billingEmail.trim() || !draft.billingEmail.includes('@')) {
            return 'Enter a valid billing email.';
        }

        if (!needsPayment) {
            return null;
        }

        if (!draft.country.trim() || !draft.postalCode.trim()) {
            return 'Enter a billing country and postcode.';
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

    const heading = isUpdatingPaymentMethodOnly
        ? 'Update payment method'
        : checkoutMode === 'downgrade'
            ? 'Confirm plan change'
            : `Checkout for ${plan.title}`;

    const subtitle = isUpdatingPaymentMethodOnly
        ? 'Replace the default card used for future renewals and invoice recovery.'
        : checkoutMode === 'downgrade'
            ? 'Review the downgrade details before switching your workspace billing.'
            : 'Enter your billing details, review the order summary, and confirm the new plan.';
    const completionAction = onSuccessComplete || onClose;
    const successHeading = isUpdatingPaymentMethodOnly
        ? 'Payment method updated'
        : checkoutMode === 'downgrade'
            ? 'Plan updated'
            : 'Payment successful';
    const successMessage = isUpdatingPaymentMethodOnly
        ? `Your account now uses ${maskCardNumber(draft.cardNumber)} for future renewals.`
        : checkoutMode === 'downgrade'
            ? 'Your workspace has moved to the Free plan. Paid invoices remain in your billing history.'
            : `Thank you. Your workspace is now on the ${plan.title} plan with ${draft.billingCycle} billing.`;

    if (step === 'success') {
        return (
            <div
                className="modal-backdrop-enter fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-slate-950/50 backdrop-blur-sm"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div className="absolute inset-0" onClick={completionAction} />

                <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-6">
                    <div className="modal-panel-enter relative w-full max-w-3xl overflow-hidden rounded-[38px] border border-white/70 bg-white p-6 shadow-[0_36px_100px_rgba(15,23,42,0.24)] lg:p-10">
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            {[
                                { left: '7%', top: '10%', color: 'bg-sky-400', delay: '0ms', rotate: '-12deg' },
                                { left: '17%', top: '6%', color: 'bg-fuchsia-400', delay: '180ms', rotate: '14deg' },
                                { left: '29%', top: '14%', color: 'bg-emerald-400', delay: '320ms', rotate: '-18deg' },
                                { left: '74%', top: '8%', color: 'bg-amber-400', delay: '120ms', rotate: '12deg' },
                                { left: '84%', top: '13%', color: 'bg-rose-400', delay: '260ms', rotate: '-10deg' },
                                { left: '92%', top: '9%', color: 'bg-violet-400', delay: '420ms', rotate: '18deg' }
                            ].map((piece, index) => (
                                <span
                                    key={`${piece.left}-${piece.top}-${index}`}
                                    className={`absolute h-16 w-3 rounded-full ${piece.color} opacity-80 animate-bounce`}
                                    style={{
                                        left: piece.left,
                                        top: piece.top,
                                        transform: `rotate(${piece.rotate})`,
                                        animationDelay: piece.delay,
                                        animationDuration: '1.8s'
                                    }}
                                />
                            ))}
                        </div>

                        <div className="relative mx-auto max-w-xl text-center">
                            <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#22c55e,#16a34a)] text-white shadow-[0_22px_50px_rgba(34,197,94,0.28)]">
                                <ShieldCheck className="h-9 w-9" />
                            </div>
                            <div className="mt-8 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                {successHeading}
                            </div>
                            <h2 className="mt-6 text-4xl font-display font-semibold text-slate-950 lg:text-5xl">Congratulations</h2>
                            <p className="mt-4 text-base leading-relaxed text-slate-600">
                                {successMessage}
                            </p>

                            <div className="mt-8 grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-left sm:grid-cols-3">
                                <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Plan</div>
                                    <div className="mt-2 text-base font-semibold text-slate-950">{plan.title}</div>
                                </div>
                                <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Billing</div>
                                    <div className="mt-2 text-base font-semibold capitalize text-slate-950">{draft.billingCycle}</div>
                                </div>
                                <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        {isUpdatingPaymentMethodOnly ? 'Payment method' : 'Total confirmed'}
                                    </div>
                                    <div className="mt-2 text-base font-semibold text-slate-950">
                                        {isUpdatingPaymentMethodOnly ? maskCardNumber(draft.cardNumber) : formatCurrency(planPrice)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <Button type="button" onClick={completionAction}>
                                    Return to account
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="modal-backdrop-enter fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-slate-950/40 backdrop-blur-sm touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <div className="absolute inset-0" onClick={isSubmitting ? undefined : onClose} />

            <div className="relative z-10 flex min-h-full items-start justify-center px-4 py-4 2xl:items-center 2xl:py-6">
                <div className="modal-panel-enter grid w-full max-w-6xl gap-6 rounded-[34px] border border-white/70 bg-white p-4 shadow-[0_32px_90px_rgba(15,23,42,0.2)] lg:h-[calc(100vh-2rem)] lg:max-h-[calc(100vh-2rem)] lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden lg:p-6 2xl:h-auto 2xl:max-h-[calc(100vh-3rem)]">
                    <div className="flex flex-col rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 lg:min-h-0 lg:p-6">
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

                        <div className="mt-6 pr-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                            {error && (
                                <div className="rounded-[18px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    {error}
                                </div>
                            )}

                            {step === 'details' && (
                                <div className="space-y-5">
                                <Section title="Billing cycle">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-sm text-slate-500">Choose the cadence you want the new plan to renew on.</div>
                                        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                                            {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                                                <button
                                                    key={cycle}
                                                    type="button"
                                                    onClick={() => setDraft((current) => ({ ...current, billingCycle: cycle }))}
                                                    className={[
                                                        'rounded-full px-4 py-2 text-sm font-semibold capitalize transition-all',
                                                        draft.billingCycle === cycle
                                                            ? 'bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_12px_26px_rgba(37,99,235,0.2)]'
                                                            : 'text-slate-500 hover:text-slate-900'
                                                    ].join(' ')}
                                                >
                                                    {cycle}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </Section>

                                <div className="grid gap-5 xl:grid-cols-2">
                                    <Section title="Billing information" icon={<Mail className="h-5 w-5 text-sky-500" />}>
                                        <div className="grid gap-4">
                                            <TextInput
                                                label="Billing email"
                                                type="email"
                                                value={draft.billingEmail}
                                                onChange={(value) => setDraft((current) => ({ ...current, billingEmail: value }))}
                                            />
                                            <TextInput
                                                label="Company or team"
                                                value={draft.company}
                                                onChange={(value) => setDraft((current) => ({ ...current, company: value }))}
                                                placeholder="Studio name or company"
                                                leadingIcon={<Building2 className="h-4 w-4 text-slate-400" />}
                                            />
                                            <TextInput
                                                label="VAT / tax ID"
                                                value={draft.taxId}
                                                onChange={(value) => setDraft((current) => ({ ...current, taxId: value }))}
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </Section>

                                    <Section
                                        title={needsPayment ? 'Payment method' : 'Plan change'}
                                        icon={needsPayment ? <CreditCard className="h-5 w-5 text-emerald-500" /> : undefined}
                                    >
                                        {needsPayment ? (
                                            <div className="grid gap-4">
                                                <TextInput
                                                    label="Cardholder name"
                                                    value={draft.cardholderName}
                                                    onChange={(value) => setDraft((current) => ({ ...current, cardholderName: value }))}
                                                    placeholder="Name on card"
                                                />
                                                <TextInput
                                                    label="Card number"
                                                    value={draft.cardNumber}
                                                    onChange={(value) => setDraft((current) => ({ ...current, cardNumber: formatCardNumber(value) }))}
                                                    placeholder="1234 5678 9012 3456"
                                                    inputMode="numeric"
                                                    leadingIcon={<CreditCard className="h-4 w-4 text-slate-400" />}
                                                />
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <TextInput
                                                        label="Expiry"
                                                        value={draft.expiry}
                                                        onChange={(value) => setDraft((current) => ({ ...current, expiry: formatExpiry(value) }))}
                                                        placeholder="MM/YY"
                                                        inputMode="numeric"
                                                    />
                                                    <TextInput
                                                        label="Security code"
                                                        value={draft.cvc}
                                                        onChange={(value) => setDraft((current) => ({ ...current, cvc: value.replace(/\D/g, '').slice(0, 4) }))}
                                                        placeholder="CVC"
                                                        inputMode="numeric"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm leading-relaxed text-slate-600">
                                                The Free plan does not require a payment method. Confirm the billing contact and continue to review the downgrade.
                                            </div>
                                        )}
                                    </Section>
                                </div>

                                {needsPayment && (
                                    <Section title="Billing address" icon={<MapPin className="h-5 w-5 text-violet-500" />}>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <TextInput
                                                label="Country or region"
                                                value={draft.country}
                                                onChange={(value) => setDraft((current) => ({ ...current, country: value }))}
                                            />
                                            <TextInput
                                                label="Postcode"
                                                value={draft.postalCode}
                                                onChange={(value) => setDraft((current) => ({ ...current, postalCode: value }))}
                                            />
                                        </div>
                                    </Section>
                                )}

                                <div className="flex flex-wrap justify-end gap-3">
                                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                                    <Button type="button" onClick={handleContinue}>Continue to review</Button>
                                </div>
                                </div>
                            )}

                            {step === 'review' && (
                                <div className="space-y-5">
                                <Section title="Review your billing details">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {[
                                            ['Billing email', draft.billingEmail],
                                            ['Company', draft.company || 'Individual account'],
                                            ['Billing address', `${draft.country}, ${draft.postalCode || 'Pending'}`],
                                            ['Payment method', needsPayment ? `${draft.cardholderName} - ${maskCardNumber(draft.cardNumber)}` : 'No payment method required']
                                        ].map(([label, value]) => (
                                            <div key={label} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                                                <div className="mt-1 text-sm text-slate-700">{value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>

                                <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-relaxed text-emerald-800">
                                    {isUpdatingPaymentMethodOnly
                                        ? 'The updated card becomes the default payment method for future renewals and invoice recovery.'
                                        : checkoutMode === 'downgrade'
                                            ? 'Your workspace changes to the Free plan immediately after confirmation. Paid invoices stay in your billing history.'
                                            : 'Your new plan starts immediately after confirmation and renews automatically until changed.'}
                                </div>

                                <div className="flex flex-wrap justify-end gap-3">
                                    <Button type="button" variant="secondary" onClick={() => setStep('details')}>Edit details</Button>
                                    <Button type="button" onClick={() => void handleConfirm()} disabled={isSubmitting}>
                                        {isSubmitting
                                            ? 'Processing...'
                                            : isUpdatingPaymentMethodOnly
                                                ? 'Save payment method'
                                                : checkoutMode === 'downgrade'
                                                    ? 'Confirm change'
                                                    : `Activate ${plan.title}`}
                                    </Button>
                                </div>
                                </div>
                            )}

                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a,#111827)] p-5 text-white lg:min-h-0 lg:overflow-y-auto lg:p-6">
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
                            <div className="flex items-center justify-between"><span>Included seats</span><span>{plan.includedSeats}</span></div>
                            <div className="flex items-center justify-between"><span>Plan subtotal</span><span>{formatCurrency(planPrice)}</span></div>
                            {draft.billingCycle === 'yearly' && planPrice > 0 && (
                                <div className="flex items-center justify-between text-emerald-200">
                                    <span>Annual savings</span>
                                    <span>-{formatCurrency(yearlySavings)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between"><span>Taxes</span><span>{planPrice > 0 ? 'Calculated at billing' : 'Included'}</span></div>
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
                            <div className="mt-3 text-sm text-slate-300">{currentPaymentMethodLabel}</div>
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
        </div>
    );
}

export function PlanCheckoutDialog(props: PlanCheckoutDialogProps) {
    const { open, targetTier } = props;

    if (!open || !targetTier) {
        return null;
    }

    return (
        <PlanCheckoutDialogInner
            currentTier={props.currentTier}
            targetTier={targetTier}
            initialBillingCycle={props.initialBillingCycle}
            initialBillingEmail={props.initialBillingEmail}
            initialCompany={props.initialCompany}
            initialCardholderName={props.initialCardholderName}
            currentPaymentMethodLabel={props.currentPaymentMethodLabel}
            isSubmitting={props.isSubmitting}
            onClose={props.onClose}
            onSuccessComplete={props.onSuccessComplete}
            onSubmit={props.onSubmit}
        />
    );
}

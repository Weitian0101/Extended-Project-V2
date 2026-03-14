import { BillingCycle, BillingInvoice, MembershipTier, UserProfileData } from '@/types';

export interface MembershipPlanConfig {
    id: MembershipTier;
    title: string;
    priceMonthly: number;
    includedSeats: number;
    summary: string;
    features: string[];
}

export const MEMBERSHIP_PLANS: Record<MembershipTier, MembershipPlanConfig> = {
    free: {
        id: 'free',
        title: 'Free',
        priceMonthly: 0,
        includedSeats: 1,
        summary: 'A simple sandbox for solo exploration and light experimentation.',
        features: [
            '1 private workspace',
            'Explore / Imagine / Implement / Tell Story access',
            'Basic AI prompt board',
            '1 active member'
        ]
    },
    plus: {
        id: 'plus',
        title: 'Plus',
        priceMonthly: 12,
        includedSeats: 1,
        summary: 'Best for independent practitioners who need richer facilitation support.',
        features: [
            'Unlimited private boards',
            'Full AI facilitator access',
            'Exportable reference decks',
            'Priority email support'
        ]
    },
    ultra: {
        id: 'ultra',
        title: 'Ultra',
        priceMonthly: 24,
        includedSeats: 5,
        summary: 'Built for multi-project collaboration, stronger AI workflows, and more seats.',
        features: [
            '5 included seats',
            'Advanced AI facilitator flows',
            'Shared workspace templates',
            'Project-level permissions'
        ]
    },
    business: {
        id: 'business',
        title: 'Business',
        priceMonthly: 48,
        includedSeats: 10,
        summary: 'For delivery teams that need governance, deeper access control, and reporting.',
        features: [
            '10 included seats',
            'Centralized permission controls',
            'Billing admin tools',
            'Workspace analytics'
        ]
    }
};

export function getMembershipPlan(tier: MembershipTier) {
    return MEMBERSHIP_PLANS[tier];
}

export function getMembershipPrice(tier: MembershipTier, billingCycle: BillingCycle) {
    const monthly = MEMBERSHIP_PLANS[tier].priceMonthly;
    return billingCycle === 'yearly' ? monthly * 10 : monthly;
}

export function getMembershipYearlySavings(tier: MembershipTier) {
    return MEMBERSHIP_PLANS[tier].priceMonthly * 2;
}

function buildInvoiceId(tier: MembershipTier, date: Date) {
    return `invoice-${tier}-${date.toISOString().slice(0, 7)}`;
}

function buildInvoiceLabel(tier: MembershipTier, date: Date) {
    return `${date.toLocaleString('en-GB', { month: 'long', year: 'numeric' })} ${MEMBERSHIP_PLANS[tier].title} plan`;
}

function getDefaultRenewalDate(tier: MembershipTier, billingCycle: BillingCycle, subscriptionStatus: UserProfileData['subscriptionStatus']) {
    if (tier === 'free' || subscriptionStatus === 'inactive' || subscriptionStatus === 'canceled') {
        return null;
    }

    const nextRenewal = new Date();
    nextRenewal.setMonth(nextRenewal.getMonth() + (billingCycle === 'yearly' ? 12 : 1));
    return nextRenewal.toISOString();
}

export function buildBillingInvoices(
    tier: MembershipTier,
    billingCycle: BillingCycle,
    subscriptionStatus: UserProfileData['subscriptionStatus']
): BillingInvoice[] {
    const amount = getMembershipPrice(tier, billingCycle);

    if (amount === 0) {
        return [];
    }

    const currentMonth = new Date();
    currentMonth.setUTCDate(1);
    currentMonth.setUTCHours(9, 0, 0, 0);

    const previousMonth = new Date(currentMonth);
    previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1);

    return [
        {
            id: buildInvoiceId(tier, currentMonth),
            label: buildInvoiceLabel(tier, currentMonth),
            amount,
            currency: 'GBP',
            status: subscriptionStatus === 'past_due' ? 'open' : 'paid',
            issuedAt: currentMonth.toISOString()
        },
        {
            id: buildInvoiceId(tier, previousMonth),
            label: buildInvoiceLabel(tier, previousMonth),
            amount,
            currency: 'GBP',
            status: 'paid',
            issuedAt: previousMonth.toISOString()
        }
    ];
}

export function buildMembershipProfile(
    tier: MembershipTier,
    billingCycle: BillingCycle = 'monthly',
    subscriptionStatus: UserProfileData['subscriptionStatus'] = 'active',
    paymentMethodLabel?: string,
    renewalDate?: string | null
) {
    const resolvedPaymentMethod = paymentMethodLabel
        || (getMembershipPrice(tier, billingCycle) === 0 ? 'No payment method required' : 'Visa ending in 4242');
    const resolvedRenewalDate = renewalDate === undefined
        ? getDefaultRenewalDate(tier, billingCycle, subscriptionStatus)
        : renewalDate;

    return {
        subscriptionTier: tier,
        billingCycle,
        subscriptionStatus,
        renewalDate: resolvedRenewalDate,
        paymentMethodLabel: resolvedPaymentMethod,
        billingInvoices: buildBillingInvoices(tier, billingCycle, subscriptionStatus)
    } satisfies Pick<UserProfileData, 'subscriptionTier' | 'billingCycle' | 'subscriptionStatus' | 'renewalDate' | 'paymentMethodLabel' | 'billingInvoices'>;
}

export function getDashboardSummaryRows(profile: Pick<UserProfileData, 'subscriptionTier' | 'workspace' | 'company' | 'title' | 'accountRole'>) {
    const plan = getMembershipPlan(profile.subscriptionTier);

    switch (profile.subscriptionTier) {
        case 'free':
            return [
                { label: 'Workspace', value: profile.workspace },
                { label: 'Access', value: `${plan.includedSeats} included seat` }
            ];
        case 'plus':
            return [
                { label: 'Workspace', value: profile.workspace },
                { label: 'Account', value: profile.title || profile.accountRole || 'Member' }
            ];
        case 'ultra':
            return [
                { label: 'Workspace', value: profile.workspace },
                { label: 'Team capacity', value: `Up to ${plan.includedSeats} seats` }
            ];
        case 'business':
        default:
            return [
                { label: 'Workspace', value: profile.workspace },
                { label: 'Company', value: profile.company || 'Add company' }
            ];
    }
}

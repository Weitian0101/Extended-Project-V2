import { AppViewState, GuideFlowVariant, OnboardingStepId } from '@/types';

const STORAGE_KEY = 'innovation_sandbox_onboarding_state';

const DASHBOARD_GUIDE_STEPS = new Set<OnboardingStepId>([
    'dashboard-summary',
    'dashboard-create',
    'dashboard-open'
]);

const SANDBOX_GUIDE_STEPS = new Set<OnboardingStepId>([
    'hub',
    'overview',
    'explore-home',
    'explore-card',
    'card-pages',
    'card-ai'
]);

export interface OnboardingGuideSession {
    step: OnboardingStepId;
    variant: GuideFlowVariant;
    updatedAt: string;
}

function isBrowser() {
    return typeof window !== 'undefined';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isValidGuideStep(value: unknown): value is OnboardingStepId {
    return typeof value === 'string' && (DASHBOARD_GUIDE_STEPS.has(value as OnboardingStepId) || SANDBOX_GUIDE_STEPS.has(value as OnboardingStepId));
}

function isValidGuideVariant(value: unknown): value is GuideFlowVariant {
    return value === 'new-user' || value === 'existing-user';
}

export function loadOnboardingGuideSession(): OnboardingGuideSession | null {
    if (!isBrowser()) {
        return null;
    }

    try {
        const rawValue = window.localStorage.getItem(STORAGE_KEY);
        if (!rawValue) {
            return null;
        }

        const parsed = JSON.parse(rawValue) as unknown;
        if (!isRecord(parsed) || !isValidGuideStep(parsed.step) || !isValidGuideVariant(parsed.variant)) {
            return null;
        }

        return {
            step: parsed.step,
            variant: parsed.variant,
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
        };
    } catch (error) {
        console.warn('Failed to restore onboarding guide state', error);
        return null;
    }
}

export function saveOnboardingGuideSession(session: Pick<OnboardingGuideSession, 'step' | 'variant'>) {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...session,
        updatedAt: new Date().toISOString()
    } satisfies OnboardingGuideSession));
}

export function clearOnboardingGuideSession() {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
}

export function getGuideStepForView(step: OnboardingStepId, view: AppViewState): OnboardingStepId | null {
    if (view === 'dashboard') {
        return SANDBOX_GUIDE_STEPS.has(step) ? 'dashboard-open' : step;
    }

    if (view === 'sandbox') {
        return DASHBOARD_GUIDE_STEPS.has(step) ? 'hub' : step;
    }

    return null;
}

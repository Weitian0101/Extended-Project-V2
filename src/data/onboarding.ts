import { GuideFlowVariant, OnboardingStepId } from '@/types';

const GUIDE_PROGRESS: Record<GuideFlowVariant, Record<OnboardingStepId, number>> = {
    'new-user': {
        'dashboard-summary': 1,
        'dashboard-create': 2,
        'dashboard-open': 3,
        hub: 4,
        overview: 5,
        'explore-home': 6,
        'explore-card': 7,
        'card-pages': 8,
        'card-ai': 9
    },
    'existing-user': {
        'dashboard-summary': 1,
        'dashboard-create': 2,
        'dashboard-open': 2,
        hub: 3,
        overview: 4,
        'explore-home': 5,
        'explore-card': 6,
        'card-pages': 7,
        'card-ai': 8
    }
};

export const GUIDE_VIEWPORT_MIN_WIDTH = 0;

export function getGuideProgress(variant: GuideFlowVariant, step: OnboardingStepId) {
    const currentStep = GUIDE_PROGRESS[variant][step];
    const totalSteps = variant === 'new-user' ? 9 : 8;

    return {
        currentStep,
        totalSteps
    };
}

export function shouldShowCreateStep(variant: GuideFlowVariant) {
    return variant === 'new-user';
}

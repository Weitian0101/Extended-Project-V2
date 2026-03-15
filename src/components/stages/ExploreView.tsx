import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';
import { GuideFlowVariant, MethodCardLayout, OnboardingStepId, ProjectHubData } from '@/types';

interface ExploreViewProps {
    projectId: string;
    projectName: string;
    hub: ProjectHubData;
    isHubLoading?: boolean;
    onCreateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks' | 'presence'>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
    methodCardLayout?: MethodCardLayout;
    guideStep?: OnboardingStepId | null;
    guideVariant?: GuideFlowVariant | null;
    onGuideStepChange?: (step: OnboardingStepId | null) => void;
    onDismissGuide?: () => void;
}

export function ExploreView({
    projectId,
    projectName,
    hub,
    isHubLoading = false,
    onCreateHubRecord,
    onUpdateHubRecord,
    methodCardLayout = 'classic',
    guideStep,
    guideVariant,
    onGuideStepChange,
    onDismissGuide
}: ExploreViewProps) {
    return (
        <StageMethodView
            projectId={projectId}
            projectName={projectName}
            hub={hub}
            isHubLoading={isHubLoading}
            onCreateHubRecord={onCreateHubRecord}
            onUpdateHubRecord={onUpdateHubRecord}
            methodCardLayout={methodCardLayout}
            stage="explore"
            stageTitle="Explore Stage"
            entryHeadline="Beyond Post-its turns Explore into a guided deck of discovery methods."
            entrySummary="In Explore, each Beyond Post-its card helps you frame the challenge, run research, build empathy, and turn signals into clearer insight before moving into ideas."
            guideTitle="Open Facilitator Guide"
            guideDescription="Read the methodology before starting."
            methodsDescription="All 20 Beyond Post-its Explore cards are now available as individual reference pages."
            entryImages={['/images/explore/fengmian1.png', '/images/explore/fengmian2.png']}
            guideImages={['/images/explore/Guide1.png', '/images/explore/Guide2.png']}
            guideStep={guideStep}
            guideVariant={guideVariant}
            onGuideStepChange={onGuideStepChange}
            onDismissGuide={onDismissGuide}
        />
    );
}

import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';
import { MethodCardLayout, ProjectHubData } from '@/types';

interface TellStoryViewProps {
    projectId: string;
    projectName: string;
    hub: ProjectHubData;
    isHubLoading?: boolean;
    onCreateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateHubRecord: <TResource extends 'cards' | 'artifacts' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
    onDeleteHubRecord: (resource: 'cards' | 'artifacts' | 'decisions' | 'threads' | 'tasks', id: string) => Promise<unknown>;
    methodCardLayout?: MethodCardLayout;
}

export function TellStoryView({ projectId, projectName, hub, isHubLoading = false, onCreateHubRecord, onUpdateHubRecord, onDeleteHubRecord, methodCardLayout = 'classic' }: TellStoryViewProps) {
    return (
        <StageMethodView
            projectId={projectId}
            projectName={projectName}
            hub={hub}
            isHubLoading={isHubLoading}
            onCreateHubRecord={onCreateHubRecord}
            onUpdateHubRecord={onUpdateHubRecord}
            onDeleteHubRecord={onDeleteHubRecord}
            methodCardLayout={methodCardLayout}
            stage="tell-story"
            stageTitle="Tell Story Stage"
            entryHeadline="Shape the narrative so people understand the work and act on it."
            entrySummary="Tell Story is where insight, evidence, and presentation come together into a persuasive final narrative."
            guideEyebrow="Stage Intro Pages"
            guideTitle="Open Story Atlas Intro"
            guideDescription="Preview the original Tell Story cover and card index pages before diving into individual cards."
            methodsDescription="All 20 Beyond Post-its Tell Story cards are available as individual front and AI reference pages."
            previewButtonLabel="Preview Intro Pages"
            guideActionLabel="View Intro Pages"
            entryImages={['/images/tell-story/guide-1.png', '/images/tell-story/guide-2.png']}
            guideImages={['/images/tell-story/guide-1.png', '/images/tell-story/guide-2.png']}
        />
    );
}

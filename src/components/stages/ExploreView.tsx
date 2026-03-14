import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';
import { ProjectHubData } from '@/types';

interface ExploreViewProps {
    projectId: string;
    projectName: string;
    hub: ProjectHubData;
    isHubLoading?: boolean;
    onCreateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks' | 'presence'>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
}

export function ExploreView({ projectId, projectName, hub, isHubLoading = false, onCreateHubRecord, onUpdateHubRecord }: ExploreViewProps) {
    return (
        <StageMethodView
            projectId={projectId}
            projectName={projectName}
            hub={hub}
            isHubLoading={isHubLoading}
            onCreateHubRecord={onCreateHubRecord}
            onUpdateHubRecord={onUpdateHubRecord}
            stage="explore"
            stageTitle="Explore Stage"
            entryHeadline="Understand the people, context, and real problem before moving into ideas."
            entrySummary="Use Explore to align on what matters, surface assumptions, and frame the opportunity with evidence."
            guideTitle="Open Facilitator Guide"
            guideDescription="Read the methodology before starting."
            methodsDescription="All 20 Beyond Post-its Explore cards are now available as individual reference pages."
            entryImages={['/images/explore/fengmian1.png', '/images/explore/fengmian2.png']}
            guideImages={['/images/explore/Guide1.png', '/images/explore/Guide2.png']}
        />
    );
}

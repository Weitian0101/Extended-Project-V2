import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';
import { ProjectHubData } from '@/types';

interface ImagineViewProps {
    projectId: string;
    projectName: string;
    hub: ProjectHubData;
    isHubLoading?: boolean;
    onCreateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks' | 'presence'>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
}

export function ImagineView({ projectId, projectName, hub, isHubLoading = false, onCreateHubRecord, onUpdateHubRecord }: ImagineViewProps) {
    return (
        <StageMethodView
            projectId={projectId}
            projectName={projectName}
            hub={hub}
            isHubLoading={isHubLoading}
            onCreateHubRecord={onCreateHubRecord}
            onUpdateHubRecord={onUpdateHubRecord}
            stage="imagine"
            stageTitle="Imagine Stage"
            entryHeadline="Open up possibilities before deciding which ideas deserve investment."
            entrySummary="Imagine is for generating directions, stretching concepts, and testing which ideas are worth carrying forward."
            guideTitle="Open Imagine Guide"
            guideDescription="Review the ideation flow before running the methods."
            methodsDescription="All 20 Beyond Post-its Imagine cards are available as individual front and AI reference pages."
            entryImages={['/images/imagine/intro-1.png', '/images/imagine/intro-2.png']}
            guideImages={['/images/imagine/guide-1.png', '/images/imagine/guide-2.png']}
        />
    );
}

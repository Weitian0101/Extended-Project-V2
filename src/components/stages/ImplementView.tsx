import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';
import { MethodCardLayout, ProjectHubData } from '@/types';

interface ImplementViewProps {
    projectId: string;
    projectName: string;
    hub: ProjectHubData;
    isHubLoading?: boolean;
    onCreateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateHubRecord: <TResource extends 'cards' | 'artifacts' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
    onDeleteHubRecord: (resource: 'cards' | 'artifacts' | 'decisions' | 'threads' | 'tasks', id: string) => Promise<unknown>;
    methodCardLayout?: MethodCardLayout;
}

export function ImplementView({ projectId, projectName, hub, isHubLoading = false, onCreateHubRecord, onUpdateHubRecord, onDeleteHubRecord, methodCardLayout = 'classic' }: ImplementViewProps) {
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
            stage="implement"
            stageTitle="Implement Stage"
            entryHeadline="Turn the strongest ideas into experiments, decisions, and practical rollout moves."
            entrySummary="Implement helps the team move from concept to business logic, testing plan, and execution pathway."
            guideTitle="Open Implement Guide"
            guideDescription="Review the experimentation and business design flow before starting."
            methodsDescription="All 20 Beyond Post-its Implement cards are available as individual front and AI reference pages."
            entryImages={['/images/implement/intro-1.png', '/images/implement/intro-2.png']}
            guideImages={['/images/implement/guide-1.png', '/images/implement/guide-2.png']}
        />
    );
}

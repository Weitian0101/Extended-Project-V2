import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';

interface ImagineViewProps {
    projectId: string;
    projectName: string;
}

export function ImagineView({ projectId, projectName }: ImagineViewProps) {
    return (
        <StageMethodView
            projectId={projectId}
            projectName={projectName}
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

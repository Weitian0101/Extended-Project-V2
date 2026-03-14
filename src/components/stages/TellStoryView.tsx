import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';

interface TellStoryViewProps {
    projectId: string;
    projectName: string;
}

export function TellStoryView({ projectId, projectName }: TellStoryViewProps) {
    return (
        <StageMethodView
            projectId={projectId}
            projectName={projectName}
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

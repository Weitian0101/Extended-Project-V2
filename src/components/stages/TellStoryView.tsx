import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';

export function TellStoryView() {
    return (
        <StageMethodView
            stage="tell-story"
            stageTitle="Tell Story Stage"
            entryHeadline="Shape the narrative so people understand the work and act on it."
            entrySummary="Tell Story is where insight, evidence, and presentation come together into a persuasive final narrative."
            guideTitle="Open Storytelling Overview"
            guideDescription="Review the storytelling sequence before diving into individual cards."
            methodsDescription="All 20 Beyond Post-its Tell Story cards are available as individual front and AI reference pages."
            entryImages={['/images/tell-story/guide-1.png', '/images/tell-story/guide-2.png']}
            guideImages={['/images/tell-story/guide-1.png', '/images/tell-story/guide-2.png']}
        />
    );
}

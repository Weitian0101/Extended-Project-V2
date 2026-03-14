import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';

export function ExploreView() {
    return (
        <StageMethodView
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

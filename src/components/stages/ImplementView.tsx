import React from 'react';

import { StageMethodView } from '@/components/stages/StageMethodView';

export function ImplementView() {
    return (
        <StageMethodView
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

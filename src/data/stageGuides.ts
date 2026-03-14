import { StageId } from '@/types';

type GuideStage = Extract<StageId, 'explore' | 'imagine' | 'implement' | 'tell-story'>;

export interface StageGuideGroup {
    title: string;
    description: string;
    methodIds: string[];
}

export const STAGE_GUIDE_GROUPS: Record<GuideStage, StageGuideGroup[]> = {
    explore: [
        {
            title: 'Frame the Challenge',
            description: 'Open the problem space and question the brief before diving into research.',
            methodIds: ['break-the-ice', 'challenge-the-brief', 'frame-wicked-problems']
        },
        {
            title: 'Conduct Research',
            description: 'Plan research, choose methods, and map the wider context around the challenge.',
            methodIds: ['choose-research-methods', 'plan-research', 'map-stakeholders', 'explore-business-context', 'explore-external-context']
        },
        {
            title: 'Build Empathy',
            description: 'Get closer to users through interviews, immersion, and observation.',
            methodIds: ['conduct-user-interviews', 'immerse-yourself', 'observe-users']
        },
        {
            title: 'Analyse & Synthesise',
            description: 'Turn raw research into patterns, shared models, and stronger insight.',
            methodIds: ['map-empathy', 'build-a-persona', 'create-a-shared-model', 'analyse-and-synthesise', 'map-the-user-journey', 'draw-insights']
        },
        {
            title: 'Define Problems',
            description: 'Turn learning into a precise problem worth solving.',
            methodIds: ['define-problem-statement']
        },
        {
            title: 'Define Opportunities',
            description: 'Translate insight into clear opportunity spaces and next moves.',
            methodIds: ['map-opportunities', 'frame-opportunity-statement']
        }
    ],
    imagine: [
        {
            title: 'Shift Mindsets',
            description: 'Get the team loose, aligned, and ready to create.',
            methodIds: ['shift-gears', 'run-an-energiser', 'set-ground-rules']
        },
        {
            title: 'Generate Ideas',
            description: 'Open up lots of possibilities with divergent idea-generation methods.',
            methodIds: ['apply-ideation-techniques', 'brainstorm-ideas', 'brainwrite-together', 'reverse-the-solution', 'ask-what-if', 'sketch-crazy-8s']
        },
        {
            title: 'Select Ideas',
            description: 'Converge on the directions worth carrying forward.',
            methodIds: ['select-promising-ideas', 'prioritise-with-2x2-grid']
        },
        {
            title: 'Create Concepts',
            description: 'Turn shortlisted ideas into clearer, more communicable concepts.',
            methodIds: ['create-a-concept', 'exchange-feedback']
        },
        {
            title: 'Prototype & Test',
            description: 'Make ideas tangible, test quickly, and keep iterating with users.',
            methodIds: ['choose-prototype-types', 'apply-prototype-techniques', 'test-the-concept', 'test-with-users', 'iterate-the-prototype', 'co-iterate-with-users', 'run-a-design-sprint']
        }
    ],
    implement: [
        {
            title: 'Frame Assumptions & Hypotheses',
            description: 'Clarify what needs to be tested before committing to execution.',
            methodIds: ['identify-assumptions', 'frame-hypotheses']
        },
        {
            title: 'Design Experiments',
            description: 'Define tests, metrics, and experiment setups that generate real evidence.',
            methodIds: ['plan-experiments', 'set-up-experiments']
        },
        {
            title: 'Test Through Lenses',
            description: 'Evaluate the concept across desirability, feasibility, viability, sustainability, and business realities.',
            methodIds: ['test-desirability', 'test-feasibility', 'test-viability', 'test-sustainability', 'apply-business-lenses']
        },
        {
            title: 'Build Business Foundations',
            description: 'Translate the concept into a viable model, proposition, and operating logic.',
            methodIds: ['design-a-go-to-market-strategy', 'map-a-bmc', 'map-a-vpc', 'design-with-the-4p-model', 'design-with-the-4c-model', 'build-a-service-blueprint']
        },
        {
            title: 'Integrate & Pilot',
            description: 'Bring the parts together, test the full system, and run real pilots.',
            methodIds: ['test-the-whole-system', 'run-pilots']
        },
        {
            title: 'Launch & Scale Responsibly',
            description: 'Prepare for rollout, scale, and long-term growth without losing fit.',
            methodIds: ['launch-the-solution', 'scale-the-solution', 'select-scaling-path']
        }
    ],
    'tell-story': [
        {
            title: 'Divergent Thinking',
            description: 'Open up the story space, gather narrative material, and shape the raw ingredients.',
            methodIds: ['apply-4d-frame', 'discover-the-purpose', 'define-the-audience', 'develop-the-content', 'identify-key-messages', 'support-with-data-and-stories', 'humanize-data', 'visualize-data', 'find-story-in-data', 'structure-the-story']
        },
        {
            title: 'Convergent Thinking',
            description: 'Turn the story into a polished narrative, delivery flow, and presentation outcome.',
            methodIds: ['create-a-storyboard', 'begin-strong', 'make-meaning-in-the-middle', 'end-to-make-it-stick', 'write-crisp-titles', 'write-a-recommendation', 'use-voice-and-tone', 'use-body-language', 'design-presentation-slides', 'rehearse-and-refine']
        }
    ]
};

export function getMethodCategory(stage: GuideStage, methodId: string) {
    return STAGE_GUIDE_GROUPS[stage].find(group => group.methodIds.includes(methodId))?.title;
}

import { MethodCard } from '@/types';

export const METHOD_LIBRARY: MethodCard[] = [
    {
        id: 'break-the-ice',
        stage: 'explore',
        title: 'Break the Ice',
        purpose: 'Build trust and creative energy before diving deep.',
        image: '/images/explore/breaktheice1.png',
        aiPrompts: [
            {
                id: 'creative-5',
                label: 'Generate 5 creative icebreakers',
                promptTemplate: 'Generate 5 creative icebreakers connected to this workshop theme.'
            },
            {
                id: 'inclusive',
                label: 'Suggest inclusive icebreakers',
                promptTemplate: 'Suggest inclusive icebreakers suitable for in-person, remote, and hybrid teams.'
            },
            {
                id: 'adapt-time',
                label: 'Adapt for time/group size',
                promptTemplate: 'Adapt this icebreaker for a group of 10 participants with limited time (10 mins).'
            },
            {
                id: 'surface-assumptions',
                label: 'Surface hidden assumptions',
                promptTemplate: 'Create playful icebreakers that surface hidden assumptions about the challenge.'
            },
            {
                id: 'warmup-sequence',
                label: 'Propose a 3-step sequence',
                promptTemplate: 'Propose a 3-step warm-up sequence to build trust and creative energy.'
            }
        ],
        steps: [
            {
                id: 'step-1',
                title: 'Brainstorm Ideas',
                type: 'diverge',
                facilitatorText: 'Let\'s start by generating some fun icebreaker ideas. Don\'t overthink it!',
                placeholder: 'Type an idea and press Enter...',
                aiCapability: 'generate'
            },
            {
                id: 'step-2',
                title: 'Select & Refine',
                type: 'input',
                facilitatorText: 'Pick your favorite idea and refine it into a clear instruction for the group.',
                placeholder: 'Describe the final icebreaker activity here...',
                aiCapability: 'refine'
            }
        ]
    }
];

export interface QuickStartItem {
    id: string;
    step: string;
    title: string;
    description: string;
    value: string;
}

export interface LearningSnapshot {
    id: string;
    title: string;
    description: string;
    image: string;
}

export const QUICK_START_FLOW: QuickStartItem[] = [
    {
        id: 'dashboard-trackers',
        step: '01',
        title: 'Start with the four tracker cards',
        description: 'They show where work is moving right now: what needs attention, what is coming up, what is assigned to you, and what changed most recently.',
        value: 'Use them to decide where to jump in before opening a project.'
    },
    {
        id: 'dashboard-create',
        step: '02',
        title: 'Create a project for one challenge',
        description: 'Each project becomes the home for one piece of work: the brief, stage views, cards, captured outcomes, and AI support all stay together there.',
        value: 'If you are new, create a project before exploring the deeper tools.'
    },
    {
        id: 'dashboard-open',
        step: '03',
        title: 'Open the project from its dashboard card',
        description: 'The project card is your way back into active work. It keeps progress, team activity, tasks, and recent status visible from one place.',
        value: 'Click the card when you want to move from overview into the live project.'
    },
    {
        id: 'hub-context',
        step: '04',
        title: 'Use Hub first, then fill in Project Context',
        description: 'Hub keeps the work coordinated. Project Context captures the challenge background, objectives, and assumptions so the team and AI are working from the same brief.',
        value: 'These two areas keep the project aligned before you start using methods.'
    },
    {
        id: 'explore-beyond-post-its',
        step: '05',
        title: 'Explore is your Beyond Post-its starting point',
        description: 'Explore is where the Beyond Post-its card deck lives inside the platform. It helps you understand the challenge before you move into ideas, experiments, or storytelling.',
        value: 'Use Explore when you need to frame the problem, look at people, and build insight.'
    },
    {
        id: 'method-card-open',
        step: '06',
        title: 'Open a card to run one method properly',
        description: 'Each card is one method. Opening it gives you the method sheet, the AI prompt page, and the facilitation support for that specific activity.',
        value: 'Choose a card when you are ready to run one focused exercise with the team.'
    },
    {
        id: 'method-card-pages',
        step: '07',
        title: 'Read the front, then switch to AI Prompt Page',
        description: 'The front side explains what the method is for and how to run it. The AI Prompt Page turns that method into prompts you can use immediately.',
        value: 'Front helps you understand the activity. AI helps you facilitate it.'
    },
    {
        id: 'method-card-ai',
        step: '08',
        title: 'Use the AI Facilitator to keep the session moving',
        description: 'The AI on the right can help you prepare questions, reframe a prompt, think through next steps, and turn workshop output into clearer follow-up work.',
        value: 'It is there to support your facilitation, not replace it.'
    }
];

export const LEARNING_SNAPSHOTS: LearningSnapshot[] = [
    {
        id: 'explore-guide',
        title: 'Explore and Beyond Post-its',
        description: 'The entry view for the Beyond Post-its discovery deck and the place to start exploring methods.',
        image: '/images/explore/Guide1.png'
    },
    {
        id: 'explore-reference',
        title: 'Explore reference pages',
        description: 'A reminder of how the Explore cards are organised and how to move into a specific method.',
        image: '/images/explore/Guide2.png'
    },
    {
        id: 'imagine-guide',
        title: 'Imagine walkthrough',
        description: 'A reminder of where to go when you move from insight into ideas, concepts, and tests.',
        image: '/images/imagine/guide-1.png'
    },
    {
        id: 'implement-guide',
        title: 'Implement walkthrough',
        description: 'A reminder of the stage for experiments, delivery planning, and making ideas real.',
        image: '/images/implement/guide-1.png'
    },
    {
        id: 'tell-story-guide',
        title: 'Tell Story walkthrough',
        description: 'A reminder of where to shape the story, the message, and the presentation flow.',
        image: '/images/tell-story/guide-1.png'
    },
    {
        id: 'tell-story-reference',
        title: 'Storytelling reference board',
        description: 'A visual reminder for building the story and preparing what you want to show others.',
        image: '/images/tell-story/guide-2.png'
    }
];

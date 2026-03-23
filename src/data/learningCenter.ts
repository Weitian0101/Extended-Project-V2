export interface LearningTutorialSection {
    id: string;
    title: string;
    body: string;
}

export interface LearningLesson {
    id: string;
    title: string;
    summary: string;
    image?: string;
    videoUrl?: string | null;
    videoLabel?: string;
    textSections: LearningTutorialSection[];
}

export interface LearningCategory {
    id: string;
    label: string;
    title: string;
    summary: string;
    accentClassName: string;
    lessons: LearningLesson[];
}

export const LEARNING_CATEGORIES: LearningCategory[] = [
    {
        id: 'workspace-basics',
        label: 'Start here',
        title: 'Workspace basics',
        summary: 'Get oriented fast: dashboard first, then open a project and set the brief.',
        accentClassName: 'from-sky-500/20 via-cyan-400/10 to-transparent',
        lessons: [
            {
                id: 'dashboard-overview',
                title: 'Read the dashboard in under a minute',
                summary: 'Use the summary cards to spot what needs review, what is scheduled next, and where your tasks are.',
                videoLabel: 'Dashboard walkthrough',
                videoUrl: null,
                image: '/images/explore/Guide1.png',
                textSections: [
                    {
                        id: 'dashboard-1',
                        title: 'Check the top summary cards first',
                        body: 'The four dashboard cards are the fast health check. They show review work, upcoming sessions, assigned tasks, and recent activity so you know where to jump in.'
                    },
                    {
                        id: 'dashboard-2',
                        title: 'Open one project per challenge',
                        body: 'Each project should hold one real piece of work. That keeps context, stage work, sessions, decisions, and outputs in the same place.'
                    },
                    {
                        id: 'dashboard-3',
                        title: 'Use project tiles as your return point',
                        body: 'The project tile is not just a link. It is the quickest way back to the stage, review count, task load, and recent momentum.'
                    }
                ]
            },
            {
                id: 'project-context',
                title: 'Set the project brief before running methods',
                summary: 'Project Context gives the team and AI the same background, objectives, and assumptions.',
                videoLabel: 'Project context setup',
                videoUrl: null,
                image: '/images/imagine/guide-1.png',
                textSections: [
                    {
                        id: 'context-1',
                        title: 'Background explains the challenge',
                        body: 'Write the situation in plain language. Keep it short enough that a new teammate can understand it quickly.'
                    },
                    {
                        id: 'context-2',
                        title: 'Objectives define what success looks like',
                        body: 'Good objectives are concrete. They help the team judge whether a method output is actually useful.'
                    },
                    {
                        id: 'context-3',
                        title: 'Assumptions show what could be wrong',
                        body: 'Use assumptions to capture risk, uncertainty, or beliefs that still need testing. This keeps later decisions grounded.'
                    }
                ]
            }
        ]
    },
    {
        id: 'project-hub',
        label: 'Hub',
        title: 'Project Hub',
        summary: 'Use Hub to coordinate people, tasks, sessions, decisions, and reusable outputs.',
        accentClassName: 'from-emerald-500/20 via-teal-400/10 to-transparent',
        lessons: [
            {
                id: 'todo-lists',
                title: 'Use global and private todo lists correctly',
                summary: 'Global list items are shared with the team. Private list items only belong to you.',
                videoLabel: 'Todo list tutorial',
                videoUrl: null,
                image: '/images/implement/guide-1.png',
                textSections: [
                    {
                        id: 'todo-1',
                        title: 'Global list = team-visible work',
                        body: 'Put shared follow-up here. Everyone can see it, and it belongs in the project conversation.'
                    },
                    {
                        id: 'todo-2',
                        title: 'Private list = your own reminders',
                        body: 'Use private tasks for notes or reminders that should not clutter the shared board.'
                    },
                    {
                        id: 'todo-3',
                        title: 'Move important items into the board when needed',
                        body: 'If a private note becomes real team work, convert it into a shared task or board card so it can be tracked properly.'
                    }
                ]
            },
            {
                id: 'sessions-and-rituals',
                title: 'Plan sessions with the right meeting details',
                summary: 'Sessions can be online or offline, with team-member participants, a place, or a meeting link.',
                videoLabel: 'Session planning tutorial',
                videoUrl: null,
                image: '/images/tell-story/guide-1.png',
                textSections: [
                    {
                        id: 'sessions-1',
                        title: 'Pick people from the team first',
                        body: 'Use the member picker for known participants, then add any outside guests manually if needed.'
                    },
                    {
                        id: 'sessions-2',
                        title: 'Online and offline sessions carry different details',
                        body: 'Offline sessions need a location. Online sessions need the meeting link. The session card preview already shows whether it is online or offline.'
                    },
                    {
                        id: 'sessions-3',
                        title: 'Use sessions for real rituals',
                        body: 'This area works best for workshops, review calls, and check-ins that the team should be able to find later.'
                    }
                ]
            },
            {
                id: 'decisions-and-outputs',
                title: 'Separate decisions from outputs',
                summary: 'Decisions capture a call. Outputs capture reusable material like insights, concepts, experiments, and story assets.',
                videoLabel: 'Decision and output tutorial',
                videoUrl: null,
                image: '/images/tell-story/guide-2.png',
                textSections: [
                    {
                        id: 'decision-1',
                        title: 'Use approval only when it is truly needed',
                        body: 'If a decision does not need approval, save it as decided right away. If approval is needed, assign the approvers from the team.'
                    },
                    {
                        id: 'decision-2',
                        title: 'Proposed only means approval is still incomplete',
                        body: 'A decision should only stay proposed while approval is still pending. Partial approval is shown as progress like 1/2.'
                    },
                    {
                        id: 'decision-3',
                        title: 'Outputs are reusable project assets',
                        body: 'Capture outputs when the team creates something people should come back to later, such as a concept, experiment, or narrative draft.'
                    }
                ]
            }
        ]
    },
    {
        id: 'method-cards',
        label: 'Cards',
        title: 'Method cards',
        summary: 'Run a card with the reference page on one side and live capture on the other.',
        accentClassName: 'from-rose-500/20 via-orange-400/10 to-transparent',
        lessons: [
            {
                id: 'card-pages',
                title: 'Front page vs AI prompt page',
                summary: 'The front explains the method. The AI prompt page helps you run it faster and more clearly.',
                videoLabel: 'Method card pages',
                videoUrl: null,
                image: '/images/explore/Guide2.png',
                textSections: [
                    {
                        id: 'pages-1',
                        title: 'Read the front before you facilitate',
                        body: 'The front page explains what the method is for, how to run it, and what kind of output to look for.'
                    },
                    {
                        id: 'pages-2',
                        title: 'Use the AI prompt page for facilitation support',
                        body: 'The prompt page helps you reword questions, surface blind spots, and keep the room moving without losing the structure of the method.'
                    },
                    {
                        id: 'pages-3',
                        title: 'Keep the reference visible while working',
                        body: 'The split view is designed so you can stay on the card while still capturing outcomes and talking to the AI.'
                    }
                ]
            },
            {
                id: 'threads-and-linked-work',
                title: 'Threads and linked work on a card',
                summary: 'Threads keep discussions visible. Linked work shows what this method run already created in the Hub.',
                videoLabel: 'Threads and linked work',
                videoUrl: null,
                image: '/images/imagine/guide-1.png',
                textSections: [
                    {
                        id: 'linked-1',
                        title: 'Use threads for unresolved discussion',
                        body: 'Threads are for questions, debate, or follow-up that should stay attached to this specific method run.'
                    },
                    {
                        id: 'linked-2',
                        title: 'Linked work explains why the card matters later',
                        body: 'Linked cards, tasks, decisions, and outputs show the real project records that came out of this run.'
                    },
                    {
                        id: 'linked-3',
                        title: 'Capture fast here, refine in Hub later',
                        body: 'The card page is optimized for quick capture during a live session. Hub is where you refine ownership, approval, and follow-up detail later.'
                    }
                ]
            }
        ]
    },
    {
        id: 'stage-atlas',
        label: 'Stages',
        title: 'Explore, Imagine, Implement, Tell Story',
        summary: 'Each stage has a different job, so pick the stage that matches the kind of progress you need.',
        accentClassName: 'from-violet-500/20 via-fuchsia-400/10 to-transparent',
        lessons: [
            {
                id: 'explore-stage',
                title: 'Use Explore for discovery',
                summary: 'Explore is where the Beyond Post-its deck helps you understand the challenge before ideation starts.',
                videoLabel: 'Explore stage walkthrough',
                videoUrl: null,
                image: '/images/explore/Guide1.png',
                textSections: [
                    {
                        id: 'explore-1',
                        title: 'Start here when the problem is still fuzzy',
                        body: 'Explore helps the team understand people, context, patterns, and open questions before jumping to solutions.'
                    },
                    {
                        id: 'explore-2',
                        title: 'Look for signals, not final answers',
                        body: 'Good Explore work creates insight and sharper framing, not polished solutions.'
                    }
                ]
            },
            {
                id: 'later-stages',
                title: 'Know when to move into later stages',
                summary: 'Imagine opens options, Implement tests what is viable, and Tell Story prepares the narrative.',
                videoLabel: 'Stage transitions',
                videoUrl: null,
                image: '/images/tell-story/guide-1.png',
                textSections: [
                    {
                        id: 'stages-1',
                        title: 'Imagine when you need more options',
                        body: 'Move to Imagine when you understand the challenge well enough to create directions, concepts, and possibilities.'
                    },
                    {
                        id: 'stages-2',
                        title: 'Implement when ideas need proof',
                        body: 'Implement is for experiments, delivery thinking, and practical next moves.'
                    },
                    {
                        id: 'stages-3',
                        title: 'Tell Story when others need to understand',
                        body: 'Use Tell Story to shape the narrative, supporting evidence, and final communication flow.'
                    }
                ]
            }
        ]
    }
];

import { TeamMember, UserProfileData, WorkspaceProject } from '@/types';

export const DEFAULT_USER: UserProfileData = {
    name: 'User',
    email: 'user@innovation-sandbox.ai',
    title: 'Workspace Owner',
    phone: '+44 20 7946 0958',
    location: 'London, United Kingdom',
    workspace: 'Innovation Sandbox Workspace',
    membership: 'plus',
    membershipLabel: 'Plus',
    plan: 'Plus Membership',
    billingCycle: 'yearly',
    seats: 1,
    billingEmail: 'billing@innovation-sandbox.ai',
    paymentMethod: 'Visa ending in 4242',
    company: 'Innovation Sandbox Ltd.',
    renewalDate: '30 Apr 2026',
    usage: '1 of 1 seat active'
};

export const DEFAULT_TEAM: TeamMember[] = [
    {
        id: 'user',
        name: 'User',
        initials: 'US',
        role: 'Workspace Owner',
        status: 'online',
        avatarColor: 'from-slate-900 to-slate-700',
        permission: 'owner'
    },
    {
        id: 'maya',
        name: 'Maya Chen',
        initials: 'MC',
        role: 'Research Lead',
        status: 'online',
        avatarColor: 'from-emerald-500 to-teal-400',
        permission: 'edit'
    },
    {
        id: 'leo',
        name: 'Leo Park',
        initials: 'LP',
        role: 'Product Designer',
        status: 'away',
        avatarColor: 'from-sky-500 to-cyan-400',
        permission: 'edit'
    },
    {
        id: 'nina',
        name: 'Nina Gomez',
        initials: 'NG',
        role: 'Business Partner',
        status: 'online',
        avatarColor: 'from-amber-500 to-orange-400',
        permission: 'view'
    }
];

export const DEFAULT_PROJECTS: WorkspaceProject[] = [
    {
        id: '1',
        name: 'Sustainable Packaging',
        accent: 'from-emerald-500 to-lime-300',
        ownerId: 'user',
        updated: '2 mins ago',
        summary: 'Packaging system refresh for lower waste and better supply visibility.',
        members: DEFAULT_TEAM
    },
    {
        id: '2',
        name: 'AI Education App',
        accent: 'from-sky-500 to-cyan-300',
        ownerId: 'user',
        updated: '2 days ago',
        summary: 'Guided product concept for classroom pilots and teacher workflows.',
        members: DEFAULT_TEAM.slice(0, 3)
    },
    {
        id: '3',
        name: 'Smart Home Hub',
        accent: 'from-rose-500 to-orange-300',
        ownerId: 'maya',
        updated: '5 days ago',
        summary: 'Service concept exploring onboarding, automation, and support loops.',
        members: [DEFAULT_TEAM[1], DEFAULT_TEAM[2], DEFAULT_TEAM[3]]
    }
];

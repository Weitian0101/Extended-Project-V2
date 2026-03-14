export type StageId = 'overview' | 'explore' | 'imagine' | 'implement' | 'tell-story';
export type AppViewState = 'landing' | 'auth' | 'dashboard' | 'sandbox' | 'profile' | 'logging_out';
export type ToolFieldValue = string | string[] | boolean | number | null;
export type ToolFieldMap = Record<string, ToolFieldValue>;

export interface AiPrompt {
    id: string;
    label: string; // The button text
    promptTemplate: string; // The text sent to AI
}

export interface MethodStep {
    id: string;
    title?: string;
    type: 'diverge' | 'input' | 'text' | 'textarea' | 'select' | 'checkbox' | 'instruction';
    facilitatorText?: string;
    placeholder?: string;
    aiCapability?: 'none' | 'generate' | 'critique' | 'elaborate' | 'refine';
    question?: string; // For ToolWorkspace
    options?: string[]; // For ToolWorkspace
}

export interface ReferencePage {
    id: string;
    label: string;
    image: string;
}

export interface MethodCard {
    id: string;
    stage: StageId;
    title: string;
    category?: string;
    purpose: string;
    image: string; // Path to reference image
    referencePages?: ReferencePage[];
    aiPrompts: AiPrompt[];
    steps?: MethodStep[]; // For SessionWorkspace
    template?: MethodStep[]; // For ToolWorkspace
    hint?: string; // For ToolWorkspace
}

export interface ToolRun {
    id: string;
    methodCardId: string;
    methodCardTitle: string;
    stage: StageId;
    createdAt: number;
    updatedAt: number;
    currentStepIndex?: number; // Optional for legacy
    data?: ToolFieldMap; // For SessionWorkspace
    answers?: ToolFieldMap; // For ToolWorkspace
    aiResponses?: AiResponseEntry[];
}

export interface ProjectContext {
    name: string;
    background: string;
    objectives: string;
    assumptions: string;
}

export interface ProjectData {
    id: string;
    context: ProjectContext; // Persistent context layer
    currentStage: StageId;
    toolRuns: ToolRun[];
}

export type PermissionLevel = 'owner' | 'edit' | 'view';
export type MembershipTier = 'free' | 'plus' | 'ultra' | 'business';
export type BillingCycle = 'monthly' | 'yearly';

export interface BillingInvoice {
    id: string;
    label: string;
    amount: number;
    currency: string;
    status: 'draft' | 'paid' | 'open' | 'void';
    issuedAt: string;
}

export interface MembershipCheckoutDraft {
    tier: MembershipTier;
    billingCycle: BillingCycle;
    billingEmail: string;
    company: string;
    country: string;
    postalCode: string;
    taxId: string;
    cardholderName: string;
    cardNumber: string;
    expiry: string;
    cvc: string;
}

export interface ProjectInvite {
    id: string;
    email: string;
    permission: PermissionLevel;
    status: 'pending' | 'accepted' | 'revoked';
    createdAt: string;
    inviteUrl?: string;
}

export interface TeamMember {
    id: string;
    name: string;
    email?: string;
    initials: string;
    role: string;
    status: 'online' | 'away' | 'offline';
    avatarColor: string;
    permission: PermissionLevel;
}

export interface WorkspaceProject {
    id: string;
    name: string;
    accent: string;
    ownerId: string;
    updated: string;
    updatedAt?: string;
    summary: string;
    members: TeamMember[];
    pendingInvites?: ProjectInvite[];
}

export interface UserProfileData {
    id?: string;
    name: string;
    email: string;
    title: string;
    phone: string;
    location: string;
    workspace: string;
    billingEmail: string;
    company: string;
    accountRole: string;
    subscriptionTier: MembershipTier;
    billingCycle: BillingCycle;
    subscriptionStatus: 'inactive' | 'trial' | 'active' | 'past_due' | 'canceled';
    renewalDate?: string | null;
    paymentMethodLabel: string;
    billingInvoices: BillingInvoice[];
    createdAt?: string;
    lastSignInAt?: string | null;
}

export interface ProjectState {
    project: ProjectData;
    setProject: (project: ProjectData) => void;
    updateProject: (updates: Partial<ProjectData>) => void;
}

export interface StickyNote {
    id: string;
    content: string;
    color?: 'yellow' | 'blue' | 'green' | 'pink';
    tags?: string[];
}

export interface PrototypeArtifact {
    id: string;
    title: string;
    description: string;
    type: string;
    content: string;
}

export interface FeedbackItem {
    id: string;
    content: string;
    userId?: string;
}

export interface AiResponseEntry {
    prompt: string;
    response: string;
    timestamp: number;
}

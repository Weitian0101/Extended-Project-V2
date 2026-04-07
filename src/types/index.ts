export type StageId = 'overview' | 'explore' | 'imagine' | 'implement' | 'tell-story';
export type ProjectSurface = 'hub' | StageId;
export type AppViewState = 'landing' | 'auth' | 'dashboard' | 'sandbox' | 'profile' | 'learning-center' | 'logging_out';
export type MethodCardLayout = 'classic' | 'immersive';
export type ToolFieldValue = string | string[] | boolean | number | null;
export type ToolFieldMap = Record<string, ToolFieldValue>;
export type ProjectHubTab = 'brief' | 'board' | 'sessions' | 'outcomes';
export type CollaborationMetadataValue = string | number | boolean | null;
export type CollaborationMetadata = Record<string, CollaborationMetadataValue>;
export type CollaborationEntityType = 'brief' | 'card' | 'artifact' | 'decision' | 'task' | 'session' | 'tool-run';
export type CollaborationCardType = 'insight' | 'idea' | 'experiment' | 'story' | 'risk' | 'dependency';
export type CollaborationCardStatus = 'open-questions' | 'in-progress' | 'ready-for-review' | 'approved' | 'parked';
export type ArtifactType = 'insight' | 'concept' | 'experiment' | 'narrative' | 'attachment';
export type ArtifactStatus = 'draft' | 'ready' | 'approved';
export type ProjectSessionStatus = 'planned' | 'in-progress' | 'completed' | 'canceled';
export type DecisionStatus = 'proposed' | 'decided' | 'revisit';
export type TaskStatus = 'open' | 'in-progress' | 'blocked' | 'done';
export type PresenceStatus = 'online' | 'away' | 'offline';
export type ActivityAction = 'created' | 'updated' | 'commented' | 'resolved' | 'scheduled' | 'captured' | 'approved' | 'assigned';

export interface CollaborationRecord<TStatus extends string> {
    id: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    version: number;
    status: TStatus;
    metadata: CollaborationMetadata;
}

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
    aiHandoffPrompt?: string;
}

export interface ProjectBrief {
    projectId: string;
    background: string;
    objectives: string;
    assumptions: string;
    successMetrics: string;
    milestones: string;
    teamRoles: string;
    workingNorms: string;
    keyLinks: string;
    version: number;
    updatedAt: string;
    updatedBy: string;
    metadata: CollaborationMetadata;
}

export interface ProjectData {
    id: string;
    context: ProjectContext; // Persistent context layer
    currentStage: StageId;
    toolRuns: ToolRun[];
}

export interface CollaborationCard extends CollaborationRecord<CollaborationCardStatus> {
    title: string;
    summary: string;
    type: CollaborationCardType;
    stage?: StageId | null;
    ownerId?: string | null;
    dueDate?: string | null;
    linkedRunId?: string | null;
    linkedDecisionId?: string | null;
    linkedTaskId?: string | null;
}

export interface ProjectArtifact extends CollaborationRecord<ArtifactStatus> {
    title: string;
    summary: string;
    type: ArtifactType;
    stage?: StageId | null;
    ownerId?: string | null;
    pinned: boolean;
    versionLabel: string;
    linkedRunId?: string | null;
    linkedCardId?: string | null;
    linkedDecisionId?: string | null;
}

export interface ProjectSession extends CollaborationRecord<ProjectSessionStatus> {
    title: string;
    agenda: string;
    goal: string;
    participants: string;
    facilitatorId?: string | null;
    noteTakerId?: string | null;
    scheduledAt?: string | null;
    preRead: string;
    outputSummary: string;
    followUps: string;
}

export interface DecisionLogEntry extends CollaborationRecord<DecisionStatus> {
    title: string;
    background: string;
    options: string;
    decision: string;
    rationale: string;
    impact: string;
    ownerId?: string | null;
    decisionDate?: string | null;
    reviewDate?: string | null;
}

export interface CommentThread extends CollaborationRecord<'open' | 'resolved'> {
    entityType: CollaborationEntityType;
    entityId: string;
    title: string;
    body: string;
    ownerId?: string | null;
    nextStep: string;
    mentions: string[];
}

export interface TaskItem extends CollaborationRecord<TaskStatus> {
    title: string;
    details: string;
    ownerId?: string | null;
    dueDate?: string | null;
    stage?: StageId | null;
    linkedEntityType?: CollaborationEntityType | null;
    linkedEntityId?: string | null;
}

export interface ActivityEvent extends CollaborationRecord<'logged'> {
    action: ActivityAction;
    entityType: CollaborationEntityType;
    entityId: string;
    actorId: string;
    actorName: string;
    message: string;
    occurredAt: string;
}

export interface PresenceState extends CollaborationRecord<PresenceStatus> {
    userId: string;
    userName: string;
    surface: ProjectSurface;
    objectType?: CollaborationEntityType | null;
    objectId?: string | null;
    lastSeenAt: string;
}

export interface ProjectHubData {
    brief: ProjectBrief;
    cards: CollaborationCard[];
    sessions: ProjectSession[];
    decisions: DecisionLogEntry[];
    artifacts: ProjectArtifact[];
    threads: CommentThread[];
    tasks: TaskItem[];
    activity: ActivityEvent[];
    presence: PresenceState[];
}

export interface WorkspaceReviewItem {
    id: string;
    projectId: string;
    projectName: string;
    title: string;
    type: 'card' | 'artifact' | 'decision';
    stage?: StageId | null;
    ownerName?: string | null;
    updatedAt: string;
}

export interface WorkspaceSessionDigest {
    id: string;
    projectId: string;
    projectName: string;
    title: string;
    scheduledAt: string;
    facilitatorName?: string | null;
    status: ProjectSessionStatus;
}

export interface WorkspaceTaskDigest {
    id: string;
    projectId: string;
    projectName: string;
    title: string;
    status: TaskStatus;
    dueDate?: string | null;
    ownerId?: string | null;
}

export interface WorkspaceActivityDigest {
    id: string;
    projectId: string;
    projectName: string;
    action: ActivityAction;
    entityType: CollaborationEntityType;
    actorName: string;
    message: string;
    occurredAt: string;
}

export interface WorkspaceCollaborationOverview {
    needsReview: WorkspaceReviewItem[];
    upcomingSessions: WorkspaceSessionDigest[];
    assignedTasks: WorkspaceTaskDigest[];
    recentActivity: WorkspaceActivityDigest[];
}

export type PermissionLevel = 'owner' | 'edit' | 'view';
export type MembershipTier = 'free' | 'plus' | 'ultra' | 'business';
export type BillingCycle = 'monthly' | 'yearly';
export type WorkspaceNotificationType = 'project-invite' | 'project-dissolved';
export type OnboardingStepId =
    | 'dashboard-summary'
    | 'dashboard-create'
    | 'dashboard-open'
    | 'hub'
    | 'overview'
    | 'explore-home'
    | 'explore-card'
    | 'card-pages'
    | 'card-ai';
export type GuideFlowVariant = 'new-user' | 'existing-user';

export interface GuidePreferences {
    onboardingSeenAt?: string | null;
    lastLearningCenterVisitAt?: string | null;
    methodCardLayout?: MethodCardLayout | null;
    helpTooltipsEnabled?: boolean | null;
}

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
    currentStage?: StageId;
    nextSessionAt?: string | null;
    openTasksCount?: number;
    pendingReviewCount?: number;
    unresolvedThreadsCount?: number;
    lastActivityAt?: string | null;
    members: TeamMember[];
    pendingInvites?: ProjectInvite[];
}

export interface WorkspaceNotification {
    id: string;
    type: WorkspaceNotificationType;
    title: string;
    message: string;
    createdAt: string;
    projectId?: string | null;
    projectName?: string | null;
    inviteId?: string | null;
    readAt?: string | null;
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
    guidePreferences?: GuidePreferences;
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

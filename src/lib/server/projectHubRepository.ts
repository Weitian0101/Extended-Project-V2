import {
    appendActivityEvent,
    buildWorkspaceCollaborationOverview,
    createEmptyProjectHubData,
    getProjectHubMetrics
} from '@/lib/collaboration';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
    ActivityEvent,
    CollaborationCard,
    CollaborationMetadata,
    CommentThread,
    DecisionLogEntry,
    PermissionLevel,
    PresenceState,
    ProjectArtifact,
    ProjectBrief,
    ProjectHubData,
    ProjectSession,
    ProjectSurface,
    TaskItem,
    WorkspaceProject
} from '@/types';

type HubCollectionResource = 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks' | 'activity' | 'presence';

interface AuthenticatedActor {
    id: string;
    name: string;
    email: string;
    permission: PermissionLevel;
}

interface ProjectBriefRow {
    id: string;
    background: string;
    objectives: string;
    assumptions: string;
    success_metrics: string;
    milestones: string;
    team_roles: string;
    working_norms: string;
    key_links: string;
    brief_version: number;
    updated_at: string;
    owner_id: string;
    brief_metadata?: CollaborationMetadata | null;
}

interface ResourceRowBase<TStatus extends string> {
    id: string;
    project_id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
    version: number;
    status: TStatus;
    metadata: CollaborationMetadata | null;
}

interface ProjectCardRow extends ResourceRowBase<CollaborationCard['status']> {
    title: string;
    summary: string;
    type: CollaborationCard['type'];
    stage: CollaborationCard['stage'];
    owner_id: string | null;
    due_date: string | null;
    linked_run_id: string | null;
    linked_decision_id: string | null;
    linked_task_id: string | null;
}

interface ProjectArtifactRow extends ResourceRowBase<ProjectArtifact['status']> {
    title: string;
    summary: string;
    type: ProjectArtifact['type'];
    stage: ProjectArtifact['stage'];
    owner_id: string | null;
    pinned: boolean;
    version_label: string;
    linked_run_id: string | null;
    linked_card_id: string | null;
    linked_decision_id: string | null;
}

interface ProjectSessionRow extends ResourceRowBase<ProjectSession['status']> {
    title: string;
    agenda: string;
    goal: string;
    participants: string;
    facilitator_id: string | null;
    note_taker_id: string | null;
    scheduled_at: string | null;
    pre_read: string;
    output_summary: string;
    follow_ups: string;
}

interface ProjectDecisionRow extends ResourceRowBase<DecisionLogEntry['status']> {
    title: string;
    background: string;
    options: string;
    decision: string;
    rationale: string;
    impact: string;
    owner_id: string | null;
    decision_date: string | null;
    review_date: string | null;
}

interface ProjectThreadRow extends ResourceRowBase<CommentThread['status']> {
    entity_type: CommentThread['entityType'];
    entity_id: string;
    title: string;
    body: string;
    owner_id: string | null;
    next_step: string;
    mentions: string[] | null;
}

interface ProjectTaskRow extends ResourceRowBase<TaskItem['status']> {
    title: string;
    details: string;
    owner_id: string | null;
    due_date: string | null;
    stage: TaskItem['stage'];
    linked_entity_type: TaskItem['linkedEntityType'];
    linked_entity_id: string | null;
}

interface ProjectActivityRow extends ResourceRowBase<ActivityEvent['status']> {
    action: ActivityEvent['action'];
    entity_type: ActivityEvent['entityType'];
    entity_id: string;
    actor_id: string;
    actor_name: string;
    message: string;
    occurred_at: string;
}

interface ProjectPresenceRow extends ResourceRowBase<PresenceState['status']> {
    user_id: string;
    user_name: string;
    surface: ProjectSurface;
    object_type: PresenceState['objectType'];
    object_id: string | null;
    last_seen_at: string;
}

const RESOURCE_SELECTS: Record<Exclude<HubCollectionResource, 'activity' | 'presence'>, string> = {
    cards: 'id, project_id, title, summary, type, stage, owner_id, due_date, linked_run_id, linked_decision_id, linked_task_id, created_by, updated_by, status, metadata, version, created_at, updated_at',
    artifacts: 'id, project_id, title, summary, type, stage, owner_id, pinned, version_label, linked_run_id, linked_card_id, linked_decision_id, created_by, updated_by, status, metadata, version, created_at, updated_at',
    sessions: 'id, project_id, title, agenda, goal, participants, facilitator_id, note_taker_id, scheduled_at, pre_read, output_summary, follow_ups, created_by, updated_by, status, metadata, version, created_at, updated_at',
    decisions: 'id, project_id, title, background, options, decision, rationale, impact, owner_id, decision_date, review_date, created_by, updated_by, status, metadata, version, created_at, updated_at',
    threads: 'id, project_id, entity_type, entity_id, title, body, owner_id, next_step, mentions, created_by, updated_by, status, metadata, version, created_at, updated_at',
    tasks: 'id, project_id, title, details, owner_id, due_date, stage, linked_entity_type, linked_entity_id, created_by, updated_by, status, metadata, version, created_at, updated_at'
};

const ACTIVITY_SELECT = 'id, project_id, action, entity_type, entity_id, actor_id, actor_name, message, occurred_at, created_by, updated_by, status, metadata, version, created_at, updated_at';
const PRESENCE_SELECT = 'id, project_id, user_id, user_name, surface, object_type, object_id, last_seen_at, created_by, updated_by, status, metadata, version, created_at, updated_at';
const PROJECT_BRIEF_SELECT = 'id, background, objectives, assumptions, success_metrics, milestones, team_roles, working_norms, key_links, brief_version, updated_at, owner_id, brief_metadata';
const PROJECT_BRIEF_SELECT_LEGACY = 'id, background, objectives, assumptions, success_metrics, milestones, team_roles, working_norms, key_links, brief_version, updated_at, owner_id';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function getNullableString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value : null;
}

function getBoolean(value: unknown, fallback = false) {
    return typeof value === 'boolean' ? value : fallback;
}

function getNumber(value: unknown, fallback = 1) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getStringArray(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getMetadata(value: unknown): CollaborationMetadata {
    if (!isRecord(value)) {
        return {};
    }

    const entries = Object.entries(value).filter(([, entry]) => (
        typeof entry === 'string'
        || typeof entry === 'number'
        || typeof entry === 'boolean'
        || entry === null
    ));

    return Object.fromEntries(entries) as CollaborationMetadata;
}

function getSupabaseErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

function isMissingBriefMetadataColumn(error: unknown) {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const message = 'message' in error ? String((error as { message?: unknown }).message || '') : '';
    const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
    return code === '42703' || message.includes('brief_metadata');
}

async function getAuthenticatedActor(projectId: string, minimumPermission: 'member' | PermissionLevel): Promise<AuthenticatedActor> {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
        throw new Error('Unauthenticated');
    }

    const userId = authData.user.id;
    const { data: membershipData, error: membershipError } = await supabase
        .from('project_members')
        .select('permission')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();
    const membership = membershipData as { permission: PermissionLevel } | null;

    if (membershipError || !membership) {
        throw new Error('Forbidden');
    }

    const allowedPermissions = minimumPermission === 'member'
        ? ['owner', 'edit', 'view']
        : minimumPermission === 'owner'
            ? ['owner']
            : ['owner', 'edit'];

    if (!allowedPermissions.includes(membership.permission)) {
        throw new Error('Forbidden');
    }

    const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .maybeSingle();
    const profile = profileData as { full_name: string | null; email: string | null } | null;

    return {
        id: userId,
        name: profile?.full_name || authData.user.user_metadata.full_name || authData.user.email?.split('@')[0] || 'User',
        email: profile?.email || authData.user.email || '',
        permission: membership.permission
    };
}

function hasProjectEditPermission(permission: PermissionLevel) {
    return permission === 'owner' || permission === 'edit';
}

function getTodoScopeFromMetadata(metadata: CollaborationMetadata) {
    const value = metadata.todoScope;
    return value === 'personal' || value === 'global' ? value : 'none';
}

function canActorViewTask(task: { owner_id: string | null; created_by: string; metadata: CollaborationMetadata | null }, actorId: string) {
    const todoScope = getTodoScopeFromMetadata(task.metadata || {});
    if (todoScope !== 'personal') {
        return true;
    }

    return task.owner_id === actorId || task.created_by === actorId;
}

async function getTaskActorForCreate(projectId: string, raw: unknown) {
    const actor = await getAuthenticatedActor(projectId, 'member');
    const body = isRecord(raw) ? raw : {};
    const todoScope = getTodoScopeFromMetadata(getMetadata(body.metadata));

    if (todoScope === 'personal' || hasProjectEditPermission(actor.permission)) {
        return actor;
    }

    throw new Error('Forbidden');
}

async function getTaskActorForExistingTask(projectId: string, recordId: string) {
    const actor = await getAuthenticatedActor(projectId, 'member');
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('project_tasks')
        .select('owner_id, created_by, metadata')
        .eq('project_id', projectId)
        .eq('id', recordId)
        .maybeSingle();
    const task = data as { owner_id: string | null; created_by: string; metadata: CollaborationMetadata | null } | null;

    if (error || !task) {
        throw new Error('Forbidden');
    }

    const todoScope = getTodoScopeFromMetadata(task.metadata || {});
    const isTaskOwner = task.owner_id === actor.id || task.created_by === actor.id;

    if (todoScope === 'personal') {
        if (isTaskOwner || hasProjectEditPermission(actor.permission)) {
            return actor;
        }

        throw new Error('Forbidden');
    }

    if (!hasProjectEditPermission(actor.permission)) {
        throw new Error('Forbidden');
    }

    return actor;
}

function mapBrief(projectRow: ProjectBriefRow): ProjectBrief {
    return {
        projectId: projectRow.id,
        background: projectRow.background || '',
        objectives: projectRow.objectives || '',
        assumptions: projectRow.assumptions || '',
        successMetrics: projectRow.success_metrics || '',
        milestones: projectRow.milestones || '',
        teamRoles: projectRow.team_roles || '',
        workingNorms: projectRow.working_norms || '',
        keyLinks: projectRow.key_links || '',
        version: projectRow.brief_version || 1,
        updatedAt: projectRow.updated_at,
        updatedBy: projectRow.owner_id,
        metadata: projectRow.brief_metadata || {}
    };
}

function mapCard(row: ProjectCardRow): CollaborationCard {
    return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        summary: row.summary,
        type: row.type,
        stage: row.stage,
        ownerId: row.owner_id,
        dueDate: row.due_date,
        linkedRunId: row.linked_run_id,
        linkedDecisionId: row.linked_decision_id,
        linkedTaskId: row.linked_task_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        version: row.version,
        status: row.status,
        metadata: row.metadata || {}
    };
}

function mapArtifact(row: ProjectArtifactRow): ProjectArtifact {
    return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        summary: row.summary,
        type: row.type,
        stage: row.stage,
        ownerId: row.owner_id,
        pinned: row.pinned,
        versionLabel: row.version_label,
        linkedRunId: row.linked_run_id,
        linkedCardId: row.linked_card_id,
        linkedDecisionId: row.linked_decision_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        version: row.version,
        status: row.status,
        metadata: row.metadata || {}
    };
}

function mapSession(row: ProjectSessionRow): ProjectSession {
    return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        agenda: row.agenda,
        goal: row.goal,
        participants: row.participants,
        facilitatorId: row.facilitator_id,
        noteTakerId: row.note_taker_id,
        scheduledAt: row.scheduled_at,
        preRead: row.pre_read,
        outputSummary: row.output_summary,
        followUps: row.follow_ups,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        version: row.version,
        status: row.status,
        metadata: row.metadata || {}
    };
}

function mapDecision(row: ProjectDecisionRow): DecisionLogEntry {
    return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        background: row.background,
        options: row.options,
        decision: row.decision,
        rationale: row.rationale,
        impact: row.impact,
        ownerId: row.owner_id,
        decisionDate: row.decision_date,
        reviewDate: row.review_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        version: row.version,
        status: row.status,
        metadata: row.metadata || {}
    };
}

function mapThread(row: ProjectThreadRow): CommentThread {
    return {
        id: row.id,
        projectId: row.project_id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        title: row.title,
        body: row.body,
        ownerId: row.owner_id,
        nextStep: row.next_step,
        mentions: row.mentions || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        version: row.version,
        status: row.status,
        metadata: row.metadata || {}
    };
}

function mapTask(row: ProjectTaskRow): TaskItem {
    return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        details: row.details,
        ownerId: row.owner_id,
        dueDate: row.due_date,
        stage: row.stage,
        linkedEntityType: row.linked_entity_type,
        linkedEntityId: row.linked_entity_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        version: row.version,
        status: row.status,
        metadata: row.metadata || {}
    };
}

function mapActivity(row: ProjectActivityRow): ActivityEvent {
    return {
        id: row.id,
        projectId: row.project_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        actorId: row.actor_id,
        actorName: row.actor_name,
        message: row.message,
        occurredAt: row.occurred_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        version: row.version,
        status: row.status,
        metadata: row.metadata || {}
    };
}

function mapPresence(row: ProjectPresenceRow): PresenceState {
    return {
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        userName: row.user_name,
        surface: row.surface,
        objectType: row.object_type,
        objectId: row.object_id,
        lastSeenAt: row.last_seen_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        version: row.version,
        status: row.status,
        metadata: row.metadata || {}
    };
}

async function insertActivityEvent(projectId: string, actor: AuthenticatedActor, input: {
    action: ActivityEvent['action'];
    entityType: ActivityEvent['entityType'];
    entityId: string;
    message: string;
}) {
    const supabase = await createSupabaseServerClient();
    const payload = appendActivityEvent([], {
        projectId,
        actorId: actor.id,
        actorName: actor.name,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        message: input.message
    })[0];

    const { error } = await supabase
        .from('project_activity_events')
        .insert({
            id: payload.id,
            project_id: projectId,
            action: payload.action,
            entity_type: payload.entityType,
            entity_id: payload.entityId,
            actor_id: actor.id,
            actor_name: actor.name,
            message: payload.message,
            occurred_at: payload.occurredAt,
            created_by: actor.id,
            updated_by: actor.id,
            status: payload.status,
            metadata: payload.metadata,
            version: 1,
            created_at: payload.createdAt,
            updated_at: payload.updatedAt
        });

    if (error) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to write activity log.'));
    }
}

export async function getProjectHub(projectId: string): Promise<ProjectHubData> {
    const actor = await getAuthenticatedActor(projectId, 'member');
    const supabase = await createSupabaseServerClient();

    let projectResponse = await supabase
        .from('projects')
        .select(PROJECT_BRIEF_SELECT)
        .eq('id', projectId)
        .single();

    const [
        cardsResponse,
        artifactsResponse,
        sessionsResponse,
        decisionsResponse,
        threadsResponse,
        tasksResponse,
        activityResponse,
        presenceResponse
    ] = await Promise.all([
        supabase.from('project_cards').select(RESOURCE_SELECTS.cards).eq('project_id', projectId).order('updated_at', { ascending: false }),
        supabase.from('project_artifacts').select(RESOURCE_SELECTS.artifacts).eq('project_id', projectId).order('updated_at', { ascending: false }),
        supabase.from('project_sessions').select(RESOURCE_SELECTS.sessions).eq('project_id', projectId).order('scheduled_at', { ascending: true }),
        supabase.from('project_decisions').select(RESOURCE_SELECTS.decisions).eq('project_id', projectId).order('updated_at', { ascending: false }),
        supabase.from('project_threads').select(RESOURCE_SELECTS.threads).eq('project_id', projectId).order('updated_at', { ascending: false }),
        supabase.from('project_tasks').select(RESOURCE_SELECTS.tasks).eq('project_id', projectId).order('updated_at', { ascending: false }),
        supabase.from('project_activity_events').select(ACTIVITY_SELECT).eq('project_id', projectId).order('occurred_at', { ascending: false }).limit(25),
        supabase.from('project_presence').select(PRESENCE_SELECT).eq('project_id', projectId).order('last_seen_at', { ascending: false })
    ]);

    if (isMissingBriefMetadataColumn(projectResponse.error)) {
        projectResponse = await supabase
            .from('projects')
            .select(PROJECT_BRIEF_SELECT_LEGACY)
            .eq('id', projectId)
            .single();
    }

    if (projectResponse.error || !projectResponse.data) {
        throw new Error(getSupabaseErrorMessage(projectResponse.error, 'Unable to load project brief.'));
    }

    const projectRow = projectResponse.data as ProjectBriefRow;

    const fallback = createEmptyProjectHubData({
        projectId,
        updatedBy: projectRow.owner_id,
        context: {
            background: projectRow.background,
            objectives: projectRow.objectives,
            assumptions: projectRow.assumptions
        },
        briefDetails: {
            successMetrics: projectRow.success_metrics,
            milestones: projectRow.milestones,
            teamRoles: projectRow.team_roles,
            workingNorms: projectRow.working_norms,
            keyLinks: projectRow.key_links
        }
    });

    const visibleTaskRows = ((tasksResponse.data as ProjectTaskRow[] | null) || []).filter((task) =>
        canActorViewTask(task, actor.id)
    );
    const visibleTaskIds = new Set(visibleTaskRows.map((task) => task.id));
    const visibleActivityRows = ((activityResponse.data as ProjectActivityRow[] | null) || []).filter((item) => (
        item.entity_type !== 'task' || visibleTaskIds.has(item.entity_id)
    ));

    return {
        brief: mapBrief(projectRow),
        cards: (cardsResponse.data as ProjectCardRow[] | null)?.map(mapCard) || fallback.cards,
        artifacts: (artifactsResponse.data as ProjectArtifactRow[] | null)?.map(mapArtifact) || fallback.artifacts,
        sessions: (sessionsResponse.data as ProjectSessionRow[] | null)?.map(mapSession) || fallback.sessions,
        decisions: (decisionsResponse.data as ProjectDecisionRow[] | null)?.map(mapDecision) || fallback.decisions,
        threads: (threadsResponse.data as ProjectThreadRow[] | null)?.map(mapThread) || fallback.threads,
        tasks: visibleTaskRows.map(mapTask),
        activity: visibleActivityRows.map(mapActivity),
        presence: (presenceResponse.data as ProjectPresenceRow[] | null)?.map(mapPresence) || fallback.presence
    };
}

export async function updateProjectHubBrief(projectId: string, raw: unknown): Promise<ProjectBrief> {
    const actor = await getAuthenticatedActor(projectId, 'edit');
    if (!isRecord(raw)) {
        throw new Error('Invalid brief payload.');
    }

    const version = getNumber(raw.version, 1);
    const supabase = await createSupabaseServerClient();
    const briefPayload = {
        background: getString(raw.background),
        objectives: getString(raw.objectives),
        assumptions: getString(raw.assumptions),
        success_metrics: getString(raw.successMetrics),
        milestones: getString(raw.milestones),
        team_roles: getString(raw.teamRoles),
        working_norms: getString(raw.workingNorms),
        key_links: getString(raw.keyLinks),
        brief_version: version + 1
    };
    let { data, error } = await supabase
        .from('projects')
        .update({
            ...briefPayload,
            brief_metadata: getMetadata(raw.metadata)
        })
        .eq('id', projectId)
        .eq('brief_version', version)
        .select(PROJECT_BRIEF_SELECT)
        .maybeSingle();

    if (isMissingBriefMetadataColumn(error)) {
        ({ data, error } = await supabase
            .from('projects')
            .update(briefPayload)
            .eq('id', projectId)
            .eq('brief_version', version)
            .select(PROJECT_BRIEF_SELECT_LEGACY)
            .maybeSingle());
    }
    const row = data as ProjectBriefRow | null;

    if (error) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to save project brief.'));
    }

    if (!row) {
        throw new Error('Conflict: the brief changed before your save completed.');
    }

    await insertActivityEvent(projectId, actor, {
        action: 'updated',
        entityType: 'brief',
        entityId: projectId,
        message: 'Updated the project brief.'
    });

    return mapBrief(row);
}

function getCollectionTable(resource: Exclude<HubCollectionResource, 'activity' | 'presence'>) {
    return `project_${resource}` as const;
}

export async function listProjectHubCollection(projectId: string, resource: HubCollectionResource): Promise<ProjectHubData[HubCollectionResource]> {
    const snapshot = await getProjectHub(projectId);
    return snapshot[resource];
}

async function createCard(projectId: string, raw: unknown, actor: AuthenticatedActor) {
    const supabase = await createSupabaseServerClient();
    const body = isRecord(raw) ? raw : {};
    const payload = {
        project_id: projectId,
        title: getString(body.title, 'Untitled card'),
        summary: getString(body.summary),
        type: getString(body.type, 'idea'),
        stage: getNullableString(body.stage),
        owner_id: getNullableString(body.ownerId),
        due_date: getNullableString(body.dueDate),
        linked_run_id: getNullableString(body.linkedRunId),
        linked_decision_id: getNullableString(body.linkedDecisionId),
        linked_task_id: getNullableString(body.linkedTaskId),
        created_by: actor.id,
        updated_by: actor.id,
        status: getString(body.status, 'open-questions'),
        metadata: getMetadata(body.metadata)
    };

    const { data, error } = await supabase
        .from('project_cards')
        .insert(payload)
        .select(RESOURCE_SELECTS.cards)
        .single();
    const row = data as ProjectCardRow | null;

    if (error || !row) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to create card.'));
    }

    await insertActivityEvent(projectId, actor, {
        action: 'created',
        entityType: 'card',
        entityId: row.id,
        message: `Created board card "${row.title}".`
    });

    return mapCard(row);
}

async function createArtifact(projectId: string, raw: unknown, actor: AuthenticatedActor) {
    const supabase = await createSupabaseServerClient();
    const body = isRecord(raw) ? raw : {};
    const payload = {
        project_id: projectId,
        title: getString(body.title, 'Untitled artifact'),
        summary: getString(body.summary),
        type: getString(body.type, 'concept'),
        stage: getNullableString(body.stage),
        owner_id: getNullableString(body.ownerId),
        pinned: getBoolean(body.pinned),
        version_label: getString(body.versionLabel, 'v1'),
        linked_run_id: getNullableString(body.linkedRunId),
        linked_card_id: getNullableString(body.linkedCardId),
        linked_decision_id: getNullableString(body.linkedDecisionId),
        created_by: actor.id,
        updated_by: actor.id,
        status: getString(body.status, 'draft'),
        metadata: getMetadata(body.metadata)
    };

    const { data, error } = await supabase
        .from('project_artifacts')
        .insert(payload)
        .select(RESOURCE_SELECTS.artifacts)
        .single();
    const row = data as ProjectArtifactRow | null;

    if (error || !row) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to create artifact.'));
    }

    await insertActivityEvent(projectId, actor, {
        action: 'captured',
        entityType: 'artifact',
        entityId: row.id,
        message: `Captured artifact "${row.title}".`
    });

    return mapArtifact(row);
}

async function createSession(projectId: string, raw: unknown, actor: AuthenticatedActor) {
    const supabase = await createSupabaseServerClient();
    const body = isRecord(raw) ? raw : {};
    const payload = {
        project_id: projectId,
        title: getString(body.title, 'New session'),
        agenda: getString(body.agenda),
        goal: getString(body.goal),
        participants: getString(body.participants),
        facilitator_id: getNullableString(body.facilitatorId),
        note_taker_id: getNullableString(body.noteTakerId),
        scheduled_at: getNullableString(body.scheduledAt),
        pre_read: getString(body.preRead),
        output_summary: getString(body.outputSummary),
        follow_ups: getString(body.followUps),
        created_by: actor.id,
        updated_by: actor.id,
        status: getString(body.status, 'planned'),
        metadata: getMetadata(body.metadata)
    };

    const { data, error } = await supabase
        .from('project_sessions')
        .insert(payload)
        .select(RESOURCE_SELECTS.sessions)
        .single();
    const row = data as ProjectSessionRow | null;

    if (error || !row) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to create session.'));
    }

    await insertActivityEvent(projectId, actor, {
        action: 'scheduled',
        entityType: 'session',
        entityId: row.id,
        message: `Scheduled session "${row.title}".`
    });

    return mapSession(row);
}

async function createDecision(projectId: string, raw: unknown, actor: AuthenticatedActor) {
    const supabase = await createSupabaseServerClient();
    const body = isRecord(raw) ? raw : {};
    const payload = {
        project_id: projectId,
        title: getString(body.title, 'Decision to review'),
        background: getString(body.background),
        options: getString(body.options),
        decision: getString(body.decision),
        rationale: getString(body.rationale),
        impact: getString(body.impact),
        owner_id: getNullableString(body.ownerId),
        decision_date: getNullableString(body.decisionDate),
        review_date: getNullableString(body.reviewDate),
        created_by: actor.id,
        updated_by: actor.id,
        status: getString(body.status, 'proposed'),
        metadata: getMetadata(body.metadata)
    };

    const { data, error } = await supabase
        .from('project_decisions')
        .insert(payload)
        .select(RESOURCE_SELECTS.decisions)
        .single();
    const row = data as ProjectDecisionRow | null;

    if (error || !row) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to create decision.'));
    }

    await insertActivityEvent(projectId, actor, {
        action: 'created',
        entityType: 'decision',
        entityId: row.id,
        message: `Logged decision "${row.title}".`
    });

    return mapDecision(row);
}

async function createThread(projectId: string, raw: unknown, actor: AuthenticatedActor) {
    const supabase = await createSupabaseServerClient();
    const body = isRecord(raw) ? raw : {};
    const payload = {
        project_id: projectId,
        entity_type: getString(body.entityType, 'tool-run'),
        entity_id: getString(body.entityId, projectId),
        title: getString(body.title, 'Discussion'),
        body: getString(body.body),
        owner_id: getNullableString(body.ownerId),
        next_step: getString(body.nextStep),
        mentions: getStringArray(body.mentions),
        created_by: actor.id,
        updated_by: actor.id,
        status: getString(body.status, 'open'),
        metadata: getMetadata(body.metadata)
    };

    const { data, error } = await supabase
        .from('project_threads')
        .insert(payload)
        .select(RESOURCE_SELECTS.threads)
        .single();
    const row = data as ProjectThreadRow | null;

    if (error || !row) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to create comment thread.'));
    }

    await insertActivityEvent(projectId, actor, {
        action: 'commented',
        entityType: 'task',
        entityId: row.id,
        message: `Started discussion "${row.title}".`
    });

    return mapThread(row);
}

async function createTask(projectId: string, raw: unknown, actor: AuthenticatedActor) {
    const supabase = await createSupabaseServerClient();
    const body = isRecord(raw) ? raw : {};
    const metadata = getMetadata(body.metadata);
    const todoScope = getTodoScopeFromMetadata(metadata);
    const payload = {
        project_id: projectId,
        title: getString(body.title, 'New task'),
        details: getString(body.details),
        owner_id: getNullableString(body.ownerId) || (todoScope === 'personal' ? actor.id : null),
        due_date: getNullableString(body.dueDate),
        stage: getNullableString(body.stage),
        linked_entity_type: getNullableString(body.linkedEntityType),
        linked_entity_id: getNullableString(body.linkedEntityId),
        created_by: actor.id,
        updated_by: actor.id,
        status: getString(body.status, 'open'),
        metadata
    };

    const { data, error } = await supabase
        .from('project_tasks')
        .insert(payload)
        .select(RESOURCE_SELECTS.tasks)
        .single();
    const row = data as ProjectTaskRow | null;

    if (error || !row) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to create task.'));
    }

    await insertActivityEvent(projectId, actor, {
        action: 'assigned',
        entityType: 'task',
        entityId: row.id,
        message: `Created task "${row.title}".`
    });

    return mapTask(row);
}

async function createPresence(projectId: string, raw: unknown, actor: AuthenticatedActor) {
    const supabase = await createSupabaseServerClient();
    const body = isRecord(raw) ? raw : {};
    const now = new Date().toISOString();
    const payload = {
        project_id: projectId,
        user_id: actor.id,
        user_name: actor.name,
        surface: getString(body.surface, 'hub'),
        object_type: getNullableString(body.objectType),
        object_id: getNullableString(body.objectId),
        last_seen_at: now,
        created_by: actor.id,
        updated_by: actor.id,
        status: getString(body.status, 'online'),
        metadata: getMetadata(body.metadata)
    };

    const { data, error } = await supabase
        .from('project_presence')
        .upsert(payload, { onConflict: 'project_id,user_id' })
        .select(PRESENCE_SELECT)
        .single();

    if (error || !data) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to update presence.'));
    }

    return mapPresence(data as ProjectPresenceRow);
}

export async function createProjectHubCollectionRecord(projectId: string, resource: HubCollectionResource, raw: unknown) {
    const actor = resource === 'tasks'
        ? await getTaskActorForCreate(projectId, raw)
        : await getAuthenticatedActor(projectId, resource === 'threads' || resource === 'presence' ? 'member' : 'edit');

    switch (resource) {
        case 'cards':
            return createCard(projectId, raw, actor);
        case 'artifacts':
            return createArtifact(projectId, raw, actor);
        case 'sessions':
            return createSession(projectId, raw, actor);
        case 'decisions':
            return createDecision(projectId, raw, actor);
        case 'threads':
            return createThread(projectId, raw, actor);
        case 'tasks':
            return createTask(projectId, raw, actor);
        case 'presence':
            return createPresence(projectId, raw, actor);
        case 'activity':
            throw new Error('Activity events are system generated.');
        default:
            throw new Error('Unsupported project collaboration resource.');
    }
}

async function updateRecord<T>(
    table: string,
    select: string,
    projectId: string,
    recordId: string,
    version: number,
    payload: Record<string, unknown>
) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('project_id', projectId)
        .eq('id', recordId)
        .eq('version', version)
        .select(select)
        .maybeSingle();

    if (error) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to update collaboration record.'));
    }

    if (!data) {
        throw new Error('Conflict: this record changed before your save completed.');
    }

    return data as T;
}

export async function updateProjectHubCollectionRecord(projectId: string, resource: Exclude<HubCollectionResource, 'activity'>, recordId: string, raw: unknown) {
    const actor = resource === 'tasks'
        ? await getTaskActorForExistingTask(projectId, recordId)
        : await getAuthenticatedActor(projectId, resource === 'threads' || resource === 'presence' ? 'member' : 'edit');
    const body = isRecord(raw) ? raw : {};
    const version = getNumber(body.version, 1);

    switch (resource) {
        case 'cards': {
            const row = await updateRecord<ProjectCardRow>('project_cards', RESOURCE_SELECTS.cards, projectId, recordId, version, {
                title: getString(body.title),
                summary: getString(body.summary),
                type: getString(body.type),
                stage: getNullableString(body.stage),
                owner_id: getNullableString(body.ownerId),
                due_date: getNullableString(body.dueDate),
                linked_run_id: getNullableString(body.linkedRunId),
                linked_decision_id: getNullableString(body.linkedDecisionId),
                linked_task_id: getNullableString(body.linkedTaskId),
                status: getString(body.status),
                updated_by: actor.id,
                metadata: getMetadata(body.metadata)
            });
            await insertActivityEvent(projectId, actor, {
                action: 'updated',
                entityType: 'card',
                entityId: row.id,
                message: `Updated card "${row.title}".`
            });
            return mapCard(row);
        }
        case 'artifacts': {
            const row = await updateRecord<ProjectArtifactRow>('project_artifacts', RESOURCE_SELECTS.artifacts, projectId, recordId, version, {
                title: getString(body.title),
                summary: getString(body.summary),
                type: getString(body.type),
                stage: getNullableString(body.stage),
                owner_id: getNullableString(body.ownerId),
                pinned: getBoolean(body.pinned),
                version_label: getString(body.versionLabel),
                linked_run_id: getNullableString(body.linkedRunId),
                linked_card_id: getNullableString(body.linkedCardId),
                linked_decision_id: getNullableString(body.linkedDecisionId),
                status: getString(body.status),
                updated_by: actor.id,
                metadata: getMetadata(body.metadata)
            });
            await insertActivityEvent(projectId, actor, {
                action: row.status === 'approved' ? 'approved' : 'updated',
                entityType: 'artifact',
                entityId: row.id,
                message: `Updated artifact "${row.title}".`
            });
            return mapArtifact(row);
        }
        case 'sessions': {
            const row = await updateRecord<ProjectSessionRow>('project_sessions', RESOURCE_SELECTS.sessions, projectId, recordId, version, {
                title: getString(body.title),
                agenda: getString(body.agenda),
                goal: getString(body.goal),
                participants: getString(body.participants),
                facilitator_id: getNullableString(body.facilitatorId),
                note_taker_id: getNullableString(body.noteTakerId),
                scheduled_at: getNullableString(body.scheduledAt),
                pre_read: getString(body.preRead),
                output_summary: getString(body.outputSummary),
                follow_ups: getString(body.followUps),
                status: getString(body.status),
                updated_by: actor.id,
                metadata: getMetadata(body.metadata)
            });
            await insertActivityEvent(projectId, actor, {
                action: 'scheduled',
                entityType: 'session',
                entityId: row.id,
                message: `Updated session "${row.title}".`
            });
            return mapSession(row);
        }
        case 'decisions': {
            const row = await updateRecord<ProjectDecisionRow>('project_decisions', RESOURCE_SELECTS.decisions, projectId, recordId, version, {
                title: getString(body.title),
                background: getString(body.background),
                options: getString(body.options),
                decision: getString(body.decision),
                rationale: getString(body.rationale),
                impact: getString(body.impact),
                owner_id: getNullableString(body.ownerId),
                decision_date: getNullableString(body.decisionDate),
                review_date: getNullableString(body.reviewDate),
                status: getString(body.status),
                updated_by: actor.id,
                metadata: getMetadata(body.metadata)
            });
            await insertActivityEvent(projectId, actor, {
                action: row.status === 'decided' ? 'approved' : 'updated',
                entityType: 'decision',
                entityId: row.id,
                message: `Updated decision "${row.title}".`
            });
            return mapDecision(row);
        }
        case 'threads': {
            const row = await updateRecord<ProjectThreadRow>('project_threads', RESOURCE_SELECTS.threads, projectId, recordId, version, {
                title: getString(body.title),
                body: getString(body.body),
                owner_id: getNullableString(body.ownerId),
                next_step: getString(body.nextStep),
                mentions: getStringArray(body.mentions),
                status: getString(body.status),
                updated_by: actor.id,
                metadata: getMetadata(body.metadata)
            });
            await insertActivityEvent(projectId, actor, {
                action: row.status === 'resolved' ? 'resolved' : 'commented',
                entityType: 'task',
                entityId: row.id,
                message: `Updated discussion "${row.title}".`
            });
            return mapThread(row);
        }
        case 'tasks': {
            const row = await updateRecord<ProjectTaskRow>('project_tasks', RESOURCE_SELECTS.tasks, projectId, recordId, version, {
                title: getString(body.title),
                details: getString(body.details),
                owner_id: getNullableString(body.ownerId),
                due_date: getNullableString(body.dueDate),
                stage: getNullableString(body.stage),
                linked_entity_type: getNullableString(body.linkedEntityType),
                linked_entity_id: getNullableString(body.linkedEntityId),
                status: getString(body.status),
                updated_by: actor.id,
                metadata: getMetadata(body.metadata)
            });
            await insertActivityEvent(projectId, actor, {
                action: row.status === 'done' ? 'approved' : 'updated',
                entityType: 'task',
                entityId: row.id,
                message: `Updated task "${row.title}".`
            });
            return mapTask(row);
        }
        case 'presence': {
            const row = await updateRecord<ProjectPresenceRow>('project_presence', PRESENCE_SELECT, projectId, recordId, version, {
                surface: getString(body.surface, 'hub'),
                object_type: getNullableString(body.objectType),
                object_id: getNullableString(body.objectId),
                last_seen_at: new Date().toISOString(),
                status: getString(body.status, 'online'),
                updated_by: actor.id,
                metadata: getMetadata(body.metadata)
            });
            return mapPresence(row);
        }
        default:
            throw new Error('Unsupported project collaboration resource.');
    }
}

export async function deleteProjectHubCollectionRecord(projectId: string, resource: Exclude<HubCollectionResource, 'activity' | 'presence'>, recordId: string) {
    const actor = resource === 'tasks'
        ? await getTaskActorForExistingTask(projectId, recordId)
        : await getAuthenticatedActor(projectId, resource === 'threads' ? 'member' : resource === 'decisions' ? 'owner' : 'edit');
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from(getCollectionTable(resource))
        .delete()
        .eq('project_id', projectId)
        .eq('id', recordId);

    if (error) {
        throw new Error(getSupabaseErrorMessage(error, 'Unable to delete collaboration record.'));
    }

    await insertActivityEvent(projectId, actor, {
        action: 'updated',
        entityType: resource === 'threads' ? 'task' : resource.slice(0, -1) as ActivityEvent['entityType'],
        entityId: recordId,
        message: `Removed ${resource.slice(0, -1)} from the project hub.`
    });

    return { ok: true };
}

export async function saveProjectHubSnapshot(projectId: string, hub: ProjectHubData) {
    const actor = await getAuthenticatedActor(projectId, 'edit');
    const supabase = await createSupabaseServerClient();
    const projectPayload = {
        background: hub.brief.background,
        objectives: hub.brief.objectives,
        assumptions: hub.brief.assumptions,
        success_metrics: hub.brief.successMetrics,
        milestones: hub.brief.milestones,
        team_roles: hub.brief.teamRoles,
        working_norms: hub.brief.workingNorms,
        key_links: hub.brief.keyLinks,
        brief_version: hub.brief.version
    };
    let { error: projectError } = await supabase
        .from('projects')
        .update({
            ...projectPayload,
            brief_metadata: hub.brief.metadata
        })
        .eq('id', projectId);

    if (isMissingBriefMetadataColumn(projectError)) {
        ({ error: projectError } = await supabase
            .from('projects')
            .update(projectPayload)
            .eq('id', projectId));
    }

    if (projectError) {
        throw new Error(getSupabaseErrorMessage(projectError, 'Unable to save project brief.'));
    }

    for (const resource of ['cards', 'artifacts', 'sessions', 'decisions', 'threads', 'tasks'] as const) {
        await supabase.from(getCollectionTable(resource)).delete().eq('project_id', projectId);
    }

    await supabase.from('project_activity_events').delete().eq('project_id', projectId);
    await supabase.from('project_presence').delete().eq('project_id', projectId);

    if (hub.cards.length) {
        await supabase.from('project_cards').insert(hub.cards.map((card) => ({
            id: card.id,
            project_id: projectId,
            title: card.title,
            summary: card.summary,
            type: card.type,
            stage: card.stage,
            owner_id: card.ownerId,
            due_date: card.dueDate,
            linked_run_id: card.linkedRunId,
            linked_decision_id: card.linkedDecisionId,
            linked_task_id: card.linkedTaskId,
            created_by: card.createdBy,
            updated_by: card.updatedBy,
            status: card.status,
            metadata: card.metadata,
            version: card.version,
            created_at: card.createdAt,
            updated_at: card.updatedAt
        })));
    }

    if (hub.artifacts.length) {
        await supabase.from('project_artifacts').insert(hub.artifacts.map((artifact) => ({
            id: artifact.id,
            project_id: projectId,
            title: artifact.title,
            summary: artifact.summary,
            type: artifact.type,
            stage: artifact.stage,
            owner_id: artifact.ownerId,
            pinned: artifact.pinned,
            version_label: artifact.versionLabel,
            linked_run_id: artifact.linkedRunId,
            linked_card_id: artifact.linkedCardId,
            linked_decision_id: artifact.linkedDecisionId,
            created_by: artifact.createdBy,
            updated_by: artifact.updatedBy,
            status: artifact.status,
            metadata: artifact.metadata,
            version: artifact.version,
            created_at: artifact.createdAt,
            updated_at: artifact.updatedAt
        })));
    }

    if (hub.sessions.length) {
        await supabase.from('project_sessions').insert(hub.sessions.map((session) => ({
            id: session.id,
            project_id: projectId,
            title: session.title,
            agenda: session.agenda,
            goal: session.goal,
            participants: session.participants,
            facilitator_id: session.facilitatorId,
            note_taker_id: session.noteTakerId,
            scheduled_at: session.scheduledAt,
            pre_read: session.preRead,
            output_summary: session.outputSummary,
            follow_ups: session.followUps,
            created_by: session.createdBy,
            updated_by: session.updatedBy,
            status: session.status,
            metadata: session.metadata,
            version: session.version,
            created_at: session.createdAt,
            updated_at: session.updatedAt
        })));
    }

    if (hub.decisions.length) {
        await supabase.from('project_decisions').insert(hub.decisions.map((decision) => ({
            id: decision.id,
            project_id: projectId,
            title: decision.title,
            background: decision.background,
            options: decision.options,
            decision: decision.decision,
            rationale: decision.rationale,
            impact: decision.impact,
            owner_id: decision.ownerId,
            decision_date: decision.decisionDate,
            review_date: decision.reviewDate,
            created_by: decision.createdBy,
            updated_by: decision.updatedBy,
            status: decision.status,
            metadata: decision.metadata,
            version: decision.version,
            created_at: decision.createdAt,
            updated_at: decision.updatedAt
        })));
    }

    if (hub.threads.length) {
        await supabase.from('project_threads').insert(hub.threads.map((thread) => ({
            id: thread.id,
            project_id: projectId,
            entity_type: thread.entityType,
            entity_id: thread.entityId,
            title: thread.title,
            body: thread.body,
            owner_id: thread.ownerId,
            next_step: thread.nextStep,
            mentions: thread.mentions,
            created_by: thread.createdBy,
            updated_by: thread.updatedBy,
            status: thread.status,
            metadata: thread.metadata,
            version: thread.version,
            created_at: thread.createdAt,
            updated_at: thread.updatedAt
        })));
    }

    if (hub.tasks.length) {
        await supabase.from('project_tasks').insert(hub.tasks.map((task) => ({
            id: task.id,
            project_id: projectId,
            title: task.title,
            details: task.details,
            owner_id: task.ownerId,
            due_date: task.dueDate,
            stage: task.stage,
            linked_entity_type: task.linkedEntityType,
            linked_entity_id: task.linkedEntityId,
            created_by: task.createdBy,
            updated_by: task.updatedBy,
            status: task.status,
            metadata: task.metadata,
            version: task.version,
            created_at: task.createdAt,
            updated_at: task.updatedAt
        })));
    }

    if (hub.activity.length) {
        await supabase.from('project_activity_events').insert(hub.activity.map((event) => ({
            id: event.id,
            project_id: projectId,
            action: event.action,
            entity_type: event.entityType,
            entity_id: event.entityId,
            actor_id: event.actorId,
            actor_name: event.actorName,
            message: event.message,
            occurred_at: event.occurredAt,
            created_by: event.createdBy,
            updated_by: event.updatedBy,
            status: event.status,
            metadata: event.metadata,
            version: event.version,
            created_at: event.createdAt,
            updated_at: event.updatedAt
        })));
    }

    if (hub.presence.length) {
        await supabase.from('project_presence').insert(hub.presence.map((presence) => ({
            id: presence.id,
            project_id: projectId,
            user_id: presence.userId,
            user_name: presence.userName,
            surface: presence.surface,
            object_type: presence.objectType,
            object_id: presence.objectId,
            last_seen_at: presence.lastSeenAt,
            created_by: presence.createdBy,
            updated_by: presence.updatedBy,
            status: presence.status,
            metadata: presence.metadata,
            version: presence.version,
            created_at: presence.createdAt,
            updated_at: presence.updatedAt
        })));
    }

    await insertActivityEvent(projectId, actor, {
        action: 'updated',
        entityType: 'brief',
        entityId: projectId,
        message: 'Refreshed the project hub snapshot.'
    });
}

export async function enrichWorkspaceProjectsWithHub(projects: WorkspaceProject[], currentUserId?: string) {
    const hubEntries = await Promise.all(projects.map(async (project) => {
        try {
            const hub = await getProjectHub(project.id);
            return [project.id, hub] as const;
        } catch {
            return [project.id, undefined] as const;
        }
    }));
    const hubs = Object.fromEntries(hubEntries);

    return {
        projects: projects.map((project) => ({
            ...project,
            ...(hubs[project.id] ? getProjectHubMetrics(hubs[project.id]!) : {})
        })),
        collaborationOverview: buildWorkspaceCollaborationOverview(projects, hubs, currentUserId)
    };
}

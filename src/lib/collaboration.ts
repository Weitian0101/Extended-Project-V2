import { v4 as uuidv4 } from 'uuid';

import { isDecisionPendingForUser } from '@/lib/projectHubMeta';
import {
    ActivityEvent,
    CollaborationEntityType,
    CollaborationMetadata,
    CollaborationRecord,
    PresenceState,
    ProjectBrief,
    ProjectContext,
    ProjectHubData,
    ProjectHubTab,
    ProjectSurface,
    TeamMember,
    WorkspaceActivityDigest,
    WorkspaceCollaborationOverview,
    WorkspaceProject,
    WorkspaceReviewItem,
    WorkspaceSessionDigest,
    WorkspaceTaskDigest
} from '@/types';

type RecordStatus<T> = T extends CollaborationRecord<infer S> ? S : never;

export const PROJECT_HUB_TABS: Array<{ id: ProjectHubTab; label: string; description: string }> = [
    { id: 'brief', label: 'Brief', description: 'Shared context and success criteria.' },
    { id: 'board', label: 'Board', description: 'Work items, reviews, and blockers.' },
    { id: 'sessions', label: 'Sessions', description: 'Workshops, reviews, and follow-up.' },
    { id: 'outcomes', label: 'Outcomes', description: 'Decisions and reusable outputs.' }
];

export const BOARD_COLUMNS: Array<{ id: WorkspaceReviewItem['type'] extends never ? never : ProjectHubData['cards'][number]['status']; label: string }> = [
    { id: 'open-questions', label: 'Open Questions' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'ready-for-review', label: 'Ready for Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'parked', label: 'Parked' }
];

const MAX_OVERVIEW_ITEMS = 5;

function ensureMetadata(value: CollaborationMetadata | undefined) {
    return value || {};
}

export function createProjectBrief(
    projectId: string,
    updatedBy: string,
    context?: Partial<ProjectContext>,
    details?: Partial<Omit<ProjectBrief, 'projectId' | 'updatedAt' | 'updatedBy' | 'version' | 'metadata'>>
): ProjectBrief {
    const now = new Date().toISOString();

    return {
        projectId,
        background: context?.background || '',
        objectives: context?.objectives || '',
        assumptions: context?.assumptions || '',
        successMetrics: details?.successMetrics || '',
        milestones: details?.milestones || '',
        teamRoles: details?.teamRoles || '',
        workingNorms: details?.workingNorms || '',
        keyLinks: details?.keyLinks || '',
        version: 1,
        updatedAt: now,
        updatedBy,
        metadata: {}
    };
}

export function createEmptyProjectHubData({
    projectId,
    updatedBy,
    context,
    briefDetails
}: {
    projectId: string;
    updatedBy: string;
    context?: Partial<ProjectContext>;
    briefDetails?: Partial<Omit<ProjectBrief, 'projectId' | 'updatedAt' | 'updatedBy' | 'version' | 'metadata'>>;
}): ProjectHubData {
    return {
        brief: createProjectBrief(projectId, updatedBy, context, briefDetails),
        cards: [],
        sessions: [],
        decisions: [],
        artifacts: [],
        threads: [],
        tasks: [],
        activity: [],
        presence: []
    };
}

function normalizeRecord<T extends CollaborationRecord<string>>(record: T): T {
    return {
        ...record,
        metadata: ensureMetadata(record.metadata),
        version: record.version || 1
    };
}

export function normalizeProjectHubData(raw: unknown, fallback: ProjectHubData): ProjectHubData {
    if (!raw || typeof raw !== 'object') {
        return fallback;
    }

    const record = raw as Partial<ProjectHubData>;
    return {
        brief: record.brief
            ? {
                ...fallback.brief,
                ...record.brief,
                metadata: ensureMetadata(record.brief.metadata)
            }
            : fallback.brief,
        cards: Array.isArray(record.cards) ? record.cards.map((item) => normalizeRecord(item)) : fallback.cards,
        sessions: Array.isArray(record.sessions) ? record.sessions.map((item) => normalizeRecord(item)) : fallback.sessions,
        decisions: Array.isArray(record.decisions) ? record.decisions.map((item) => normalizeRecord(item)) : fallback.decisions,
        artifacts: Array.isArray(record.artifacts) ? record.artifacts.map((item) => normalizeRecord(item)) : fallback.artifacts,
        threads: Array.isArray(record.threads) ? record.threads.map((item) => normalizeRecord(item)) : fallback.threads,
        tasks: Array.isArray(record.tasks) ? record.tasks.map((item) => normalizeRecord(item)) : fallback.tasks,
        activity: Array.isArray(record.activity) ? record.activity.map((item) => normalizeRecord(item)) : fallback.activity,
        presence: Array.isArray(record.presence) ? record.presence.map((item) => normalizeRecord(item)) : fallback.presence
    };
}

export function appendActivityEvent(
    activity: ActivityEvent[],
    input: {
        projectId: string;
        actorId: string;
        actorName: string;
        action: ActivityEvent['action'];
        entityType: CollaborationEntityType;
        entityId: string;
        message: string;
    }
) {
    const now = new Date().toISOString();
    const nextEvent: ActivityEvent = {
        id: uuidv4(),
        projectId: input.projectId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.actorId,
        updatedBy: input.actorId,
        version: 1,
        status: 'logged',
        metadata: {},
        actorId: input.actorId,
        actorName: input.actorName,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        message: input.message,
        occurredAt: now
    };

    return [nextEvent, ...activity].slice(0, 40);
}

export function updatePresenceEntry(
    presence: PresenceState[],
    input: {
        projectId: string;
        userId: string;
        userName: string;
        surface: ProjectSurface;
        objectType?: CollaborationEntityType | null;
        objectId?: string | null;
        status?: PresenceState['status'];
    }
) {
    const now = new Date().toISOString();
    const existing = presence.find((item) => item.userId === input.userId);

    if (existing) {
        return presence.map((item) => item.userId === input.userId ? {
            ...item,
            surface: input.surface,
            objectType: input.objectType || null,
            objectId: input.objectId || null,
            status: input.status || 'online',
            lastSeenAt: now,
            updatedAt: now,
            updatedBy: input.userId,
            version: item.version + 1
        } : item);
    }

    return [{
        id: uuidv4(),
        projectId: input.projectId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.userId,
        updatedBy: input.userId,
        version: 1,
        status: input.status || 'online',
        metadata: {},
        userId: input.userId,
        userName: input.userName,
        surface: input.surface,
        objectType: input.objectType || null,
        objectId: input.objectId || null,
        lastSeenAt: now
    }, ...presence];
}

export function getProjectHubMetrics(hub: ProjectHubData) {
    const nextSession = [...hub.sessions]
        .filter((session) => session.scheduledAt && session.status !== 'canceled')
        .sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)))[0];
    const lastActivity = hub.activity[0]?.occurredAt
        || hub.artifacts[0]?.updatedAt
        || hub.cards[0]?.updatedAt
        || hub.decisions[0]?.updatedAt
        || null;

    return {
        nextSessionAt: nextSession?.scheduledAt || null,
        openTasksCount: hub.tasks.filter((task) => task.status !== 'done').length,
        pendingReviewCount: hub.cards.filter((card) => card.status === 'ready-for-review').length
            + hub.artifacts.filter((artifact) => artifact.status === 'ready').length
            + hub.decisions.filter((decision) => decision.status === 'proposed').length,
        unresolvedThreadsCount: hub.threads.filter((thread) => thread.status === 'open').length,
        lastActivityAt: lastActivity
    };
}

function resolveMemberName(project: WorkspaceProject, userId?: string | null) {
    if (!userId) {
        return null;
    }

    return project.members.find((member) => member.id === userId)?.name || null;
}

export function buildWorkspaceCollaborationOverview(
    projects: WorkspaceProject[],
    hubs: Record<string, ProjectHubData | undefined>,
    currentUserId?: string
): WorkspaceCollaborationOverview {
    const needsReview: WorkspaceReviewItem[] = [];
    const upcomingSessions: WorkspaceSessionDigest[] = [];
    const assignedTasks: WorkspaceTaskDigest[] = [];
    const recentActivity: WorkspaceActivityDigest[] = [];

    for (const project of projects) {
        const hub = hubs[project.id];
        if (!hub) {
            continue;
        }

        hub.cards
            .filter((card) => card.status === 'ready-for-review')
            .forEach((card) => {
                needsReview.push({
                    id: card.id,
                    projectId: project.id,
                    projectName: project.name,
                    title: card.title,
                    type: 'card',
                    stage: card.stage,
                    ownerName: resolveMemberName(project, card.ownerId),
                    updatedAt: card.updatedAt
                });
            });

        hub.artifacts
            .filter((artifact) => artifact.status === 'ready')
            .forEach((artifact) => {
                needsReview.push({
                    id: artifact.id,
                    projectId: project.id,
                    projectName: project.name,
                    title: artifact.title,
                    type: 'artifact',
                    stage: artifact.stage,
                    ownerName: resolveMemberName(project, artifact.ownerId),
                    updatedAt: artifact.updatedAt
                });
            });

        hub.decisions
            .filter((decision) => (
                decision.status === 'proposed'
                && (!currentUserId || isDecisionPendingForUser(decision, currentUserId))
            ))
            .forEach((decision) => {
                needsReview.push({
                    id: decision.id,
                    projectId: project.id,
                    projectName: project.name,
                    title: decision.title,
                    type: 'decision',
                    ownerName: resolveMemberName(project, decision.ownerId),
                    updatedAt: decision.updatedAt
                });
            });

        hub.sessions
            .filter((session) => session.scheduledAt && session.status !== 'canceled')
            .forEach((session) => {
                upcomingSessions.push({
                    id: session.id,
                    projectId: project.id,
                    projectName: project.name,
                    title: session.title,
                    scheduledAt: session.scheduledAt!,
                    facilitatorName: resolveMemberName(project, session.facilitatorId),
                    status: session.status
                });
            });

        hub.tasks
            .filter((task) => !currentUserId || task.ownerId === currentUserId)
            .filter((task) => task.status !== 'done')
            .forEach((task) => {
                assignedTasks.push({
                    id: task.id,
                    projectId: project.id,
                    projectName: project.name,
                    title: task.title,
                    status: task.status,
                    dueDate: task.dueDate,
                    ownerId: task.ownerId
                });
            });

        hub.activity.forEach((item) => {
            recentActivity.push({
                id: item.id,
                projectId: project.id,
                projectName: project.name,
                action: item.action,
                entityType: item.entityType,
                actorName: item.actorName,
                message: item.message,
                occurredAt: item.occurredAt
            });
        });
    }

    return {
        needsReview: needsReview
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, MAX_OVERVIEW_ITEMS),
        upcomingSessions: upcomingSessions
            .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
            .slice(0, MAX_OVERVIEW_ITEMS),
        assignedTasks: assignedTasks
            .sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')))
            .slice(0, MAX_OVERVIEW_ITEMS),
        recentActivity: recentActivity
            .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
            .slice(0, MAX_OVERVIEW_ITEMS)
    };
}

export function createDraftRecord<T extends CollaborationRecord<string>>(
    projectId: string,
    userId: string,
    status: RecordStatus<T>,
    metadata?: CollaborationMetadata
) {
    const now = new Date().toISOString();

    return {
        id: uuidv4(),
        projectId,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
        version: 1,
        status,
        metadata: ensureMetadata(metadata)
    } as unknown as T;
}

export function formatPresenceLabel(presence: PresenceState) {
    if (presence.objectType && presence.objectId) {
        return `${presence.userName} is in ${presence.surface} on ${presence.objectType}`;
    }

    return `${presence.userName} is in ${presence.surface}`;
}

export function summarizeTeamRoles(members: TeamMember[]) {
    return members.map((member) => `${member.name}: ${member.role}`).join('\n');
}

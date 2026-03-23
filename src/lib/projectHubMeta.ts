import { CollaborationMetadata, DecisionLogEntry, DecisionStatus, ProjectSession, TeamMember, ToolRun } from '@/types';

export type SessionDeliveryMode = 'online' | 'offline';
export type DecisionApprovalResponse = 'approved' | 'rejected';

type DecisionApprovalMap = Record<string, DecisionApprovalResponse>;

const SESSION_MEMBER_IDS_KEY = 'participantMemberIds';
const SESSION_MANUAL_PARTICIPANTS_KEY = 'manualParticipants';
const SESSION_DELIVERY_MODE_KEY = 'deliveryMode';
const SESSION_LOCATION_KEY = 'location';
const SESSION_MEETING_URL_KEY = 'meetingUrl';
const DECISION_REQUIRES_APPROVAL_KEY = 'requiresApproval';
const DECISION_APPROVER_IDS_KEY = 'approverIds';
const DECISION_APPROVALS_KEY = 'approvals';
const DECISION_LINKED_RUN_ID_KEY = 'linkedRunId';

function parseJson<T>(value: unknown, fallback: T): T {
    if (typeof value !== 'string' || !value.trim()) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(value) as T;
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

function getMetadataString(metadata: CollaborationMetadata | undefined, key: string) {
    const value = metadata?.[key];
    return typeof value === 'string' ? value : '';
}

function getMetadataBoolean(metadata: CollaborationMetadata | undefined, key: string, fallback = false) {
    const value = metadata?.[key];
    return typeof value === 'boolean' ? value : fallback;
}

export function parseMetadataIdList(value: unknown) {
    const parsed = parseJson<unknown[]>(value, []);
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function serializeMetadataIdList(values: string[]) {
    return JSON.stringify(values.filter((value) => value.trim().length > 0));
}

export function parseDecisionApprovalMap(value: unknown): DecisionApprovalMap {
    const parsed = parseJson<Record<string, unknown>>(value, {});
    return Object.fromEntries(
        Object.entries(parsed).filter(([, response]) => response === 'approved' || response === 'rejected')
    ) as DecisionApprovalMap;
}

export function serializeDecisionApprovalMap(value: DecisionApprovalMap) {
    return JSON.stringify(value);
}

export function getSessionParticipantMemberIds(session: Pick<ProjectSession, 'metadata'>) {
    return parseMetadataIdList(session.metadata?.[SESSION_MEMBER_IDS_KEY]);
}

export function getSessionManualParticipants(session: Pick<ProjectSession, 'metadata' | 'participants'>) {
    const manualParticipants = getMetadataString(session.metadata, SESSION_MANUAL_PARTICIPANTS_KEY).trim();
    return manualParticipants || session.participants || '';
}

export function getSessionDeliveryMode(session: Pick<ProjectSession, 'metadata'>): SessionDeliveryMode {
    return getMetadataString(session.metadata, SESSION_DELIVERY_MODE_KEY) === 'offline' ? 'offline' : 'online';
}

export function getSessionLocation(session: Pick<ProjectSession, 'metadata'>) {
    return getMetadataString(session.metadata, SESSION_LOCATION_KEY);
}

export function getSessionMeetingUrl(session: Pick<ProjectSession, 'metadata'>) {
    return getMetadataString(session.metadata, SESSION_MEETING_URL_KEY);
}

export function buildSessionMetadata({
    existingMetadata,
    participantMemberIds,
    manualParticipants,
    deliveryMode,
    location,
    meetingUrl
}: {
    existingMetadata?: CollaborationMetadata;
    participantMemberIds: string[];
    manualParticipants: string;
    deliveryMode: SessionDeliveryMode;
    location: string;
    meetingUrl: string;
}) {
    return {
        ...existingMetadata,
        [SESSION_MEMBER_IDS_KEY]: serializeMetadataIdList(participantMemberIds),
        [SESSION_MANUAL_PARTICIPANTS_KEY]: manualParticipants.trim() || null,
        [SESSION_DELIVERY_MODE_KEY]: deliveryMode,
        [SESSION_LOCATION_KEY]: deliveryMode === 'offline' ? location.trim() || null : null,
        [SESSION_MEETING_URL_KEY]: deliveryMode === 'online' ? meetingUrl.trim() || null : null
    };
}

export function buildSessionParticipantSummary(
    session: Pick<ProjectSession, 'metadata' | 'participants'>,
    members: TeamMember[]
) {
    const selectedNames = getSessionParticipantMemberIds(session)
        .map((memberId) => members.find((member) => member.id === memberId)?.name)
        .filter((name): name is string => Boolean(name));
    const manualParticipants = getSessionManualParticipants(session)
        .split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean);

    const combined = [...selectedNames, ...manualParticipants];
    return combined.length > 0 ? combined.join(', ') : 'No participants listed yet';
}

export function getDecisionRequiresApproval(decision: Pick<DecisionLogEntry, 'metadata'>) {
    return getMetadataBoolean(decision.metadata, DECISION_REQUIRES_APPROVAL_KEY, false);
}

export function getDecisionApproverIds(decision: Pick<DecisionLogEntry, 'metadata'>) {
    return parseMetadataIdList(decision.metadata?.[DECISION_APPROVER_IDS_KEY]);
}

export function getDecisionApprovalMap(decision: Pick<DecisionLogEntry, 'metadata'>) {
    return parseDecisionApprovalMap(decision.metadata?.[DECISION_APPROVALS_KEY]);
}

export function buildDecisionMetadata({
    existingMetadata,
    requiresApproval,
    approverIds,
    approvals
}: {
    existingMetadata?: CollaborationMetadata;
    requiresApproval: boolean;
    approverIds: string[];
    approvals: DecisionApprovalMap;
}) {
    return {
        ...existingMetadata,
        [DECISION_REQUIRES_APPROVAL_KEY]: requiresApproval,
        [DECISION_APPROVER_IDS_KEY]: requiresApproval ? serializeMetadataIdList(approverIds) : null,
        [DECISION_APPROVALS_KEY]: requiresApproval ? serializeDecisionApprovalMap(approvals) : null
    };
}

export function resolveDecisionStatus({
    requiresApproval,
    approverIds,
    approvals
}: {
    requiresApproval: boolean;
    approverIds: string[];
    approvals: DecisionApprovalMap;
}): DecisionStatus {
    if (!requiresApproval) {
        return 'decided';
    }

    if (approverIds.length === 0) {
        return 'proposed';
    }

    const reviewStates = approverIds.map((approverId) => approvals[approverId] || 'pending');

    if (reviewStates.some((state) => state === 'rejected')) {
        return 'revisit';
    }

    if (reviewStates.every((state) => state === 'approved')) {
        return 'decided';
    }

    return 'proposed';
}

export function getDecisionApprovalSummary(
    decision: Pick<DecisionLogEntry, 'metadata' | 'status'>,
    members: TeamMember[]
) {
    const requiresApproval = getDecisionRequiresApproval(decision);
    if (!requiresApproval) {
        return decision.status === 'decided' ? 'No approval required' : 'Ready to decide';
    }

    const approverIds = getDecisionApproverIds(decision);
    if (approverIds.length === 0) {
        return 'Approvers not selected yet';
    }

    const approvals = getDecisionApprovalMap(decision);
    const approvedCount = approverIds.filter((approverId) => approvals[approverId] === 'approved').length;
    const rejectedCount = approverIds.filter((approverId) => approvals[approverId] === 'rejected').length;

    if (rejectedCount > 0) {
        return `${rejectedCount}/${approverIds.length} rejected`;
    }

    const approverNames = approverIds
        .map((approverId) => members.find((member) => member.id === approverId)?.name)
        .filter((name): name is string => Boolean(name));

    if (approvedCount === 0) {
        return `Waiting for ${approverNames.join(', ') || 'approvers'}`;
    }

    return `${approvedCount}/${approverIds.length} approved`;
}

export function isDecisionPendingForUser(decision: Pick<DecisionLogEntry, 'metadata'>, userId?: string | null) {
    if (!userId || !getDecisionRequiresApproval(decision)) {
        return false;
    }

    const approverIds = getDecisionApproverIds(decision);
    if (!approverIds.includes(userId)) {
        return false;
    }

    return !getDecisionApprovalMap(decision)[userId];
}

export function applyDecisionApproval(
    decision: Pick<DecisionLogEntry, 'metadata'>,
    actorId: string,
    response: DecisionApprovalResponse
) {
    const approverIds = getDecisionApproverIds(decision);
    const currentApprovals = getDecisionApprovalMap(decision);

    if (!approverIds.includes(actorId)) {
        return {
            approvals: currentApprovals,
            status: resolveDecisionStatus({
                requiresApproval: getDecisionRequiresApproval(decision),
                approverIds,
                approvals: currentApprovals
            })
        };
    }

    const nextApprovals = {
        ...currentApprovals,
        [actorId]: response
    };

    return {
        approvals: nextApprovals,
        status: resolveDecisionStatus({
            requiresApproval: getDecisionRequiresApproval(decision),
            approverIds,
            approvals: nextApprovals
        })
    };
}

export function getRecordLinkedRunId(
    record: Pick<DecisionLogEntry, 'metadata'>
    | Pick<ProjectSession, 'metadata'>
    | { linkedRunId?: string | null; metadata?: CollaborationMetadata }
) {
    if ('linkedRunId' in record && typeof record.linkedRunId === 'string' && record.linkedRunId.trim()) {
        return record.linkedRunId;
    }

    return getMetadataString(record.metadata, DECISION_LINKED_RUN_ID_KEY) || null;
}

export function getLinkedRun(record: Parameters<typeof getRecordLinkedRunId>[0], toolRuns: ToolRun[]) {
    const linkedRunId = getRecordLinkedRunId(record);
    if (!linkedRunId) {
        return null;
    }

    return toolRuns.find((run) => run.id === linkedRunId) || null;
}

'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    ChevronsUpDown,
    ClipboardList,
    FileStack,
    Flag,
    Gavel,
    Layers3,
    ListTodo,
    Milestone,
    MoreHorizontal,
    PencilLine,
    Plus,
    Radar,
    Sparkles,
    Target,
    Trash2,
    Users2,
    X
} from 'lucide-react';

import { AvatarCluster } from '@/components/ui/AvatarCluster';
import { Button } from '@/components/ui/Button';
import { BrandedLoadingScreen } from '@/components/ui/BrandedLoadingScreen';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { HelpPopover } from '@/components/ui/HelpPopover';
import { RoundedSelect } from '@/components/ui/RoundedSelect';
import { BOARD_COLUMNS, PROJECT_HUB_TABS, formatPresenceLabel } from '@/lib/collaboration';
import {
    applyDecisionApproval,
    buildDecisionMetadata,
    buildSessionMetadata,
    buildSessionParticipantSummary,
    getDecisionApprovalMap,
    getDecisionApprovalSummary,
    getDecisionApproverIds,
    getDecisionRequiresApproval,
    getLinkedRun,
    isDecisionPendingForUser,
    getSessionDeliveryMode,
    getSessionLocation,
    getSessionManualParticipants,
    getSessionMeetingUrl,
    getSessionParticipantMemberIds,
    resolveDecisionStatus,
    SessionDeliveryMode
} from '@/lib/projectHubMeta';
import { getProjectAccentTheme } from '@/lib/projectAccent';
import { saveStageMethodSession } from '@/lib/services/stageMethodSession';
import { cn } from '@/lib/utils';
import {
    CollaborationCard,
    DecisionLogEntry,
    ProjectArtifact,
    ProjectBrief,
    ProjectData,
    ProjectHubData,
    ProjectSurface,
    ProjectHubTab,
    ProjectSession,
    StageId,
    TaskItem,
    UserProfileData,
    WorkspaceProject
} from '@/types';

type ProjectHubResource = 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'tasks';
type ComposerMode = 'card' | 'task' | 'session' | 'decision' | 'artifact' | null;
type ContextMenuState =
    | { resource: 'cards'; record: CollaborationCard; x: number; y: number }
    | { resource: 'tasks'; record: TaskItem; x: number; y: number }
    | { resource: 'sessions'; record: ProjectSession; x: number; y: number }
    | { resource: 'decisions'; record: DecisionLogEntry; x: number; y: number }
    | { resource: 'artifacts'; record: ProjectArtifact; x: number; y: number };
type DetailState =
    | { resource: 'cards'; record: CollaborationCard }
    | { resource: 'tasks'; record: TaskItem }
    | { resource: 'sessions'; record: ProjectSession }
    | { resource: 'decisions'; record: DecisionLogEntry }
    | { resource: 'artifacts'; record: ProjectArtifact };
type DeleteDialogState = { resource: 'cards' | 'tasks' | 'sessions' | 'decisions' | 'artifacts'; id: string; title: string };
type RenameDialogState = {
    resource: ProjectHubResource;
    record: CollaborationCard | TaskItem | ProjectSession | DecisionLogEntry | ProjectArtifact;
    nextTitle: string;
};
type ModalTone = 'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';
type ModalAccentMode = 'full' | 'bar';

const UNASSIGNED_ROLE = 'Unassigned';

const ROLE_OPTIONS = [
    UNASSIGNED_ROLE,
    'Project Lead',
    'Product Strategist',
    'Research Lead',
    'Facilitator',
    'Design Lead',
    'Delivery Lead',
    'Story Lead',
    'Observer'
];

const WORKING_NORM_OPTIONS = [
    'One decision owner',
    'Async notes first',
    'Weekly review ritual',
    'Evidence before opinion',
    'Single source of truth',
    'Client recap after sessions'
];

interface ProjectHubProps {
    project: ProjectData;
    projectSummary: WorkspaceProject;
    profile: UserProfileData;
    hub: ProjectHubData;
    currentSurface: ProjectSurface;
    isLoading: boolean;
    hasCachedData?: boolean;
    error: string | null;
    onUpdateBrief: (updates: Partial<ProjectBrief>) => Promise<ProjectBrief>;
    onCreateRecord: <TResource extends ProjectHubResource>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateRecord: <TResource extends ProjectHubResource>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
    onDeleteRecord: (resource: 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'tasks', id: string) => Promise<void>;
    onOpenStage: (stage: StageId) => void;
    onSetProjectStage: (stage: StageId) => void;
    onSyncContext: (contextUpdates: Partial<ProjectData['context']>) => void;
}

type HubJumpTarget = 'working-setup' | 'tasks' | 'sessions' | 'review' | 'board';
type StagePreferenceMode = 'auto' | 'manual';
type HubInsightItem = {
    id: string;
    title: string;
    subtitle?: string | null;
    meta?: string | null;
    icon?: React.ComponentType<{ className?: string }>;
    accentText?: string;
    onSelect?: () => void;
};

const STAGE_PREFERENCE_OPTIONS: Array<{ id: StageId; label: string }> = [
    { id: 'overview', label: 'Project Context' },
    { id: 'explore', label: 'Explore' },
    { id: 'imagine', label: 'Imagine' },
    { id: 'implement', label: 'Implement' },
    { id: 'tell-story', label: 'Tell Story' }
];

export function ProjectHub({
    project,
    projectSummary,
    profile,
    hub,
    currentSurface,
    isLoading,
    hasCachedData = false,
    error,
    onUpdateBrief,
    onCreateRecord,
    onUpdateRecord,
    onDeleteRecord,
    onOpenStage,
    onSetProjectStage
}: ProjectHubProps) {
    const currentUserId = profile.id || 'user';
    const [activeTab, setActiveTab] = useState<ProjectHubTab>('brief');
    const [savingBrief, setSavingBrief] = useState(false);
    const [briefDraft, setBriefDraft] = useState<ProjectBrief>(hub.brief);
    const [roleAssignments, setRoleAssignments] = useState<Record<string, string>>({});
    const [actionError, setActionError] = useState<string | null>(null);
    const [composerMode, setComposerMode] = useState<ComposerMode>(null);
    const [editingRecord, setEditingRecord] = useState<{ resource: ProjectHubResource; recordId: string } | null>(null);
    const [detailState, setDetailState] = useState<DetailState | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [renameDialog, setRenameDialog] = useState<RenameDialogState | null>(null);
    const [isRenameLoading, setIsRenameLoading] = useState(false);
    const [pendingJumpTarget, setPendingJumpTarget] = useState<HubJumpTarget | null>(null);
    const [isStageControlOpen, setIsStageControlOpen] = useState(false);
    const [taskFilter, setTaskFilter] = useState<'all' | TaskItem['status']>('all');
    const [boardDraft, setBoardDraft] = useState({ title: '', summary: '', type: 'idea', status: 'open-questions', ownerId: '', dueDate: '' });
    const [taskDraft, setTaskDraft] = useState({ title: '', details: '', status: 'open', ownerId: '', dueDate: '', todoScope: 'none' });
    const [sessionDraft, setSessionDraft] = useState({
        title: '',
        goal: '',
        agenda: '',
        scheduledAt: '',
        participantMemberIds: [] as string[],
        manualParticipants: '',
        deliveryMode: 'online' as SessionDeliveryMode,
        location: '',
        meetingUrl: ''
    });
    const [sessionDetailsExpanded, setSessionDetailsExpanded] = useState(false);
    const [decisionDraft, setDecisionDraft] = useState({
        title: '',
        background: '',
        options: '',
        decision: '',
        rationale: '',
        requiresApproval: false,
        approverIds: [] as string[]
    });
    const [artifactDraft, setArtifactDraft] = useState({ title: '', summary: '', type: 'concept', status: 'draft' });
    const mergeIncomingBriefMetadataRef = useRef(false);
    const stageControlRef = useRef<HTMLDivElement | null>(null);
    const taskSectionRef = useRef<HTMLDivElement | null>(null);
    const workingSetupRef = useRef<HTMLDivElement | null>(null);
    const sessionsSectionRef = useRef<HTMLDivElement | null>(null);
    const outcomesSectionRef = useRef<HTMLDivElement | null>(null);
    const helpTooltipsEnabled = profile.guidePreferences?.helpTooltipsEnabled !== false;

    useEffect(() => {
        const shouldMergeBriefMetadata = mergeIncomingBriefMetadataRef.current;
        setBriefDraft((current) => {
            if (shouldMergeBriefMetadata) {
                mergeIncomingBriefMetadataRef.current = false;
                return {
                    ...current,
                    metadata: hub.brief.metadata,
                    version: hub.brief.version,
                    updatedAt: hub.brief.updatedAt,
                    updatedBy: hub.brief.updatedBy
                };
            }

            return hub.brief;
        });

        if (!shouldMergeBriefMetadata) {
            setRoleAssignments(parseRoleAssignments(projectSummary.members, hub.brief.teamRoles));
        }
    }, [hub.brief, projectSummary.members]);

    useEffect(() => {
        if (!contextMenu) return;
        const closeMenu = () => setContextMenu(null);
        window.addEventListener('pointerdown', closeMenu);
        return () => window.removeEventListener('pointerdown', closeMenu);
    }, [contextMenu]);

    useEffect(() => {
        if (!isStageControlOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!stageControlRef.current?.contains(event.target as Node)) {
                setIsStageControlOpen(false);
            }
        };

        window.addEventListener('pointerdown', handlePointerDown);
        return () => window.removeEventListener('pointerdown', handlePointerDown);
    }, [isStageControlOpen]);

    const nextSession = [...hub.sessions]
        .filter((session) => session.scheduledAt && session.status !== 'canceled')
        .sort((left, right) => String(left.scheduledAt).localeCompare(String(right.scheduledAt)))[0];
    const openTasks = hub.tasks.filter((task) => task.status !== 'done');
    const reviewCardCount = hub.cards.filter((card) => card.status === 'ready-for-review').length;
    const readyArtifactCount = hub.artifacts.filter((artifact) => artifact.status === 'ready').length;
    const proposedDecisionCount = hub.decisions.filter((decision) => decision.status === 'proposed').length;
    const reviewItems = reviewCardCount + readyArtifactCount + proposedDecisionCount;
    const openThreadCount = hub.threads.filter((thread) => thread.status === 'open').length;
    const currentMember = projectSummary.members.find((member) => member.id === currentUserId);
    const canManageSharedTodos = currentMember?.permission === 'owner' || currentMember?.permission === 'edit';
    const systemTimeZone = useMemo(() => getSystemTimezone(), []);
    const cardsByColumn = useMemo(() => Object.fromEntries(
        BOARD_COLUMNS.map((column) => [column.id, hub.cards.filter((card) => card.status === column.id)])
    ) as Record<CollaborationCard['status'], CollaborationCard[]>, [hub.cards]);
    const globalTodos = hub.tasks.filter((task) => getTodoScope(task) === 'global');
    const personalTodos = hub.tasks.filter((task) => getTodoScope(task) === 'personal' && (task.ownerId === currentUserId || task.createdBy === currentUserId));
    const boardTasks = hub.tasks.filter((task) => getTodoScope(task) !== 'personal');
    const visibleBoardTasks = taskFilter === 'all'
        ? boardTasks
        : boardTasks.filter((task) => task.status === taskFilter);
    const tasksByOwner = projectSummary.members.map((member) => ({
        member,
        tasks: openTasks.filter((task) => task.ownerId === member.id)
    })).filter((entry) => entry.tasks.length > 0);
    const reviewRecords = [
        ...hub.cards
            .filter((card) => card.status === 'ready-for-review')
            .map((card) => ({
                id: card.id,
                resource: 'cards' as const,
                title: card.title,
                subtitle: 'Board card ready for review',
                meta: [card.ownerId ? resolveMemberName(projectSummary.members, card.ownerId) : null, card.dueDate ? formatDateOnly(card.dueDate) : null].filter(Boolean).join(' · '),
                icon: ClipboardList,
                accentText: 'text-violet-600'
            })),
        ...hub.artifacts
            .filter((artifact) => artifact.status === 'ready')
            .map((artifact) => ({
                id: artifact.id,
                resource: 'artifacts' as const,
                title: artifact.title,
                subtitle: 'Output ready to review',
                meta: `${formatArtifactTypeLabel(artifact.type)} · ${formatArtifactStatusLabel(artifact.status)}`,
                icon: FileStack,
                accentText: 'text-sky-600'
            })),
        ...hub.decisions
            .filter((decision) => decision.status === 'proposed')
            .map((decision) => ({
                id: decision.id,
                resource: 'decisions' as const,
                title: decision.title,
                subtitle: isDecisionPendingForUser(decision, currentUserId) ? 'Your approval is requested' : 'Decision waiting for alignment',
                meta: getDecisionApprovalSummary(decision, projectSummary.members),
                icon: Gavel,
                accentText: 'text-rose-600'
            }))
    ];
    const stageMode = getStagePreferenceMode(briefDraft.metadata);
    const manualStage = getManualStagePreference(briefDraft.metadata);
    const displayedStage = stageMode === 'manual' && manualStage ? manualStage : project.currentStage;
    const nextTaskDueDate = [...openTasks]
        .filter((task) => task.dueDate)
        .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)))[0]?.dueDate;
    const reviewHelper = [
        reviewCardCount > 0 ? `${reviewCardCount} card${reviewCardCount === 1 ? '' : 's'}` : null,
        readyArtifactCount > 0 ? `${readyArtifactCount} output${readyArtifactCount === 1 ? '' : 's'}` : null,
        proposedDecisionCount > 0 ? `${proposedDecisionCount} decision${proposedDecisionCount === 1 ? '' : 's'}` : null
    ].filter(Boolean).join(' · ');
    const accentTheme = useMemo(() => getProjectAccentTheme(projectSummary.accent), [projectSummary.accent]);

    useEffect(() => {
        if (!pendingJumpTarget) {
            return;
        }

        const targetRef = pendingJumpTarget === 'working-setup'
            ? workingSetupRef
            : pendingJumpTarget === 'tasks'
                ? taskSectionRef
                : pendingJumpTarget === 'sessions'
                    ? sessionsSectionRef
                    : pendingJumpTarget === 'review'
                        ? outcomesSectionRef
                        : null;

        const frameId = window.requestAnimationFrame(() => {
            targetRef?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            setPendingJumpTarget(null);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [activeTab, pendingJumpTarget]);

    const handleHubJump = (target: HubJumpTarget) => {
        setPendingJumpTarget(null);
        setActiveTab(
            target === 'sessions'
                ? 'sessions'
                : target === 'review'
                    ? 'outcomes'
                    : target === 'board'
                        ? 'board'
                        : 'brief'
        );
        window.requestAnimationFrame(() => setPendingJumpTarget(target));
    };

    const handleStagePreferenceChange = async (mode: StagePreferenceMode, nextStage?: StageId) => {
        const previousMetadata = briefDraft.metadata;
        const resolvedStage = mode === 'manual'
            ? (nextStage || manualStage || project.currentStage)
            : null;
        const nextMetadata = {
            ...briefDraft.metadata,
            stageMode: mode,
            manualStage: resolvedStage
        };

        setBriefDraft((current) => ({
            ...current,
            metadata: nextMetadata
        }));
        setIsStageControlOpen(false);
        setActionError(null);

        try {
            mergeIncomingBriefMetadataRef.current = true;
            await onUpdateBrief({
                metadata: nextMetadata
            });

            if (mode === 'manual' && resolvedStage) {
                onSetProjectStage(resolvedStage);
                return;
            }

            if (mode === 'auto' && currentSurface !== 'hub') {
                onSetProjectStage(currentSurface as StageId);
            }
        } catch (stageError) {
            mergeIncomingBriefMetadataRef.current = false;
            setBriefDraft((current) => ({
                ...current,
                metadata: previousMetadata
            }));
            setActionError(stageError instanceof Error ? stageError.message : 'Unable to update the project stage preference.');
        }
    };

    const sessionPreviewItems: HubInsightItem[] = hub.sessions
        .filter((session) => session.scheduledAt && session.status !== 'canceled')
        .sort((left, right) => String(left.scheduledAt).localeCompare(String(right.scheduledAt)))
        .slice(0, 4)
        .map((session) => ({
            id: session.id,
            title: session.title,
            subtitle: formatDateTime(session.scheduledAt, 'Time not set'),
            meta: [formatSessionDeliveryMode(getSessionDeliveryMode(session)), session.goal || null].filter(Boolean).join(' · '),
            icon: CalendarClock,
            accentText: 'text-emerald-600',
            onSelect: () => {
                setDetailState({ resource: 'sessions', record: session });
                handleHubJump('sessions');
            }
        }));

    const taskPreviewItems: HubInsightItem[] = openTasks
        .slice(0, 4)
        .map((task) => ({
            id: task.id,
            title: task.title,
            subtitle: task.ownerId ? resolveMemberName(projectSummary.members, task.ownerId) : 'Unassigned',
            meta: task.dueDate ? formatDateOnly(task.dueDate) : 'No due date',
            icon: ClipboardList,
            accentText: 'text-amber-600',
            onSelect: () => {
                setDetailState({ resource: 'tasks', record: task });
                handleHubJump('tasks');
            }
        }));

    const reviewPreviewItems: HubInsightItem[] = reviewRecords
        .slice(0, 4)
        .map((record) => ({
            id: record.id,
            title: record.title,
            subtitle: record.subtitle,
            meta: record.meta,
            icon: record.icon,
            accentText: record.accentText,
            onSelect: () => {
                if (record.resource === 'cards') {
                    const item = hub.cards.find((card) => card.id === record.id);
                    if (item) {
                        setDetailState({ resource: 'cards', record: item });
                    }
                    handleHubJump('board');
                    return;
                }

                if (record.resource === 'artifacts') {
                    const item = hub.artifacts.find((artifact) => artifact.id === record.id);
                    if (item) {
                        setDetailState({ resource: 'artifacts', record: item });
                    }
                }

                if (record.resource === 'decisions') {
                    const item = hub.decisions.find((decision) => decision.id === record.id);
                    if (item) {
                        setDetailState({ resource: 'decisions', record: item });
                    }
                }

                handleHubJump('review');
            }
        }));

    const handleBriefSave = async () => {
        setSavingBrief(true);
        try {
            await onUpdateBrief({
                ...briefDraft,
                teamRoles: buildRoleSummary(projectSummary.members, roleAssignments)
            });
        } finally {
            setSavingBrief(false);
        }
    };

    const handleCreateCardFromScope = (scope: 'board' | 'global-todo' | 'personal-todo') => {
        if (scope === 'board') {
            setEditingRecord(null);
            setBoardDraft({ title: '', summary: '', type: 'idea', status: 'open-questions', ownerId: '', dueDate: '' });
            setComposerMode('card');
            return;
        }

        setEditingRecord(null);
        setTaskDraft({
            title: '',
            details: '',
            status: 'open',
            ownerId: scope === 'personal-todo' ? currentUserId : '',
            dueDate: '',
            todoScope: scope === 'global-todo' ? 'global' : 'personal'
        });
        setComposerMode('task');
    };

    const handleEditRecord = (resource: 'cards' | 'tasks' | 'sessions' | 'decisions' | 'artifacts', record: CollaborationCard | TaskItem | ProjectSession | DecisionLogEntry | ProjectArtifact) => {
        setEditingRecord({ resource, recordId: record.id });
        setDetailState(null);
        setContextMenu(null);

        if (resource === 'cards') {
            const card = record as CollaborationCard;
            setBoardDraft({
                title: card.title,
                summary: card.summary,
                type: card.type,
                status: card.status,
                ownerId: card.ownerId || '',
                dueDate: card.dueDate || ''
            });
            setComposerMode('card');
            return;
        }

        if (resource === 'tasks') {
            const task = record as TaskItem;
            setTaskDraft({
                title: task.title,
                details: task.details,
                status: task.status,
                ownerId: task.ownerId || '',
                dueDate: task.dueDate || '',
                todoScope: getTodoScope(task)
            });
            setComposerMode('task');
            return;
        }

        if (resource === 'sessions') {
            const session = record as ProjectSession;
            setSessionDraft({
                title: session.title,
                goal: session.goal,
                agenda: session.agenda,
                scheduledAt: toLocalDateTimeInput(session.scheduledAt),
                participantMemberIds: getSessionParticipantMemberIds(session),
                manualParticipants: getSessionManualParticipants(session),
                deliveryMode: getSessionDeliveryMode(session),
                location: getSessionLocation(session),
                meetingUrl: getSessionMeetingUrl(session)
            });
            setSessionDetailsExpanded(Boolean(session.agenda || getSessionManualParticipants(session)));
            setComposerMode('session');
            return;
        }

        if (resource === 'decisions') {
            const decision = record as DecisionLogEntry;
            setDecisionDraft({
                title: decision.title,
                background: decision.background,
                options: decision.options,
                decision: decision.decision,
                rationale: decision.rationale,
                requiresApproval: getDecisionRequiresApproval(decision),
                approverIds: getDecisionApproverIds(decision)
            });
            setComposerMode('decision');
            return;
        }

        const artifact = record as ProjectArtifact;
        setArtifactDraft({
            title: artifact.title,
            summary: artifact.summary,
            type: artifact.type,
            status: artifact.status
        });
        setComposerMode('artifact');
    };

    const handleRename = async () => {
        if (!contextMenu) return;
        setRenameDialog({
            resource: contextMenu.resource,
            record: contextMenu.record,
            nextTitle: contextMenu.record.title
        });
        setContextMenu(null);
    };

    const handleRenameConfirm = async () => {
        if (!renameDialog) {
            return;
        }

        const nextTitle = renameDialog.nextTitle.trim();
        if (!nextTitle) {
            return;
        }

        try {
            setIsRenameLoading(true);
            setActionError(null);
            await onUpdateRecord(renameDialog.resource, renameDialog.record.id, {
                ...renameDialog.record,
                title: nextTitle,
                version: renameDialog.record.version
            });
            setRenameDialog(null);
        } catch (renameError) {
            setActionError(renameError instanceof Error ? renameError.message : 'Unable to rename this item.');
        } finally {
            setIsRenameLoading(false);
        }
    };

    const handleTodoToggle = async (task: TaskItem) => {
        const nextStatus = task.status === 'done' ? 'open' : 'done';
        try {
            setActionError(null);
            await onUpdateRecord('tasks', task.id, {
                title: task.title,
                details: task.details,
                ownerId: task.ownerId || null,
                dueDate: task.dueDate || null,
                stage: task.stage || null,
                linkedEntityType: task.linkedEntityType || null,
                linkedEntityId: task.linkedEntityId || null,
                status: nextStatus,
                version: task.version,
                metadata: {
                    ...task.metadata,
                    todoScope: getTodoScope(task)
                }
            });
        } catch (toggleError) {
            setActionError(toggleError instanceof Error ? toggleError.message : 'Unable to update this task.');
        }
    };

    const handleDelete = async () => {
        if (!contextMenu) return;
        setDeleteDialog({
            resource: contextMenu.resource,
            id: contextMenu.record.id,
            title: contextMenu.record.title
        });
        setContextMenu(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog) {
            return;
        }

        try {
            setIsDeleteLoading(true);
            await onDeleteRecord(deleteDialog.resource, deleteDialog.id);
            setDeleteDialog(null);
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const handleCardSubmit = async () => {
        const payload = {
            ...boardDraft,
            ownerId: boardDraft.ownerId || null,
            dueDate: boardDraft.dueDate || null
        };

        if (editingRecord?.resource === 'cards') {
            const existing = hub.cards.find((card) => card.id === editingRecord.recordId);
            if (!existing) return;
            await onUpdateRecord('cards', existing.id, {
                ...existing,
                ...payload,
                version: existing.version
            });
        } else {
            await onCreateRecord('cards', payload);
        }

        setBoardDraft({ title: '', summary: '', type: 'idea', status: 'open-questions', ownerId: '', dueDate: '' });
        setEditingRecord(null);
        setComposerMode(null);
    };

    const handleTaskSubmit = async () => {
        const payload = {
            ...taskDraft,
            ownerId: taskDraft.ownerId || null,
            dueDate: taskDraft.dueDate || null,
            metadata: {
                todoScope: taskDraft.todoScope
            }
        };

        if (editingRecord?.resource === 'tasks') {
            const existing = hub.tasks.find((task) => task.id === editingRecord.recordId);
            if (!existing) return;
            await onUpdateRecord('tasks', existing.id, {
                ...existing,
                ...payload,
                version: existing.version,
                metadata: {
                    ...existing.metadata,
                    todoScope: taskDraft.todoScope
                }
            });
        } else {
            await onCreateRecord('tasks', payload);
        }

        setTaskDraft({ title: '', details: '', status: 'open', ownerId: '', dueDate: '', todoScope: 'none' });
        setEditingRecord(null);
        setComposerMode(null);
    };

    const handleSessionSubmit = async () => {
        const scheduledAt = sessionDraft.scheduledAt ? new Date(sessionDraft.scheduledAt).toISOString() : null;
        const metadata = buildSessionMetadata({
            existingMetadata: editingRecord?.resource === 'sessions'
                ? hub.sessions.find((session) => session.id === editingRecord.recordId)?.metadata
                : undefined,
            participantMemberIds: sessionDraft.participantMemberIds,
            manualParticipants: sessionDraft.manualParticipants,
            deliveryMode: sessionDraft.deliveryMode,
            location: sessionDraft.location,
            meetingUrl: sessionDraft.meetingUrl
        });
        const participants = buildSessionParticipantSummary({
            metadata,
            participants: sessionDraft.manualParticipants
        }, projectSummary.members);

        if (editingRecord?.resource === 'sessions') {
            const existing = hub.sessions.find((session) => session.id === editingRecord.recordId);
            if (!existing) return;
            await onUpdateRecord('sessions', existing.id, {
                ...existing,
                title: sessionDraft.title,
                goal: sessionDraft.goal,
                agenda: sessionDraft.agenda,
                participants,
                scheduledAt,
                metadata: {
                    ...metadata,
                    timeZone: systemTimeZone
                },
                version: existing.version
            });
        } else {
            await onCreateRecord('sessions', {
                title: sessionDraft.title,
                goal: sessionDraft.goal,
                agenda: sessionDraft.agenda,
                participants,
                scheduledAt,
                metadata: {
                    ...metadata,
                    timeZone: systemTimeZone
                }
            });
        }

        setSessionDraft({
            title: '',
            goal: '',
            agenda: '',
            scheduledAt: '',
            participantMemberIds: [],
            manualParticipants: '',
            deliveryMode: 'online',
            location: '',
            meetingUrl: ''
        });
        setSessionDetailsExpanded(false);
        setEditingRecord(null);
        setComposerMode(null);
    };

    const handleDecisionSubmit = async () => {
        if (decisionDraft.requiresApproval && decisionDraft.approverIds.length === 0) {
            setActionError('Select at least one approver before creating an approval-based decision.');
            return;
        }

        const existingDecision = editingRecord?.resource === 'decisions'
            ? hub.decisions.find((decision) => decision.id === editingRecord.recordId)
            : null;
        const approvals = existingDecision ? getDecisionApprovalMap(existingDecision) : {};
        const metadata = buildDecisionMetadata({
            existingMetadata: existingDecision?.metadata,
            requiresApproval: decisionDraft.requiresApproval,
            approverIds: decisionDraft.approverIds,
            approvals
        });
        const status = resolveDecisionStatus({
            requiresApproval: decisionDraft.requiresApproval,
            approverIds: decisionDraft.approverIds,
            approvals
        });

        if (editingRecord?.resource === 'decisions') {
            const existing = hub.decisions.find((decision) => decision.id === editingRecord.recordId);
            if (!existing) return;
            await onUpdateRecord('decisions', existing.id, {
                ...existing,
                title: decisionDraft.title,
                background: decisionDraft.background,
                options: decisionDraft.options,
                decision: decisionDraft.decision,
                rationale: decisionDraft.rationale,
                status,
                metadata,
                version: existing.version
            });
        } else {
            await onCreateRecord('decisions', {
                title: decisionDraft.title,
                background: decisionDraft.background,
                options: decisionDraft.options,
                decision: decisionDraft.decision,
                rationale: decisionDraft.rationale,
                status,
                metadata
            });
        }

        setActionError(null);
        setDecisionDraft({ title: '', background: '', options: '', decision: '', rationale: '', requiresApproval: false, approverIds: [] });
        setEditingRecord(null);
        setComposerMode(null);
    };

    const handleDecisionResponse = async (decision: DecisionLogEntry, response: 'approved' | 'rejected') => {
        const { approvals, status } = applyDecisionApproval(decision, currentUserId, response);
        await onUpdateRecord('decisions', decision.id, {
            ...decision,
            status,
            metadata: buildDecisionMetadata({
                existingMetadata: decision.metadata,
                requiresApproval: getDecisionRequiresApproval(decision),
                approverIds: getDecisionApproverIds(decision),
                approvals
            }),
            version: decision.version
        });
        setDetailState((current) => current?.resource === 'decisions'
            ? {
                resource: 'decisions',
                record: {
                    ...decision,
                    status,
                    metadata: buildDecisionMetadata({
                        existingMetadata: decision.metadata,
                        requiresApproval: getDecisionRequiresApproval(decision),
                        approverIds: getDecisionApproverIds(decision),
                        approvals
                    })
                }
            }
            : current);
    };

    const handleOpenLinkedRun = (record: CollaborationCard | ProjectArtifact | DecisionLogEntry) => {
        const linkedRun = getLinkedRun(record, project.toolRuns);
        if (!linkedRun) {
            return;
        }

        if (
            linkedRun.stage !== 'explore'
            && linkedRun.stage !== 'imagine'
            && linkedRun.stage !== 'implement'
            && linkedRun.stage !== 'tell-story'
        ) {
            return;
        }

        saveStageMethodSession(project.id, linkedRun.stage, {
            viewState: 'workspace',
            activeMethodId: linkedRun.methodCardId,
            activeRunId: linkedRun.id,
            activeCategory: 'all'
        });
        setDetailState(null);
        onOpenStage(linkedRun.stage);
    };

    const handleArtifactSubmit = async () => {
        if (editingRecord?.resource === 'artifacts') {
            const existing = hub.artifacts.find((artifact) => artifact.id === editingRecord.recordId);
            if (!existing) return;
            await onUpdateRecord('artifacts', existing.id, {
                ...existing,
                ...artifactDraft,
                version: existing.version
            });
        } else {
            await onCreateRecord('artifacts', artifactDraft);
        }

        setArtifactDraft({ title: '', summary: '', type: 'concept', status: 'draft' });
        setEditingRecord(null);
        setComposerMode(null);
    };

    if (isLoading && !hasCachedData) {
        return (
            <BrandedLoadingScreen
                compact
                label="Loading project hub"
                detail="Pulling together the brief, sessions, decisions, and team activity."
            />
        );
    }

    return (
        <div className="scrollbar-none h-full overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="surface-panel-strong relative z-20 overflow-visible rounded-[34px] p-6 lg:p-8">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-75', accentTheme.heroWash)} />
                        <div className={cn('absolute inset-0', accentTheme.heroGlow)} />
                    </div>
                    <div className="relative grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
                        <div>
                            <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]', accentTheme.badge)}>
                                <Layers3 className={cn('h-3.5 w-3.5', accentTheme.iconText)} />
                                Project Hub
                            </div>
                            <h1 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">{project.context.name}</h1>
                            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--foreground-soft)]">{projectSummary.summary}</p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <div ref={stageControlRef} className="relative z-30">
                                    <button
                                        type="button"
                                        onClick={() => setIsStageControlOpen((current) => !current)}
                                        className="group relative flex min-w-[8.5rem] items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 pr-9 text-center text-xs font-medium text-[var(--foreground-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--foreground)]"
                                        aria-haspopup="menu"
                                        aria-expanded={isStageControlOpen}
                                    >
                                        <div className="min-w-0 text-center">
                                            <div className="text-sm font-semibold text-[var(--foreground)]">
                                                {formatStageLabel(displayedStage)}
                                            </div>
                                            <div className="mt-0.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--foreground-muted)]">
                                                {`stage · ${stageMode}`}
                                            </div>
                                        </div>
                                        <ChevronsUpDown className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--foreground-muted)] transition-transform duration-200 group-hover:text-[var(--foreground)]" />
                                    </button>

                                    <div
                                        className={cn(
                                            'absolute left-0 top-[calc(100%+0.75rem)] z-40 w-[16.5rem] rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-strong)] p-2.5 shadow-[0_24px_52px_rgba(15,23,42,0.18)] transition-all duration-200',
                                            isStageControlOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
                                        )}
                                    >
                                        <div className="space-y-2">
                                            <button
                                                type="button"
                                                onClick={() => void handleStagePreferenceChange('auto')}
                                                className={cn(
                                                    'flex w-full items-start justify-between gap-3 rounded-[18px] border px-3 py-3 text-left transition-all duration-200',
                                                    stageMode === 'auto'
                                                        ? 'border-slate-400/18 bg-[var(--panel)] text-[var(--foreground)]'
                                                        : 'border-transparent bg-[var(--panel)]/70 text-[var(--foreground-soft)] hover:border-[var(--panel-border)] hover:text-[var(--foreground)]'
                                                )}
                                            >
                                                <div>
                                                    <div className="text-sm font-semibold">Auto</div>
                                                    <div className="mt-1 text-[11px] text-[var(--foreground-muted)]">
                                                        Follows the stage you open.
                                                    </div>
                                                </div>
                                                {stageMode === 'auto' && (
                                                    <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                                                        Active
                                                    </div>
                                                )}
                                            </button>
                                            {STAGE_PREFERENCE_OPTIONS.map((option) => (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => void handleStagePreferenceChange('manual', option.id)}
                                                    className={cn(
                                                        'flex w-full items-start justify-between gap-3 rounded-[18px] border px-3 py-3 text-left transition-all duration-200',
                                                        stageMode === 'manual' && manualStage === option.id
                                                            ? 'border-slate-400/18 bg-[var(--panel)] text-[var(--foreground)]'
                                                            : 'border-transparent bg-[var(--panel)]/70 text-[var(--foreground-soft)] hover:border-[var(--panel-border)] hover:text-[var(--foreground)]'
                                                    )}
                                                >
                                                    <div className="text-sm font-semibold">{option.label}</div>
                                                    {stageMode === 'manual' && manualStage === option.id && (
                                                        <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600">
                                                            Manual
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <HubStatChip value={`${projectSummary.members.length}`} label="members" />
                                <HubStatChip value={`${hub.activity.length}`} label="activity events" />
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <HubInsightTile
                                icon={Milestone}
                                label="Next milestone"
                                value={briefDraft.milestones || 'Set the next milestone'}
                                helper={formatDateOnly(getMetadataString(briefDraft.metadata, 'milestoneDate'), 'No deadline')}
                                accent="text-sky-600"
                                items={[]}
                                emptyState="No milestone yet."
                                onOpen={() => handleHubJump('working-setup')}
                            />
                            <HubInsightTile
                                icon={CalendarClock}
                                label="Next session"
                                value={nextSession?.title || 'No session scheduled'}
                                helper={formatDateTime(nextSession?.scheduledAt, 'No session planned')}
                                accent="text-emerald-600"
                                items={sessionPreviewItems}
                                maxItems={sessionPreviewItems.length}
                                emptyState="No session scheduled yet."
                                onOpen={() => handleHubJump('sessions')}
                            />
                            <HubInsightTile
                                icon={ClipboardList}
                                label="Open tasks"
                                value={`${openTasks.length}`}
                                helper={nextTaskDueDate ? formatDateOnly(nextTaskDueDate) : (openTasks.length > 0 ? 'No due dates' : 'Nothing open')}
                                accent="text-amber-600"
                                items={taskPreviewItems}
                                emptyState="No open tasks."
                                onOpen={() => handleHubJump('tasks')}
                            />
                            <HubInsightTile
                                icon={CheckCircle2}
                                label="Needs review"
                                value={`${reviewItems}`}
                                helper={reviewItems > 0 ? reviewHelper : `${openThreadCount} open thread${openThreadCount === 1 ? '' : 's'}`}
                                accent="text-violet-600"
                                items={reviewPreviewItems}
                                emptyState="Nothing is waiting for review right now."
                                onOpen={() => {
                                    const firstReviewItem = reviewPreviewItems[0];
                                    if (firstReviewItem?.onSelect) {
                                        firstReviewItem.onSelect();
                                        return;
                                    }
                                    handleHubJump('review');
                                }}
                            />
                        </div>
                    </div>
                    <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
                        <div className="flex items-center gap-3">
                            <AvatarCluster members={projectSummary.members} size="sm" />
                            <div>
                                <div className="text-sm font-semibold text-[var(--foreground)]">Team presence</div>
                                <div className="text-xs text-[var(--foreground-muted)]">{hub.presence.length ? formatPresenceLabel(hub.presence[0]) : 'Presence appears as collaborators move through the project.'}</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PROJECT_HUB_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                                        activeTab === tab.id
                                            ? 'border-transparent bg-slate-950 text-white'
                                            : 'border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-soft)]'
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {(error || actionError) && (
                    <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                        {error || actionError}
                    </div>
                )}

                {activeTab === 'brief' && (
                    <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
                        <div className="space-y-6">
                            <div ref={taskSectionRef} className="surface-panel-strong rounded-[30px] p-6">
                                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <SectionHeading
                                        icon={ListTodo}
                                        title="Team todo lists"
                                        compact
                                        helpEnabled={helpTooltipsEnabled}
                                        helpTitle="Todo lists"
                                        helpDescription="Global list items are shared with the team. Private list items are only for you and stay out of the shared board."
                                    />
                                    <Button variant="secondary" size="sm" onClick={() => onOpenStage('overview')}>
                                        Open Project Context
                                    </Button>
                                </div>
                                <div className="grid gap-4 xl:grid-cols-2">
                                    <TodoListPanel
                                        title="Global list"
                                        icon={ClipboardList}
                                        accent="text-sky-600"
                                        items={globalTodos}
                                        emptyState="Nothing has been added to the shared list yet."
                                        canAdd={canManageSharedTodos}
                                        canManageItems={canManageSharedTodos}
                                        onAdd={() => handleCreateCardFromScope('global-todo')}
                                        onToggle={(task) => void handleTodoToggle(task)}
                                        onOpen={(task) => setDetailState({ resource: 'tasks', record: task })}
                                        onEdit={(task) => handleEditRecord('tasks', task)}
                                        members={projectSummary.members}
                                    />
                                    <TodoListPanel
                                        title="Private list"
                                        icon={Radar}
                                        accent="text-violet-600"
                                        items={personalTodos}
                                        emptyState="Your personal list is empty."
                                        canAdd
                                        canManageItems
                                        onAdd={() => handleCreateCardFromScope('personal-todo')}
                                        onToggle={(task) => void handleTodoToggle(task)}
                                        onOpen={(task) => setDetailState({ resource: 'tasks', record: task })}
                                        onEdit={(task) => handleEditRecord('tasks', task)}
                                        members={projectSummary.members}
                                    />
                                </div>
                            </div>
                            <div className="surface-panel-strong rounded-[30px] p-6">
                                <SectionHeading
                                    icon={Users2}
                                    title="Team roles"
                                    helpEnabled={helpTooltipsEnabled}
                                    helpTitle="Team roles"
                                    helpDescription="Set a simple working role for each teammate so everyone knows who usually leads research, facilitation, design, delivery, or storytelling."
                                />
                                <div className="space-y-3">
                                    {projectSummary.members.map((member) => (
                                        <div key={member.id} className="flex flex-col gap-3 rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ${member.avatarColor}`}>{member.initials}</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-[var(--foreground)]">{member.name}</div>
                                                    <div className="text-xs text-[var(--foreground-muted)]">{member.email || member.role}</div>
                                                </div>
                                            </div>
                                            <RoundedSelect
                                                value={normalizeRole(roleAssignments[member.id] || member.role)}
                                                onChange={(value) => setRoleAssignments((current) => ({ ...current, [member.id]: value }))}
                                                options={ROLE_OPTIONS.map((role) => ({ value: role, label: role }))}
                                                buttonClassName="min-w-[220px] bg-[var(--panel-strong)]"
                                            />
                                        </div>
                                    ))}
                                    {projectSummary.pendingInvites?.map((invite) => (
                                        <div key={invite.id} className="flex flex-col gap-3 rounded-[22px] border border-dashed border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--panel-strong)] text-sm font-semibold text-[var(--foreground-muted)]">?</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-[var(--foreground)]">{invite.email}</div>
                                                    <div className="text-xs text-[var(--foreground-muted)]">Pending invite</div>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                                                {UNASSIGNED_ROLE}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div ref={workingSetupRef} className="surface-panel-strong rounded-[30px] p-6">
                                <SectionHeading icon={Target} title="Working setup" />
                                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                                    <StructuredField label="Next milestone" value={briefDraft.milestones} onChange={(value) => setBriefDraft((current) => ({ ...current, milestones: value }))} />
                                    <StructuredField
                                        label="Due date"
                                        value={getMetadataString(briefDraft.metadata, 'milestoneDate')}
                                        inputType="date"
                                        onChange={(value) => setBriefDraft((current) => ({
                                            ...current,
                                            metadata: {
                                                ...current.metadata,
                                                milestoneDate: value || null
                                            }
                                        }))}
                                    />
                                </div>
                                <PillEditor
                                    label="Working norms"
                                    values={parseListField(briefDraft.workingNorms)}
                                    suggestions={WORKING_NORM_OPTIONS}
                                    placeholder="Add a working norm"
                                    onChange={(values) => setBriefDraft((current) => ({ ...current, workingNorms: serializeListField(values) }))}
                                />
                                <PillEditor
                                    label="Key links"
                                    values={parseListField(briefDraft.keyLinks)}
                                    placeholder="Add a link or doc name"
                                    onChange={(values) => setBriefDraft((current) => ({ ...current, keyLinks: serializeListField(values) }))}
                                />
                                <div className="mt-6 flex justify-end">
                                    <Button onClick={() => void handleBriefSave()} disabled={savingBrief}>{savingBrief ? 'Saving...' : 'Save Brief'}</Button>
                                </div>
                            </div>
                            <div className="surface-panel rounded-[30px] p-6">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                    <Flag className="h-4 w-4 text-amber-500" />
                                    Responsibilities
                                </div>
                                <div className="mt-4 space-y-3">
                                    {tasksByOwner.length === 0 && (
                                        <EmptyPanelCopy text="Open tasks will appear here once work is assigned." />
                                    )}
                                    {tasksByOwner.map(({ member, tasks }) => (
                                        <div key={member.id} className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-sm font-semibold text-[var(--foreground)]">{member.name}</div>
                                                <div className="text-xs text-[var(--foreground-muted)]">{tasks.length} task{tasks.length === 1 ? '' : 's'}</div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {tasks.map((task) => (
                                                    <button
                                                        key={task.id}
                                                        type="button"
                                                        onClick={() => setDetailState({ resource: 'tasks', record: task })}
                                                        className="rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]"
                                                    >
                                                        {task.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <MiniMetric label="Role coverage" value={`${projectSummary.members.length}`} helper="active members" />
                                    <MiniMetric label="Open threads" value={`${openThreadCount}`} helper="across this hub" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'board' && (
                    <div className="space-y-6">
                        <div className="surface-panel-strong rounded-[30px] p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Board</div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <h2 className="text-2xl font-display font-semibold text-[var(--foreground)]">Compact lanes for decisions-in-motion</h2>
                                        <HelpPopover
                                            enabled={helpTooltipsEnabled}
                                            title="Board cards"
                                            description="Board cards hold work that is still moving: an insight, idea, experiment, story, risk, or dependency. Move them through lanes until they are ready for review or parked."
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button variant="secondary" onClick={() => handleCreateCardFromScope('board')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        New board card
                                    </Button>
                                    <Button variant="outline" onClick={() => handleCreateCardFromScope('global-todo')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        New task
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-5">
                            {BOARD_COLUMNS.map((column) => (
                                <div key={column.id} className="surface-panel rounded-[28px] p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-base font-semibold text-[var(--foreground)]">{column.label}</div>
                                            <div className="mt-1 text-xs text-[var(--foreground-muted)]">{cardsByColumn[column.id].length} card{cardsByColumn[column.id].length === 1 ? '' : 's'}</div>
                                        </div>
                                        <div className={cn('h-3 w-3 rounded-full', getColumnDot(column.id))} />
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {cardsByColumn[column.id].length === 0 && (
                                            <div className="rounded-[20px] border border-dashed border-[var(--panel-border)] bg-[var(--panel)] px-4 py-6 text-center text-sm text-[var(--foreground-muted)]">Empty lane</div>
                                        )}
                                        {cardsByColumn[column.id].map((card) => (
                                            <div
                                                key={card.id}
                                                onClick={() => setDetailState({ resource: 'cards', record: card })}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault();
                                                        setDetailState({ resource: 'cards', record: card });
                                                    }
                                                }}
                                                onContextMenu={(event) => {
                                                    event.preventDefault();
                                                    setContextMenu({ resource: 'cards', record: card, x: event.clientX, y: event.clientY });
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                className={cn('w-full cursor-pointer rounded-[22px] border px-4 py-4 text-left transition-transform hover:-translate-y-0.5', getBoardCardTone(card.type))}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="text-sm font-semibold text-[var(--foreground)]">{card.title}</div>
                                                        <div className="mt-2 inline-flex rounded-full border border-current/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{card.type}</div>
                                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--foreground-muted)]">
                                                            {card.ownerId && <span>{resolveMemberName(projectSummary.members, card.ownerId)}</span>}
                                                            {card.dueDate && <span>{formatDateOnly(card.dueDate)}</span>}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            const bounds = event.currentTarget.getBoundingClientRect();
                                                            setContextMenu({ resource: 'cards', record: card, x: bounds.right - 176, y: bounds.bottom + 8 });
                                                        }}
                                                        className="rounded-full p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="surface-panel-strong rounded-[30px] p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Task lane</div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <h3 className="text-xl font-display font-semibold text-[var(--foreground)]">Execution tasks</h3>
                                        <HelpPopover
                                            enabled={helpTooltipsEnabled}
                                            title="Board tasks"
                                            description="Board tasks are the concrete follow-up actions that move work forward. Use them for owners, due dates, blockers, and completion tracking."
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="min-w-[220px]">
                                        <RoundedSelect
                                            value={taskFilter}
                                            onChange={(value) => setTaskFilter(value as 'all' | TaskItem['status'])}
                                            options={[
                                                { value: 'all', label: 'All statuses' },
                                                { value: 'open', label: 'Open' },
                                                { value: 'in-progress', label: 'In progress' },
                                                { value: 'blocked', label: 'Blocked' },
                                                { value: 'done', label: 'Done' }
                                            ]}
                                            buttonClassName="bg-[var(--panel)]"
                                            panelClassName="right-0 left-auto w-[220px]"
                                        />
                                    </div>
                                    <Button variant="ghost" onClick={() => handleCreateCardFromScope('global-todo')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add task
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {visibleBoardTasks.length === 0 && (
                                    <div className="rounded-[24px] border border-dashed border-[var(--panel-border)] bg-[var(--panel)] px-4 py-8 text-sm text-[var(--foreground-muted)]">No tasks yet.</div>
                                )}
                                {visibleBoardTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => setDetailState({ resource: 'tasks', record: task })}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                setDetailState({ resource: 'tasks', record: task });
                                            }
                                        }}
                                        onContextMenu={(event) => {
                                            event.preventDefault();
                                            setContextMenu({ resource: 'tasks', record: task, x: event.clientX, y: event.clientY });
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        className="cursor-pointer rounded-[24px] border border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.12),rgba(251,191,36,0.03))] px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-semibold text-[var(--foreground)]">{task.title}</div>
                                                <div className="mt-2 inline-flex rounded-full border border-amber-400/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600">{task.status}</div>
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--foreground-muted)]">
                                                    {task.ownerId && <span>{resolveMemberName(projectSummary.members, task.ownerId)}</span>}
                                                    {task.dueDate && <span>{formatDateOnly(task.dueDate)}</span>}
                                                    {getTodoScope(task) !== 'none' && <span>{getTodoScope(task)} list</span>}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    const bounds = event.currentTarget.getBoundingClientRect();
                                                    setContextMenu({ resource: 'tasks', record: task, x: bounds.right - 176, y: bounds.bottom + 8 });
                                                }}
                                                className="rounded-full p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                            >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div ref={sessionsSectionRef} className="space-y-6">
                        <div className="surface-panel-strong rounded-[30px] p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Sessions</div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <h2 className="text-2xl font-display font-semibold text-[var(--foreground)]">Workshops and review rituals</h2>
                                        <HelpPopover
                                            enabled={helpTooltipsEnabled}
                                            title="Sessions"
                                            description="Use sessions to plan real meetings. Choose online or offline, add the people involved, and keep the meeting link or location with the session."
                                        />
                                    </div>
                                </div>
                                <Button onClick={() => {
                                    setEditingRecord(null);
                                    setSessionDraft({
                                        title: '',
                                        goal: '',
                                        agenda: '',
                                        scheduledAt: '',
                                        participantMemberIds: [],
                                        manualParticipants: '',
                                        deliveryMode: 'online',
                                        location: '',
                                        meetingUrl: ''
                                    });
                                    setSessionDetailsExpanded(false);
                                    setComposerMode('session');
                                }}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Schedule session
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {hub.sessions.length === 0 && (
                                <div className="surface-panel rounded-[28px] p-6 text-sm text-[var(--foreground-muted)]">No sessions planned yet.</div>
                            )}
                            {hub.sessions.map((session) => (
                                <div
                                    key={session.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setDetailState({ resource: 'sessions', record: session })}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setDetailState({ resource: 'sessions', record: session });
                                        }
                                    }}
                                    className="surface-panel overflow-hidden rounded-[28px] p-0 text-left transition-transform hover:-translate-y-0.5"
                                >
                                    <div className="bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(16,185,129,0.08))] px-5 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-lg font-display font-semibold text-[var(--foreground)]">{session.title}</div>
                                                <div className="mt-1 text-sm text-[var(--foreground-soft)]">{formatDateTime(session.scheduledAt, 'Time not set')}</div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <span className="rounded-full border border-white/20 bg-white/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
                                                        {formatSessionDeliveryMode(getSessionDeliveryMode(session))}
                                                    </span>
                                                    <span className="rounded-full border border-white/20 bg-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
                                                        {formatSessionStatusLabel(session.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    const bounds = event.currentTarget.getBoundingClientRect();
                                                    setContextMenu({ resource: 'sessions', record: session, x: bounds.right - 176, y: bounds.bottom + 8 });
                                                }}
                                                className="rounded-full bg-white/55 p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-white/80 hover:text-[var(--foreground)]"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 px-5 py-4">
                                        <div className="text-sm text-[var(--foreground-soft)]">{session.goal || 'Define the goal for this session.'}</div>
                                        <div className="flex flex-wrap gap-2 text-xs text-[var(--foreground-muted)]">
                                            <span>{buildSessionParticipantSummary(session, projectSummary.members)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'outcomes' && (
                    <div ref={outcomesSectionRef} className="space-y-6">
                        <div className="surface-panel-strong rounded-[30px] p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)]">
                                    <Sparkles className="h-5 w-5 text-violet-500" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Outcomes</div>
                                    <h2 className="mt-2 text-2xl font-display font-semibold text-[var(--foreground)]">Decisions and outputs belong together</h2>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="surface-panel-strong rounded-[30px] p-6">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                            <Gavel className="h-4 w-4 text-rose-500" />
                                            Decisions
                                            <HelpPopover
                                                enabled={helpTooltipsEnabled}
                                                title="Decisions"
                                                description="Decisions capture a project call. If approval is required, choose who must approve it. The card stays proposed until everyone approves. Any rejection sends it back for revisit."
                                            />
                                        </div>
                                        <div className="mt-2 text-xl font-display font-semibold text-[var(--foreground)]">Important project calls</div>
                                    </div>
                                    <Button variant="secondary" onClick={() => setComposerMode('decision')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Log decision
                                    </Button>
                                </div>
                                <div className="mt-4 space-y-4">
                                    {hub.decisions.length === 0 && <EmptyPanelCopy text="No decisions logged yet." />}
                                    {hub.decisions.map((decision) => (
                                        <div
                                            key={decision.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setDetailState({ resource: 'decisions', record: decision })}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setDetailState({ resource: 'decisions', record: decision });
                                                }
                                            }}
                                            className="w-full rounded-[24px] border border-rose-300/16 bg-[linear-gradient(180deg,rgba(244,63,94,0.10),rgba(244,63,94,0.03))] px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-[var(--foreground)]">{decision.title}</div>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <span className="inline-flex rounded-full border border-rose-400/18 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
                                                            {formatDecisionStatusLabel(decision.status)}
                                                        </span>
                                                        {getDecisionRequiresApproval(decision) && (
                                                            <span className="inline-flex rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground-soft)]">
                                                                {getDecisionApprovalSummary(decision, projectSummary.members)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        const bounds = event.currentTarget.getBoundingClientRect();
                                                        setContextMenu({ resource: 'decisions', record: decision, x: bounds.right - 176, y: bounds.bottom + 8 });
                                                    }}
                                                    className="rounded-full p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="mt-3 line-clamp-2 text-sm text-[var(--foreground-soft)]">{decision.decision || decision.background || 'No decision summary yet.'}</div>
                                            {getLinkedRun(decision, project.toolRuns) && (
                                                <div className="mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleOpenLinkedRun(decision);
                                                        }}
                                                        className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]"
                                                    >
                                                        Open source card
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="surface-panel-strong rounded-[30px] p-6">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                            <FileStack className="h-4 w-4 text-sky-500" />
                                            Outputs
                                            <HelpPopover
                                                enabled={helpTooltipsEnabled}
                                                title="Outputs"
                                                description="Outputs are reusable things the team can pick up later, like insights, concepts, experiments, story material, or attached references."
                                            />
                                        </div>
                                        <div className="mt-2 text-xl font-display font-semibold text-[var(--foreground)]">Reusable artifacts</div>
                                    </div>
                                    <Button variant="secondary" onClick={() => setComposerMode('artifact')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Capture output
                                    </Button>
                                </div>
                                <div className="mt-4 space-y-4">
                                    {hub.artifacts.length === 0 && <EmptyPanelCopy text="No outputs captured yet." />}
                                    {hub.artifacts.map((artifact) => (
                                        <div
                                            key={artifact.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setDetailState({ resource: 'artifacts', record: artifact })}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setDetailState({ resource: 'artifacts', record: artifact });
                                                }
                                            }}
                                            className="w-full rounded-[24px] border border-sky-300/16 bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(56,189,248,0.03))] px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-[var(--foreground)]">{artifact.title}</div>
                                                    <div className="mt-2 inline-flex rounded-full border border-sky-400/18 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-500">
                                                        {formatArtifactTypeLabel(artifact.type)} · {formatArtifactStatusLabel(artifact.status)}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        const bounds = event.currentTarget.getBoundingClientRect();
                                                        setContextMenu({ resource: 'artifacts', record: artifact, x: bounds.right - 176, y: bounds.bottom + 8 });
                                                    }}
                                                    className="rounded-full p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="mt-3 line-clamp-2 text-sm text-[var(--foreground-soft)]">{artifact.summary || 'No output summary yet.'}</div>
                                            {getLinkedRun(artifact, project.toolRuns) && (
                                                <div className="mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleOpenLinkedRun(artifact);
                                                        }}
                                                        className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]"
                                                    >
                                                        Open source card
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {composerMode && (
                <ModalShell
                    {...getComposerModalMeta(composerMode, editingRecord)}
                    onClose={() => {
                        setComposerMode(null);
                        setEditingRecord(null);
                    }}
                >
                    {composerMode === 'card' && (
                        <>
                            <ModalInput label="Card title" value={boardDraft.title} onChange={(value) => setBoardDraft((current) => ({ ...current, title: value }))} />
                            <ModalInput label="Summary" value={boardDraft.summary} onChange={(value) => setBoardDraft((current) => ({ ...current, summary: value }))} multiline />
                            <div className="grid gap-3 md:grid-cols-2">
                                <ModalSelect label="Type" value={boardDraft.type} onChange={(value) => setBoardDraft((current) => ({ ...current, type: value }))} options={['idea', 'insight', 'experiment', 'story', 'risk', 'dependency']} />
                                <ModalSelect label="Lane" value={boardDraft.status} onChange={(value) => setBoardDraft((current) => ({ ...current, status: value }))} options={BOARD_COLUMNS.map((column) => column.id)} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <ModalMemberSelect label="Owner" value={boardDraft.ownerId} onChange={(value) => setBoardDraft((current) => ({ ...current, ownerId: value }))} members={projectSummary.members} />
                                <ModalInput label="Due date" value={boardDraft.dueDate} onChange={(value) => setBoardDraft((current) => ({ ...current, dueDate: value }))} inputType="date" />
                            </div>
                            <ModalActions submitLabel={editingRecord?.resource === 'cards' ? 'Update card' : 'Create card'} onSubmit={() => void handleCardSubmit()} />
                        </>
                    )}
                    {composerMode === 'task' && (
                        <>
                            <ModalInput label="Task title" value={taskDraft.title} onChange={(value) => setTaskDraft((current) => ({ ...current, title: value }))} />
                            <ModalInput label="Details" value={taskDraft.details} onChange={(value) => setTaskDraft((current) => ({ ...current, details: value }))} multiline />
                            <div className="grid gap-3 md:grid-cols-2">
                                <ModalSelect label="Status" value={taskDraft.status} onChange={(value) => setTaskDraft((current) => ({ ...current, status: value }))} options={['open', 'in-progress', 'blocked', 'done']} />
                                <ModalMemberSelect label="Assignee" value={taskDraft.ownerId} onChange={(value) => setTaskDraft((current) => ({ ...current, ownerId: value }))} members={projectSummary.members} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <ModalInput label="Due date" value={taskDraft.dueDate} onChange={(value) => setTaskDraft((current) => ({ ...current, dueDate: value }))} inputType="date" />
                                <ModalSelect label="List scope" value={taskDraft.todoScope} onChange={(value) => setTaskDraft((current) => ({ ...current, todoScope: value }))} options={['none', 'global', 'personal']} />
                            </div>
                            <ModalActions submitLabel={editingRecord?.resource === 'tasks' ? 'Update task' : 'Create task'} onSubmit={() => void handleTaskSubmit()} />
                        </>
                    )}
                    {composerMode === 'session' && (
                        <>
                            <ModalInput label="Session title" value={sessionDraft.title} onChange={(value) => setSessionDraft((current) => ({ ...current, title: value }))} />
                            <ModalInput label="Goal" value={sessionDraft.goal} onChange={(value) => setSessionDraft((current) => ({ ...current, goal: value }))} multiline />
                            <ModalMultiMemberSelect
                                label="Team participants"
                                hint="Pick people from the team when they are part of the session."
                                values={sessionDraft.participantMemberIds}
                                onChange={(value) => setSessionDraft((current) => ({ ...current, participantMemberIds: value }))}
                                members={projectSummary.members}
                            />
                            <label className="block">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Time ({systemTimeZone})</div>
                                <input type="datetime-local" value={sessionDraft.scheduledAt} onChange={(event) => setSessionDraft((current) => ({ ...current, scheduledAt: event.target.value }))} className="w-full rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]" />
                                <div className="mt-2 text-xs text-[var(--foreground-muted)]">Sessions are saved using your current system timezone.</div>
                            </label>
                            <div className="grid gap-3 md:grid-cols-2">
                                <ModalSelect
                                    label="Format"
                                    value={sessionDraft.deliveryMode}
                                    onChange={(value) => setSessionDraft((current) => ({ ...current, deliveryMode: value as SessionDeliveryMode }))}
                                    options={['online', 'offline']}
                                />
                                {sessionDraft.deliveryMode === 'offline' ? (
                                    <ModalInput
                                        label="Location"
                                        value={sessionDraft.location}
                                        onChange={(value) => setSessionDraft((current) => ({ ...current, location: value }))}
                                    />
                                ) : (
                                    <ModalInput
                                        label="Meeting link"
                                        value={sessionDraft.meetingUrl}
                                        onChange={(value) => setSessionDraft((current) => ({ ...current, meetingUrl: value }))}
                                    />
                                )}
                            </div>
                            <div className="rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] p-4">
                                <button
                                    type="button"
                                    onClick={() => setSessionDetailsExpanded((current) => !current)}
                                    className="flex w-full items-center justify-between gap-3 text-left"
                                    aria-expanded={sessionDetailsExpanded}
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-[var(--foreground)]">Extra session details</div>
                                        <div className="mt-1 text-sm text-[var(--foreground-soft)]">
                                            Add agenda notes or people outside the project team only if you need them.
                                        </div>
                                    </div>
                                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-soft)]">
                                        <ChevronsUpDown className="h-4 w-4" />
                                    </div>
                                </button>
                                {sessionDetailsExpanded && (
                                    <div className="mt-4 space-y-4 border-t border-[var(--panel-border)] pt-4">
                                        <ModalInput label="Agenda" value={sessionDraft.agenda} onChange={(value) => setSessionDraft((current) => ({ ...current, agenda: value }))} multiline />
                                        <ModalInput
                                            label="Additional participants"
                                            value={sessionDraft.manualParticipants}
                                            onChange={(value) => setSessionDraft((current) => ({ ...current, manualParticipants: value }))}
                                            multiline
                                        />
                                    </div>
                                )}
                            </div>
                            <ModalActions submitLabel={editingRecord?.resource === 'sessions' ? 'Update session' : 'Create session'} onSubmit={() => void handleSessionSubmit()} />
                        </>
                    )}
                    {composerMode === 'decision' && (
                        <>
                            <ModalInput label="Decision title" value={decisionDraft.title} onChange={(value) => setDecisionDraft((current) => ({ ...current, title: value }))} />
                            <ModalInput label="Decision" value={decisionDraft.decision} onChange={(value) => setDecisionDraft((current) => ({ ...current, decision: value }))} multiline />
                            <ModalInput label="Rationale" value={decisionDraft.rationale} onChange={(value) => setDecisionDraft((current) => ({ ...current, rationale: value }))} multiline />
                            <ModalInput label="Background" value={decisionDraft.background} onChange={(value) => setDecisionDraft((current) => ({ ...current, background: value }))} multiline />
                            <ModalInput label="Options" value={decisionDraft.options} onChange={(value) => setDecisionDraft((current) => ({ ...current, options: value }))} multiline />
                            <ToggleField
                                label="Approval required"
                                value={decisionDraft.requiresApproval}
                                enabledLabel="Selected approvers must approve or reject this decision."
                                disabledLabel="No approval is needed. The decision becomes decided immediately."
                                onChange={(value) => setDecisionDraft((current) => ({
                                    ...current,
                                    requiresApproval: value,
                                    approverIds: value ? current.approverIds : []
                                }))}
                            />
                            {decisionDraft.requiresApproval && (
                                <ModalMultiMemberSelect
                                    label="Approvers"
                                    hint="Choose the teammates who must approve or reject this decision."
                                    values={decisionDraft.approverIds}
                                    onChange={(value) => setDecisionDraft((current) => ({ ...current, approverIds: value }))}
                                    members={projectSummary.members}
                                />
                            )}
                            <ModalActions submitLabel={editingRecord?.resource === 'decisions' ? 'Update decision' : 'Create decision'} onSubmit={() => void handleDecisionSubmit()} />
                        </>
                    )}
                    {composerMode === 'artifact' && (
                        <>
                            <ModalInput label="Output title" value={artifactDraft.title} onChange={(value) => setArtifactDraft((current) => ({ ...current, title: value }))} />
                            <ModalInput label="Summary" value={artifactDraft.summary} onChange={(value) => setArtifactDraft((current) => ({ ...current, summary: value }))} multiline />
                            <div className="grid gap-3 md:grid-cols-2">
                                <ModalSelect label="Type" value={artifactDraft.type} onChange={(value) => setArtifactDraft((current) => ({ ...current, type: value }))} options={['concept', 'insight', 'experiment', 'narrative', 'attachment']} />
                                <ModalSelect label="Status" value={artifactDraft.status} onChange={(value) => setArtifactDraft((current) => ({ ...current, status: value }))} options={['draft', 'ready', 'approved']} />
                            </div>
                            <ModalActions submitLabel={editingRecord?.resource === 'artifacts' ? 'Update output' : 'Create output'} onSubmit={() => void handleArtifactSubmit()} />
                        </>
                    )}
                </ModalShell>
            )}

            {detailState && (
                <ModalShell
                    {...getDetailModalMeta(detailState.resource, detailState.record.title)}
                    onClose={() => setDetailState(null)}
                >
                    <div className="space-y-4">
                        <DetailBlock label="Status" value={formatDetailStatus(detailState.record)} />
                        {'summary' in detailState.record && detailState.record.summary && <DetailBlock label="Summary" value={detailState.record.summary} />}
                        {'details' in detailState.record && detailState.record.details && <DetailBlock label="Details" value={detailState.record.details} />}
                        {'goal' in detailState.record && detailState.record.goal && <DetailBlock label="Goal" value={detailState.record.goal} />}
                        {'agenda' in detailState.record && detailState.record.agenda && <DetailBlock label="Agenda" value={detailState.record.agenda} />}
                        {'decision' in detailState.record && detailState.record.decision && <DetailBlock label="Decision" value={detailState.record.decision} />}
                        {'rationale' in detailState.record && detailState.record.rationale && <DetailBlock label="Rationale" value={detailState.record.rationale} />}
                        {'background' in detailState.record && detailState.record.background && <DetailBlock label="Background" value={detailState.record.background} />}
                        {'ownerId' in detailState.record && detailState.record.ownerId && <DetailBlock label={'summary' in detailState.record ? 'Owner' : 'Assignee'} value={resolveMemberName(projectSummary.members, detailState.record.ownerId)} />}
                        {'dueDate' in detailState.record && detailState.record.dueDate && <DetailBlock label="Due date" value={formatDateOnly(detailState.record.dueDate)} />}
                        {detailState.resource === 'sessions' && (
                            <>
                                <DetailBlock label="Format" value={formatSessionDeliveryMode(getSessionDeliveryMode(detailState.record))} />
                                <DetailBlock label="Participants" value={buildSessionParticipantSummary(detailState.record, projectSummary.members)} />
                                {getSessionDeliveryMode(detailState.record) === 'offline' && getSessionLocation(detailState.record) && (
                                    <DetailBlock label="Location" value={getSessionLocation(detailState.record)} />
                                )}
                                {getSessionDeliveryMode(detailState.record) === 'online' && getSessionMeetingUrl(detailState.record) && (
                                    <DetailBlock label="Meeting link" value={getSessionMeetingUrl(detailState.record)} />
                                )}
                            </>
                        )}
                        {detailState.resource === 'decisions' && (
                            <>
                                <DetailBlock label="Approval" value={getDecisionApprovalSummary(detailState.record, projectSummary.members)} />
                                {getDecisionRequiresApproval(detailState.record) && (
                                    <DetailBlock
                                        label="Approvers"
                                        value={getDecisionApproverIds(detailState.record).map((approverId) => {
                                            const approverName = resolveMemberName(projectSummary.members, approverId);
                                            const response = getDecisionApprovalMap(detailState.record)[approverId];
                                            return `${approverName}: ${response ? response : 'pending'}`;
                                        }).join('\n')}
                                    />
                                )}
                            </>
                        )}
                        {detailState.resource === 'artifacts' && (
                            <DetailBlock label="Output type" value={formatArtifactTypeLabel(detailState.record.type)} />
                        )}
                    </div>
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        {(detailState.resource === 'decisions' || detailState.resource === 'artifacts' || detailState.resource === 'cards')
                            && getLinkedRun(detailState.record, project.toolRuns)
                            && (
                                <Button variant="ghost" onClick={() => handleOpenLinkedRun(detailState.record)}>
                                    Open source card
                                </Button>
                            )}
                        {detailState.resource === 'decisions'
                            && isDecisionPendingForUser(detailState.record, currentUserId)
                            && (
                                <>
                                    <Button variant="ghost" onClick={() => void handleDecisionResponse(detailState.record, 'rejected')}>
                                        Reject
                                    </Button>
                                    <Button variant="secondary" onClick={() => void handleDecisionResponse(detailState.record, 'approved')}>
                                        Approve
                                    </Button>
                                </>
                            )}
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setDeleteDialog({
                                    resource: detailState.resource,
                                    id: detailState.record.id,
                                    title: detailState.record.title
                                });
                                setDetailState(null);
                            }}
                        >
                            Delete
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                if (detailState.resource === 'cards') handleEditRecord('cards', detailState.record);
                                if (detailState.resource === 'tasks') handleEditRecord('tasks', detailState.record);
                                if (detailState.resource === 'sessions') handleEditRecord('sessions', detailState.record);
                                if (detailState.resource === 'decisions') handleEditRecord('decisions', detailState.record);
                                if (detailState.resource === 'artifacts') handleEditRecord('artifacts', detailState.record);
                            }}
                        >
                            Edit
                        </Button>
                    </div>
                </ModalShell>
            )}

            {renameDialog && (
                <ModalShell
                    title="Rename item"
                    eyebrow={getRenameEyebrow(renameDialog.resource)}
                    description="Use a clear name so the team can scan Hub, cards, and review lists without opening every record."
                    icon={PencilLine}
                    tone={resolveAccentToModalTone(projectSummary.accent)}
                    accentClassName={projectSummary.accent}
                    accentMode="bar"
                    onClose={() => {
                        if (!isRenameLoading) {
                            setRenameDialog(null);
                        }
                    }}
                >
                    <ModalInput
                        label="New title"
                        value={renameDialog.nextTitle}
                        onChange={(value) => setRenameDialog((current) => current ? { ...current, nextTitle: value } : current)}
                    />
                    <ModalActions
                        submitLabel={isRenameLoading ? 'Saving...' : 'Save name'}
                        disabled={isRenameLoading}
                        onSubmit={() => void handleRenameConfirm()}
                    />
                </ModalShell>
            )}

            {contextMenu && (
                <div className="fixed z-[70] w-44 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel-strong)] p-2 shadow-[0_24px_40px_rgba(15,23,42,0.28)]" style={{ left: contextMenu.x, top: contextMenu.y }} onPointerDown={(event) => event.stopPropagation()}>
                    <button type="button" onClick={() => handleEditRecord(contextMenu.resource, contextMenu.record)} className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]">
                        <PencilLine className="h-4 w-4" />
                        Edit
                    </button>
                    <button type="button" onClick={() => void handleRename()} className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]">
                        <PencilLine className="h-4 w-4" />
                        Rename
                    </button>
                    <button type="button" onClick={() => void handleDelete()} className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400">
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                </div>
            )}
            <ConfirmDialog
                open={Boolean(deleteDialog)}
                title="Delete item"
                description={deleteDialog ? `Delete "${deleteDialog.title}" from this project hub?` : ''}
                confirmLabel="Delete"
                tone="danger"
                isLoading={isDeleteLoading}
                onClose={() => {
                    if (!isDeleteLoading) {
                        setDeleteDialog(null);
                    }
                }}
                onConfirm={() => void handleDeleteConfirm()}
            />
        </div>
    );
}

function parseRoleAssignments(members: WorkspaceProject['members'], teamRoles: string) {
    const assignments = Object.fromEntries(members.map((member) => [member.id, normalizeRole(member.role)]));
    teamRoles.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line) => {
        const [name, role] = line.split(':').map((part) => part.trim());
        const match = members.find((member) => member.name === name);
        if (match && role) assignments[match.id] = normalizeRole(role);
    });
    return assignments;
}

function buildRoleSummary(members: WorkspaceProject['members'], assignments: Record<string, string>) {
    return members.map((member) => `${member.name}: ${normalizeRole(assignments[member.id] || member.role)}`).join('\n');
}

function normalizeRole(role?: string | null) {
    if (!role || !ROLE_OPTIONS.includes(role)) {
        return UNASSIGNED_ROLE;
    }
    return role;
}

function parseListField(value: string) {
    return value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
}

function serializeListField(values: string[]) {
    return values
        .map((item) => item.trim())
        .filter(Boolean)
        .join('\n');
}

function getMetadataString(metadata: ProjectBrief['metadata'], key: string) {
    const value = metadata[key];
    return typeof value === 'string' ? value : '';
}

function getStagePreferenceMode(metadata: ProjectBrief['metadata']): StagePreferenceMode {
    return metadata.stageMode === 'manual' ? 'manual' : 'auto';
}

function getManualStagePreference(metadata: ProjectBrief['metadata']): StageId | null {
    const value = metadata.manualStage;
    return value === 'overview'
        || value === 'explore'
        || value === 'imagine'
        || value === 'implement'
        || value === 'tell-story'
        ? value
        : null;
}

function formatStageLabel(stage?: StageId | null) {
    if (!stage) return 'Overview';
    return stage.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function formatDateTime(value?: string | null, fallback: string | null = 'Not scheduled') {
    if (!value) return fallback || '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(parsed);
}

function formatDateOnly(value?: string | null, fallback: string = 'No deadline') {
    if (!value) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function getSystemTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function getComposerModalMeta(mode: Exclude<ComposerMode, null>, editingRecord: { resource: ProjectHubResource; recordId: string } | null) {
    const isEditing = Boolean(editingRecord);

    if (mode === 'card') {
        return {
            title: isEditing ? 'Edit board card' : 'New board card',
            eyebrow: 'Board card',
            description: 'Shape what the team is tracking on the board, then place it in the right lane.',
            icon: Layers3,
            tone: 'sky' as const
        };
    }

    if (mode === 'task') {
        return {
            title: isEditing ? 'Edit task' : 'New task',
            eyebrow: 'Task',
            description: 'Assign clear next steps, due dates, and whether this belongs in a shared or private list.',
            icon: ClipboardList,
            tone: 'amber' as const
        };
    }

    if (mode === 'session') {
        return {
            title: isEditing ? 'Edit session' : 'Schedule session',
            eyebrow: 'Session',
            description: 'Set the format, participants, and the exact meeting details the team will need.',
            icon: CalendarClock,
            tone: 'emerald' as const
        };
    }

    if (mode === 'decision') {
        return {
            title: isEditing ? 'Edit decision' : 'Log decision',
            eyebrow: 'Decision',
            description: 'Capture the call, why it was made, and whether approval is required before it becomes final.',
            icon: Gavel,
            tone: 'violet' as const
        };
    }

    return {
        title: isEditing ? 'Edit output' : 'Capture output',
        eyebrow: 'Output',
        description: 'Save an artifact the team can review, approve, or trace back to the source card later.',
        icon: FileStack,
        tone: 'sky' as const
    };
}

function getDetailModalMeta(resource: DetailState['resource'], title: string) {
    if (resource === 'cards') {
        return {
            title,
            eyebrow: 'Board card details',
            description: 'Review the card summary, owner, due date, and any linked source context.',
            icon: Layers3,
            tone: 'sky' as const
        };
    }

    if (resource === 'tasks') {
        return {
            title,
            eyebrow: 'Task details',
            description: 'See the current task status, assignment, and follow-up context in one place.',
            icon: ClipboardList,
            tone: 'amber' as const
        };
    }

    if (resource === 'sessions') {
        return {
            title,
            eyebrow: 'Session details',
            description: 'Check the session format, participants, and the location or meeting link before it starts.',
            icon: CalendarClock,
            tone: 'emerald' as const
        };
    }

    if (resource === 'decisions') {
        return {
            title,
            eyebrow: 'Decision details',
            description: 'Track the decision state, approval progress, and whether this still needs review.',
            icon: Gavel,
            tone: 'violet' as const
        };
    }

    return {
        title,
        eyebrow: 'Output details',
        description: 'Review the current output type, status, and linked source material.',
        icon: FileStack,
        tone: 'sky' as const
    };
}

function getRenameEyebrow(resource: ProjectHubResource) {
    if (resource === 'cards') return 'Rename board card';
    if (resource === 'tasks') return 'Rename task';
    if (resource === 'sessions') return 'Rename session';
    if (resource === 'decisions') return 'Rename decision';
    return 'Rename output';
}

function resolveAccentToModalTone(accent: string): ModalTone {
    if (accent.includes('emerald') || accent.includes('lime')) return 'emerald';
    if (accent.includes('sky') || accent.includes('cyan')) return 'sky';
    if (accent.includes('rose') || accent.includes('orange')) return 'rose';
    if (accent.includes('amber') || accent.includes('yellow')) return 'amber';
    if (accent.includes('fuchsia') || accent.includes('violet')) return 'violet';
    return 'slate';
}

function getModalToneStyles(tone: ModalTone) {
    if (tone === 'sky') {
        return {
            iconWrap: 'border-sky-200/70 bg-sky-500/12 text-sky-600 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-300',
            eyebrow: 'border-sky-200/70 bg-sky-500/10 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-200',
            glow: 'from-sky-500/22 via-sky-300/10 to-transparent'
        };
    }

    if (tone === 'emerald') {
        return {
            iconWrap: 'border-emerald-200/70 bg-emerald-500/12 text-emerald-600 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-300',
            eyebrow: 'border-emerald-200/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200',
            glow: 'from-emerald-500/22 via-emerald-300/10 to-transparent'
        };
    }

    if (tone === 'amber') {
        return {
            iconWrap: 'border-amber-200/70 bg-amber-500/12 text-amber-600 dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-300',
            eyebrow: 'border-amber-200/70 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-200',
            glow: 'from-amber-500/22 via-amber-300/10 to-transparent'
        };
    }

    if (tone === 'violet') {
        return {
            iconWrap: 'border-violet-200/70 bg-violet-500/12 text-violet-600 dark:border-violet-400/25 dark:bg-violet-400/12 dark:text-violet-300',
            eyebrow: 'border-violet-200/70 bg-violet-500/10 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/12 dark:text-violet-200',
            glow: 'from-violet-500/22 via-violet-300/10 to-transparent'
        };
    }

    if (tone === 'rose') {
        return {
            iconWrap: 'border-rose-200/70 bg-rose-500/12 text-rose-600 dark:border-rose-400/25 dark:bg-rose-400/12 dark:text-rose-300',
            eyebrow: 'border-rose-200/70 bg-rose-500/10 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/12 dark:text-rose-200',
            glow: 'from-rose-500/22 via-rose-300/10 to-transparent'
        };
    }

    return {
        iconWrap: 'border-slate-200/70 bg-slate-500/10 text-slate-600 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300',
        eyebrow: 'border-slate-200/70 bg-slate-500/8 text-slate-700 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-200',
        glow: 'from-slate-500/18 via-slate-300/10 to-transparent'
    };
}

function getColumnDot(status: CollaborationCard['status']) {
    if (status === 'open-questions') return 'bg-sky-400';
    if (status === 'in-progress') return 'bg-amber-400';
    if (status === 'ready-for-review') return 'bg-violet-400';
    if (status === 'approved') return 'bg-emerald-400';
    return 'bg-slate-400';
}

function getBoardCardTone(type: CollaborationCard['type']) {
    if (type === 'insight') return 'border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(56,189,248,0.03))]';
    if (type === 'experiment') return 'border-emerald-300/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))]';
    if (type === 'risk') return 'border-rose-300/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.10),rgba(244,63,94,0.03))]';
    if (type === 'dependency') return 'border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.10),rgba(251,191,36,0.03))]';
    if (type === 'story') return 'border-violet-300/20 bg-[linear-gradient(180deg,rgba(167,139,250,0.10),rgba(167,139,250,0.03))]';
    return 'border-slate-300/18 bg-[linear-gradient(180deg,rgba(148,163,184,0.10),rgba(148,163,184,0.03))]';
}

function HubStatChip({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex min-w-[5.25rem] flex-col items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-center">
            <div className="text-sm font-semibold text-[var(--foreground)]">{value}</div>
            <div className="mt-0.5 text-[10px] font-semibold tracking-[0.16em] text-[var(--foreground-muted)]">
                {label}
            </div>
        </div>
    );
}

function HubInsightTile({
    icon: Icon,
    label,
    value,
    helper,
    accent,
    items,
    maxItems = 4,
    emptyState,
    onOpen
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper?: string | null;
    accent: string;
    items: HubInsightItem[];
    maxItems?: number;
    emptyState: string;
    onOpen: () => void;
}) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const closeTimerRef = useRef<number | null>(null);
    const hasItems = items.length > 0;

    const openPreview = () => {
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        if (hasItems) {
            setIsPreviewOpen(true);
        }
    };

    const closePreview = () => {
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
        }

        closeTimerRef.current = window.setTimeout(() => {
            setIsPreviewOpen(false);
        }, 140);
    };

    useEffect(() => () => {
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
        }
    }, []);

    return (
        <div
            className="relative isolate z-20 overflow-visible rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4 transition-[transform,z-index] duration-200 hover:z-30 hover:-translate-y-0.5"
            onMouseEnter={openPreview}
            onMouseLeave={closePreview}
            onFocus={openPreview}
            onBlur={closePreview}
        >
            <button
                type="button"
                onClick={onOpen}
                className="w-full text-left"
            >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                    <Icon className={cn('h-4 w-4', accent)} />
                    {label}
                </div>
                <div className="mt-3 text-base font-semibold text-[var(--foreground)]">{value}</div>
                <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                    {helper || emptyState}
                </div>
            </button>

            {hasItems && (
                <div
                    className={cn(
                        'absolute left-0 right-0 top-full z-40 mt-3 rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-strong)] p-3 shadow-[0_24px_44px_rgba(15,23,42,0.2)] transition-all duration-200',
                        isPreviewOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
                    )}
                    onMouseEnter={openPreview}
                    onMouseLeave={closePreview}
                >
                    <div className="space-y-2">
                        {items.slice(0, maxItems).map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    item.onSelect?.();
                                }}
                                className="group/item relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-[16px] border border-transparent bg-[var(--panel)] px-3 py-3 text-left transition-all duration-200 hover:border-[var(--panel-border)] hover:bg-[var(--panel-strong)]"
                            >
                                <div className="flex min-w-0 items-start gap-3">
                                    {item.icon && (
                                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] transition-transform duration-200 group-hover/item:scale-105">
                                            <item.icon className={cn('h-4 w-4', item.accentText || accent)} />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-[var(--foreground)]">{item.title}</div>
                                        {item.subtitle && <div className="mt-1 text-xs text-[var(--foreground-muted)]">{item.subtitle}</div>}
                                        {item.meta && <div className="mt-1 text-xs font-medium text-[var(--foreground-soft)]">{item.meta}</div>}
                                    </div>
                                </div>
                                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--foreground-muted)] transition-all duration-200 group-hover/item:translate-x-0.5 group-hover/item:text-[var(--foreground)]" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SectionHeading({
    icon: Icon,
    title,
    compact = false,
    helpTitle,
    helpDescription,
    helpEnabled = false
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    compact?: boolean;
    helpTitle?: string;
    helpDescription?: string;
    helpEnabled?: boolean;
}) {
    return (
        <div className={compact ? '' : 'mb-5'}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                <Icon className="h-4 w-4 text-sky-500" />
                Hub section
            </div>
            <div className="mt-3 flex items-center gap-2">
                <h2 className="text-2xl font-display font-semibold text-[var(--foreground)]">{title}</h2>
                {helpTitle && helpDescription && (
                    <HelpPopover
                        enabled={helpEnabled}
                        title={helpTitle}
                        description={helpDescription}
                    />
                )}
            </div>
        </div>
    );
}

function StructuredField({ label, hint, value, onChange, multiline = false, inputType = 'text' }: { label: string; hint?: string; value: string; onChange: (value: string) => void; multiline?: boolean; inputType?: 'text' | 'date' }) {
    return <label className="mb-4 block"><div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">{label}</div>{hint && <div className="mb-2 text-sm text-[var(--foreground-muted)]">{hint}</div>}{multiline ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]" /> : <input type={inputType} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]" />}</label>;
}

function PillEditor({
    label,
    hint,
    values,
    onChange,
    suggestions = [],
    placeholder
}: {
    label: string;
    hint?: string;
    values: string[];
    onChange: (values: string[]) => void;
    suggestions?: string[];
    placeholder: string;
}) {
    const [draft, setDraft] = useState('');

    const addValue = (value: string) => {
        const nextValue = value.trim();
        if (!nextValue || values.includes(nextValue)) {
            return;
        }
        onChange([...values, nextValue]);
        setDraft('');
    };

    return (
        <div className="mb-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">{label}</div>
            {hint && <div className="mb-3 text-sm text-[var(--foreground-muted)]">{hint}</div>}
            <div className="rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] p-4">
                <div className="flex flex-wrap gap-2">
                    {values.length === 0 && (
                        <div className="text-sm text-[var(--foreground-muted)]">Nothing added yet.</div>
                    )}
                    {values.map((value) => (
                        <span key={value} className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-1.5 text-sm text-[var(--foreground-soft)]">
                            {value}
                            <button
                                type="button"
                                onClick={() => onChange(values.filter((item) => item !== value))}
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                aria-label={`Remove ${value}`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
                {suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {suggestions.filter((suggestion) => !values.includes(suggestion)).map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => addValue(suggestion)}
                                className="rounded-full border border-dashed border-[var(--panel-border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:border-solid hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                addValue(draft);
                            }
                        }}
                        placeholder={placeholder}
                        className="w-full rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
                    />
                    <Button type="button" variant="secondary" onClick={() => addValue(draft)}>
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
}

function MiniMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
    return <div className="rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4"><div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">{label}</div><div className="mt-2 text-2xl font-display font-semibold text-[var(--foreground)]">{value}</div><div className="mt-1 text-xs text-[var(--foreground-muted)]">{helper}</div></div>;
}

function EmptyPanelCopy({ text }: { text: string }) {
    return <div className="rounded-[24px] border border-dashed border-[var(--panel-border)] bg-[var(--panel)] px-4 py-8 text-sm text-[var(--foreground-muted)]">{text}</div>;
}

function ModalShell({
    title,
    eyebrow,
    description,
    icon: Icon,
    tone = 'slate',
    accentClassName,
    accentMode = 'full',
    children,
    onClose
}: {
    title: string;
    eyebrow?: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    tone?: ModalTone;
    accentClassName?: string;
    accentMode?: ModalAccentMode;
    children: React.ReactNode;
    onClose: () => void;
}) {
    const toneStyles = getModalToneStyles(tone);

    return (
        <div className="modal-backdrop-enter fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/58 p-4 backdrop-blur-md">
            <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close modal" />
            <div className="modal-panel-enter surface-panel-strong relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/10 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.34)] lg:p-7">
                {accentMode === 'full' ? (
                    <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-40 rounded-t-[32px] bg-gradient-to-br opacity-95', accentClassName ? accentClassName : toneStyles.glow)} />
                ) : (
                    <div className={cn('pointer-events-none absolute inset-x-10 top-3 h-1 rounded-full bg-gradient-to-r opacity-75', accentClassName ? accentClassName : toneStyles.glow)} />
                )}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/0 via-white/70 to-white/0 opacity-70 dark:via-white/20" />
                <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        {(eyebrow || Icon) && (
                            <div className="flex flex-wrap items-center gap-3">
                                {Icon && (
                                    <div className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[0_14px_32px_rgba(15,23,42,0.12)]', toneStyles.iconWrap)}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                )}
                                {eyebrow && (
                                    <div className={cn('rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.08em]', toneStyles.eyebrow)}>
                                        {eyebrow}
                                    </div>
                                )}
                            </div>
                        )}
                        <h3 className="mt-4 text-2xl font-display font-semibold text-[var(--foreground)] lg:text-[2rem]">{title}</h3>
                        {description && (
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)] lg:text-[0.95rem]">{description}</p>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
                </div>
                <div className="relative mt-6 space-y-4">{children}</div>
            </div>
        </div>
    );
}

function ModalInput({ label, value, onChange, multiline = false, inputType = 'text' }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; inputType?: 'text' | 'date' }) {
    return (
        <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</div>
            {multiline ? (
                <AutoSizeTextarea value={value} onChange={onChange} />
            ) : (
                <input type={inputType} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]" />
            )}
        </label>
    );
}

function ModalSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
    return <label className="block"><div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</div><RoundedSelect value={value} onChange={onChange} options={options.map((option) => ({ value: option, label: option }))} /></label>;
}

function ModalMemberSelect({ label, value, onChange, members }: { label: string; value: string; onChange: (value: string) => void; members: WorkspaceProject['members'] }) {
    return <label className="block"><div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</div><RoundedSelect value={value} onChange={onChange} placeholder="Unassigned" options={[{ value: '', label: 'Unassigned' }, ...members.map((member) => ({ value: member.id, label: member.name }))]} /></label>;
}

function ModalMultiMemberSelect({
    label,
    hint,
    values,
    onChange,
    members
}: {
    label: string;
    hint?: string;
    values: string[];
    onChange: (value: string[]) => void;
    members: WorkspaceProject['members'];
}) {
    return (
        <div className="block">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</div>
            {hint && <div className="mb-3 text-sm text-[var(--foreground-muted)]">{hint}</div>}
            <div className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] p-3">
                <div className="flex flex-wrap gap-2">
                    {members.map((member) => {
                        const isActive = values.includes(member.id);
                        return (
                            <button
                                key={member.id}
                                type="button"
                                onClick={() => onChange(
                                    isActive
                                        ? values.filter((value) => value !== member.id)
                                        : [...values, member.id]
                                )}
                                className={cn(
                                    'rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                                        : 'border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-soft)] hover:text-[var(--foreground)]'
                                )}
                            >
                                {member.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ToggleField({
    label,
    value,
    enabledLabel,
    disabledLabel,
    onChange
}: {
    label: string;
    value: boolean;
    enabledLabel: string;
    disabledLabel: string;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</div>
                    <div className="mt-2 text-sm text-[var(--foreground-soft)]">{value ? enabledLabel : disabledLabel}</div>
                </div>
                <button
                    type="button"
                    onClick={() => onChange(!value)}
                    className={cn(
                        'inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors',
                        value ? 'bg-slate-900 dark:bg-white' : 'bg-[var(--panel-strong)]'
                    )}
                    aria-pressed={value}
                >
                    <span
                        className={cn(
                            'h-6 w-6 rounded-full bg-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition-transform dark:bg-slate-900',
                            value ? 'translate-x-6 dark:bg-slate-900' : 'translate-x-0'
                        )}
                    />
                </button>
            </div>
        </div>
    );
}

function ModalActions({ onSubmit, submitLabel = 'Save', disabled = false }: { onSubmit: () => void; submitLabel?: string; disabled?: boolean }) {
    return <div className="flex justify-end"><Button onClick={onSubmit} disabled={disabled}>{submitLabel}</Button></div>;
}

function AutoSizeTextarea({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        textarea.style.height = '0px';
        textarea.style.height = `${Math.max(56, textarea.scrollHeight)}px`;
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            rows={2}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full resize-none overflow-hidden rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]"
        />
    );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
    return <div className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4"><div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</div><div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground-soft)]">{value}</div></div>;
}

function formatSessionDeliveryMode(mode: SessionDeliveryMode) {
    return mode === 'offline' ? 'Offline' : 'Online';
}

function formatSessionStatusLabel(status: ProjectSession['status']) {
    if (status === 'in-progress') return 'In progress';
    if (status === 'completed') return 'Completed';
    if (status === 'canceled') return 'Canceled';
    return 'Planned';
}

function formatDecisionStatusLabel(status: DecisionLogEntry['status']) {
    if (status === 'decided') return 'Decided';
    if (status === 'revisit') return 'Needs revisit';
    return 'Proposed';
}

function formatArtifactTypeLabel(type: ProjectArtifact['type']) {
    if (type === 'concept') return 'Concept';
    if (type === 'experiment') return 'Experiment';
    if (type === 'narrative') return 'Narrative';
    if (type === 'attachment') return 'Attachment';
    return 'Insight';
}

function formatArtifactStatusLabel(status: ProjectArtifact['status']) {
    if (status === 'ready') return 'Ready';
    if (status === 'approved') return 'Approved';
    return 'Draft';
}

function formatDetailStatus(record: DetailState['record']) {
    if ('decision' in record) {
        return formatDecisionStatusLabel(record.status);
    }

    if ('agenda' in record && 'goal' in record) {
        return formatSessionStatusLabel(record.status);
    }

    if ('type' in record && 'summary' in record && 'pinned' in record) {
        return formatArtifactStatusLabel(record.status);
    }

    return record.status;
}

function TodoListPanel({
    title,
    icon: Icon,
    accent,
    items,
    emptyState,
    canAdd,
    canManageItems,
    onAdd,
    onToggle,
    onOpen,
    onEdit,
    members
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    items: TaskItem[];
    emptyState: string;
    canAdd: boolean;
    canManageItems: boolean;
    onAdd: () => void;
    onToggle: (task: TaskItem) => void;
    onOpen: (task: TaskItem) => void;
    onEdit: (task: TaskItem) => void;
    members: WorkspaceProject['members'];
}) {
    return (
        <div className="rounded-[26px] border border-[var(--panel-border)] bg-[var(--panel)] p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                        <Icon className={cn('h-4 w-4', accent)} />
                        {title}
                    </div>
                    <div className="mt-2 text-sm text-[var(--foreground-soft)]">{items.length} item{items.length === 1 ? '' : 's'}</div>
                </div>
                {canAdd && (
                    <Button size="sm" variant="secondary" onClick={onAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                    </Button>
                )}
            </div>
            <div className="mt-4 space-y-3">
                {items.length === 0 && <EmptyPanelCopy text={emptyState} />}
                {items.map((task) => (
                    <div key={task.id} className="rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-4">
                        <div className="flex items-start gap-3">
                            <button
                                type="button"
                                onClick={() => onToggle(task)}
                                disabled={!canManageItems}
                                className={cn(
                                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-55',
                                    task.status === 'done'
                                        ? 'border-emerald-400 bg-emerald-500 text-white'
                                        : 'border-[var(--panel-border)] bg-[var(--panel)] text-transparent'
                                )}
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <button type="button" onClick={() => onOpen(task)} className="w-full text-left">
                                    <div className={cn('text-sm font-semibold text-[var(--foreground)]', task.status === 'done' && 'line-through opacity-70')}>
                                        {task.title}
                                    </div>
                                </button>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--foreground-muted)]">
                                    {task.ownerId && <span>{resolveMemberName(members, task.ownerId)}</span>}
                                    {task.dueDate && <span>{formatDateOnly(task.dueDate)}</span>}
                                </div>
                            </div>
                            <button type="button" disabled={!canManageItems} onClick={() => onEdit(task)} className="rounded-full p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-55">
                                <PencilLine className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getTodoScope(task: TaskItem) {
    const value = task.metadata?.todoScope;
    return value === 'global' || value === 'personal' ? value : 'none';
}

function resolveMemberName(members: WorkspaceProject['members'], memberId?: string | null) {
    if (!memberId) return 'Unassigned';
    return members.find((member) => member.id === memberId)?.name || 'Unknown teammate';
}

function toLocalDateTimeInput(value?: string | null) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - offset * 60_000);
    return adjusted.toISOString().slice(0, 16);
}


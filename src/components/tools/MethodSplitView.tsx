import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDownCircle, Bot, ChevronDown, ChevronLeft, ChevronUp, CircleHelp, Expand, FileStack, Gavel, LayoutGrid, ListTodo, MessageSquareMore, MoreHorizontal, PencilLine, Plus, Send, Sparkles, Trash2, Workflow, X, Zap } from 'lucide-react';

import { SpotlightGuide } from '@/components/guide/SpotlightGuide';
import { Button } from '@/components/ui/Button';
import { RoundedSelect } from '@/components/ui/RoundedSelect';
import { cn } from '@/lib/utils';
import { getGuideProgress } from '@/data/onboarding';
import { CollaborationCard, CommentThread, DecisionLogEntry, GuideFlowVariant, MethodCard, MethodCardLayout, OnboardingStepId, ProjectArtifact, ProjectContext, ProjectHubData, TaskItem, ToolRun } from '@/types';
import { aiGateway } from '@/lib/services/aiGateway';

interface MethodSplitViewProps {
    card: MethodCard;
    context: ProjectContext;
    existingRun?: ToolRun;
    hub: ProjectHubData;
    isHubLoading?: boolean;
    onCreateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateHubRecord: <TResource extends 'cards' | 'artifacts' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
    onDeleteHubRecord: (resource: 'cards' | 'artifacts' | 'decisions' | 'threads' | 'tasks', id: string) => Promise<unknown>;
    onSave: (run: Partial<ToolRun>) => void;
    onBack: () => void;
    layout?: MethodCardLayout;
    guideStep?: OnboardingStepId | null;
    guideVariant?: GuideFlowVariant | null;
    onGuideStepChange?: (step: OnboardingStepId | null) => void;
    onDismissGuide?: () => void;
}

const createAiResponseEntry = (prompt: string, response: string) => ({
    prompt,
    response,
    timestamp: Date.now()
});

const STAGE_THEMES = {
    explore: {
        accentText: 'text-emerald-600 dark:text-emerald-300',
        accentBorder: 'border-emerald-200 dark:border-emerald-400/24',
        accentSoft: 'bg-emerald-500/7 dark:bg-emerald-400/10',
        accentSolid: 'bg-emerald-600 dark:bg-emerald-500',
        accentHover: 'hover:border-emerald-300 hover:text-emerald-700 dark:hover:border-emerald-400/34 dark:hover:text-emerald-200',
        accentGradient: 'from-emerald-500/24 via-emerald-300/10 to-transparent',
        accentGlow: 'bg-emerald-400/18'
    },
    imagine: {
        accentText: 'text-rose-600 dark:text-rose-300',
        accentBorder: 'border-rose-200 dark:border-rose-400/24',
        accentSoft: 'bg-rose-500/7 dark:bg-rose-400/10',
        accentSolid: 'bg-rose-600 dark:bg-rose-500',
        accentHover: 'hover:border-rose-300 hover:text-rose-700 dark:hover:border-rose-400/34 dark:hover:text-rose-200',
        accentGradient: 'from-rose-500/24 via-rose-300/10 to-transparent',
        accentGlow: 'bg-rose-400/18'
    },
    implement: {
        accentText: 'text-amber-600 dark:text-amber-300',
        accentBorder: 'border-amber-200 dark:border-amber-400/24',
        accentSoft: 'bg-amber-500/7 dark:bg-amber-400/10',
        accentSolid: 'bg-amber-600 dark:bg-amber-500',
        accentHover: 'hover:border-amber-300 hover:text-amber-700 dark:hover:border-amber-400/34 dark:hover:text-amber-200',
        accentGradient: 'from-amber-500/24 via-amber-300/10 to-transparent',
        accentGlow: 'bg-amber-400/18'
    },
    'tell-story': {
        accentText: 'text-sky-600 dark:text-sky-300',
        accentBorder: 'border-sky-200 dark:border-sky-400/24',
        accentSoft: 'bg-sky-500/7 dark:bg-sky-400/10',
        accentSolid: 'bg-sky-600 dark:bg-sky-500',
        accentHover: 'hover:border-sky-300 hover:text-sky-700 dark:hover:border-sky-400/34 dark:hover:text-sky-200',
        accentGradient: 'from-sky-500/24 via-sky-300/10 to-transparent',
        accentGlow: 'bg-sky-400/18'
    }
} as const;

type StageTheme = (typeof STAGE_THEMES)[keyof typeof STAGE_THEMES];
type TeamQuickAddMode = 'thread' | 'card' | 'artifact' | 'decision' | 'task' | null;
type TeamCollectionMode = Exclude<TeamQuickAddMode, null>;
type TeamEditableResource = 'threads' | 'cards' | 'artifacts' | 'decisions' | 'tasks';
type TeamEditableRecord = CommentThread | CollaborationCard | ProjectArtifact | DecisionLogEntry | TaskItem;
type TeamEditorState = {
    resource: TeamEditableResource;
    record: TeamEditableRecord;
    draft: Record<string, string | undefined>;
};
type TeamDeleteState = {
    resource: TeamEditableResource;
    recordId: string;
    title: string;
};
type FacilitatorDockEdge = 'left' | 'right' | 'top' | 'bottom';
type FacilitatorDockAnchor = {
    edge: FacilitatorDockEdge;
    offset: number;
};
type FacilitatorDockBounds = {
    width: number;
    height: number;
};
type FacilitatorDockSize = {
    width: number;
    height: number;
};

const FACILITATOR_DOCK_STORAGE_KEY = 'method-ai-facilitator-dock-v1';
const FACILITATOR_EDGE_PADDING = 24;
const FACILITATOR_DOCK_GAP = 14;
const FACILITATOR_DRAG_THRESHOLD = 8;
const FACILITATOR_PANEL_WIDTH = 320;
const FACILITATOR_PANEL_HEIGHT = 430;
const DEFAULT_FACILITATOR_DOCK: FacilitatorDockAnchor = { edge: 'right', offset: 96 };
const DEFAULT_FACILITATOR_DOCK_SIZE: FacilitatorDockSize = { width: 184, height: 64 };

export function MethodSplitView({
    card,
    context,
    existingRun,
    hub,
    isHubLoading = false,
    onCreateHubRecord,
    onUpdateHubRecord,
    onDeleteHubRecord,
    onSave,
    onBack,
    layout = 'classic',
    guideStep,
    guideVariant,
    onGuideStepChange,
    onDismissGuide
}: MethodSplitViewProps) {
    const [responses, setResponses] = useState(existingRun?.aiResponses || []);
    const [isLoading, setIsLoading] = useState(false);
    const [isFacilitatorOpen, setIsFacilitatorOpen] = useState(false);
    const [facilitatorDockAnchor, setFacilitatorDockAnchor] = useState<FacilitatorDockAnchor>(() => readStoredFacilitatorDock());
    const [facilitatorDockBounds, setFacilitatorDockBounds] = useState<FacilitatorDockBounds>({ width: 0, height: 0 });
    const [facilitatorDockSize, setFacilitatorDockSize] = useState<FacilitatorDockSize>(DEFAULT_FACILITATOR_DOCK_SIZE);
    const [isFacilitatorDragging, setIsFacilitatorDragging] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isMobileAiPanelOpen, setIsMobileAiPanelOpen] = useState(false);
    const [isReferencePreviewOpen, setIsReferencePreviewOpen] = useState(false);
    const [isReferenceHelpOpen, setIsReferenceHelpOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<'ai' | 'team'>('ai');
    const [isImmersiveDesktopViewport, setIsImmersiveDesktopViewport] = useState(
        () => (typeof window === 'undefined' ? false : window.innerWidth >= 1280)
    );
    const [isImmersiveSummaryCollapsed, setIsImmersiveSummaryCollapsed] = useState(
        () => (typeof window === 'undefined' ? false : window.innerHeight < 940)
    );
    const [threadDraft, setThreadDraft] = useState({ title: '', body: '', nextStep: '' });
    const [captureDraft, setCaptureDraft] = useState({ type: 'artifact', title: '', summary: '', status: 'draft' });
    const [teamQuickAddMode, setTeamQuickAddMode] = useState<TeamQuickAddMode>(null);
    const [activeTeamCollection, setActiveTeamCollection] = useState<TeamCollectionMode | null>(null);
    const [teamItemMenuKey, setTeamItemMenuKey] = useState<string | null>(null);
    const [teamEditorState, setTeamEditorState] = useState<TeamEditorState | null>(null);
    const [teamDeleteState, setTeamDeleteState] = useState<TeamDeleteState | null>(null);
    const shellRef = useRef<HTMLDivElement | null>(null);
    const facilitatorLauncherRef = useRef<HTMLButtonElement | null>(null);
    const facilitatorDragStateRef = useRef<{ pointerId: number; startX: number; startY: number; moved: boolean } | null>(null);
    const suppressFacilitatorToggleRef = useRef(false);
    const hasPersistedResponsesRef = useRef(false);
    const onSaveRef = useRef(onSave);
    const referenceHeaderRef = useRef<HTMLDivElement | null>(null);
    const referenceTabsRef = useRef<HTMLDivElement | null>(null);
    const immersiveDesktopControlsRef = useRef<HTMLDivElement | null>(null);
    const immersiveMobileControlsRef = useRef<HTMLDivElement | null>(null);
    const referenceHelpRef = useRef<HTMLDivElement | null>(null);
    const promptBoardRef = useRef<HTMLDivElement | null>(null);

    const referencePages = card.referencePages?.length
        ? card.referencePages
        : [{ id: `${card.id}-front`, label: 'Card Front', image: card.image }];
    const [activeReferencePageId, setActiveReferencePageId] = useState(referencePages[0].id);
    const theme = STAGE_THEMES[card.stage as keyof typeof STAGE_THEMES] || STAGE_THEMES.explore;

    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    useEffect(() => {
        const shell = shellRef.current;
        if (!shell) {
            return;
        }

        const updateBounds = () => {
            setFacilitatorDockBounds({
                width: shell.clientWidth,
                height: shell.clientHeight
            });
        };

        updateBounds();

        const observer = new ResizeObserver(updateBounds);
        observer.observe(shell);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const launcher = facilitatorLauncherRef.current;
        if (!launcher) {
            return;
        }

        const updateSize = () => {
            setFacilitatorDockSize({
                width: launcher.offsetWidth,
                height: launcher.offsetHeight
            });
        };

        updateSize();

        const observer = new ResizeObserver(updateSize);
        observer.observe(launcher);
        return () => observer.disconnect();
    }, [isFacilitatorOpen]);

    useEffect(() => {
        if (!facilitatorDockBounds.width || !facilitatorDockBounds.height) {
            return;
        }

        setFacilitatorDockAnchor((current) => clampFacilitatorDockAnchor(current, facilitatorDockBounds, facilitatorDockSize));
    }, [facilitatorDockBounds, facilitatorDockSize]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(FACILITATOR_DOCK_STORAGE_KEY, JSON.stringify(facilitatorDockAnchor));
    }, [facilitatorDockAnchor]);

    useEffect(() => {
        if (!hasPersistedResponsesRef.current) {
            hasPersistedResponsesRef.current = true;
            return;
        }

        onSaveRef.current({ aiResponses: responses });
    }, [responses]);

    const activeReferencePage = referencePages.find(page => page.id === activeReferencePageId) || referencePages[0];
    const isImmersiveLayout = layout === 'immersive';
    const runId = existingRun?.id || null;
    const runThreads = runId ? hub.threads.filter((thread) => thread.entityType === 'tool-run' && thread.entityId === runId) : [];
    const linkedCards = runId ? hub.cards.filter((item) => item.linkedRunId === runId) : [];
    const linkedArtifacts = runId ? hub.artifacts.filter((item) => item.linkedRunId === runId) : [];
    const linkedTasks = runId ? hub.tasks.filter((item) => item.linkedEntityType === 'tool-run' && item.linkedEntityId === runId) : [];
    const linkedDecisions = runId ? hub.decisions.filter((item) => String(item.metadata.linkedRunId || '') === runId) : [];
    const cardPagesGuide = guideVariant ? getGuideProgress(guideVariant, 'card-pages') : null;
    const cardAiGuide = guideVariant ? getGuideProgress(guideVariant, 'card-ai') : null;
    const facilitatorDockStyle = getFacilitatorDockStyle(facilitatorDockAnchor, facilitatorDockBounds, facilitatorDockSize);
    const facilitatorPanelStyle = getFacilitatorPanelStyle(facilitatorDockAnchor, facilitatorDockBounds, facilitatorDockSize);
    const desktopPanelContent = activePanel === 'ai'
        ? {
            eyebrow: 'Prompt Board',
            title: 'Facilitate live with context',
            description: 'Generate the next prompt, pressure-test the conversation, and keep the group moving without leaving the card.',
            chip: 'Live facilitation'
        }
        : {
            eyebrow: 'Team Collaboration',
            title: 'Capture what the session creates',
            description: 'Turn workshop moments into shared cards, tasks, decisions, and next steps while the team is still in flow.',
            chip: 'Outcome capture'
        };
    const classicPanelContent = activePanel === 'ai'
        ? {
            eyebrow: 'Prompt Board',
            title: 'AI Facilitation',
            description: 'Use the prompts on the right while the reference card stays visible and the session stays in flow.'
        }
        : {
            eyebrow: 'Team Collaboration',
            title: 'Capture Team Output',
            description: 'Save follow-ups, tasks, and decisions from this method run without leaving the card.'
        };

    useEffect(() => {
        if (!isReferencePreviewOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsReferencePreviewOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isReferencePreviewOpen]);

    useEffect(() => {
        if (!isReferenceHelpOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!referenceHelpRef.current?.contains(event.target as Node)) {
                setIsReferenceHelpOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsReferenceHelpOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isReferenceHelpOpen]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const updateViewportMode = () => {
            setIsImmersiveDesktopViewport(window.innerWidth >= 1280);
        };

        updateViewportMode();
        window.addEventListener('resize', updateViewportMode);

        return () => window.removeEventListener('resize', updateViewportMode);
    }, []);

    useEffect(() => {
        if (guideStep === 'card-ai') {
            setActivePanel('ai');
            if (!isImmersiveDesktopViewport) {
                setIsMobileAiPanelOpen(true);
            }
        }
    }, [guideStep, isImmersiveDesktopViewport]);

    useEffect(() => {
        if (!teamItemMenuKey) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!(event.target instanceof HTMLElement)) {
                return;
            }

            if (!event.target.closest('[data-team-item-menu]')) {
                setTeamItemMenuKey(null);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [teamItemMenuKey]);

    const referencePreviewShellStyle: React.CSSProperties = {
        background: 'linear-gradient(180deg, var(--panel-strong), var(--panel))'
    };

    const referencePreviewGridStyle: React.CSSProperties = {
        backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--line) 100%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--line) 100%, transparent) 1px, transparent 1px)',
        backgroundSize: '28px 28px'
    };

    const buildAiResponse = (prompt: string) => {
        const activeContext = [
            context.background && `Background: ${context.background}`,
            context.objectives && `Goal: ${context.objectives}`,
            context.assumptions && `Watchout: ${context.assumptions}`
        ].filter(Boolean).slice(0, 2);
        const suggestedPrompts = card.aiPrompts.slice(0, 2).map(item => item.label).join(' / ');

        return [
            `For ${context.name || 'this project'}, use ${card.title} to keep the team focused on the method outcome.`,
            activeContext.length > 0
                ? activeContext.join('\n')
                : 'Project context is still light, so start by clarifying the goal, audience, and constraints before running the exercise.',
            `Next move: turn your question into one concrete prompt for the group, then capture 3-5 signals before converging.`,
            `Suggested shortcuts: ${suggestedPrompts || 'Use the prompt board to generate a first pass.'}`,
            `Your ask: ${prompt}`
        ].join('\n\n');
    };

    const appendAiResponse = (prompt: string, response: string) => {
        setResponses(previous => [...previous, createAiResponseEntry(prompt, response)]);
    };

    const handlePromptClick = async (promptTemplate: string, promptLabel: string) => {
        setIsLoading(true);
        setIsFacilitatorOpen(true);

        try {
            const response = await aiGateway.promptBoard({
                methodId: card.id,
                methodTitle: card.title,
                stage: card.stage,
                project: context,
                promptLabel,
                promptTemplate
            });

            appendAiResponse(promptTemplate, response.reply);
        } catch (error) {
            console.error('Failed to run prompt board request', error);
            appendAiResponse(promptTemplate, 'The local facilitator could not prepare a response. Try again, or continue with a manual prompt.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChatSubmit = async () => {
        const trimmedInput = chatInput.trim();
        if (!trimmedInput || isLoading) return;

        setIsLoading(true);
        setChatInput('');
        setIsFacilitatorOpen(true);

        try {
            const response = await aiGateway.facilitatorChat({
                methodId: card.id,
                methodTitle: card.title,
                stage: card.stage,
                project: context,
                message: trimmedInput,
                history: responses
            });

            appendAiResponse(trimmedInput, response.reply);
        } catch (error) {
            console.error('Failed to run facilitator chat request', error);
            appendAiResponse(trimmedInput, buildAiResponse(trimmedInput));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateThread = async () => {
        if (!runId || !threadDraft.body.trim()) {
            return;
        }

        await onCreateHubRecord('threads', {
            entityType: 'tool-run',
            entityId: runId,
            title: threadDraft.title || `${card.title} follow-up`,
            body: threadDraft.body,
            nextStep: threadDraft.nextStep,
            status: 'open'
        });
        setThreadDraft({ title: '', body: '', nextStep: '' });
        setTeamQuickAddMode(null);
    };

    const handleCaptureOutcome = async () => {
        if (!runId || !captureDraft.title.trim()) {
            return;
        }

        if (captureDraft.type === 'artifact') {
            await onCreateHubRecord('artifacts', {
                title: captureDraft.title,
                summary: captureDraft.summary,
                type: 'concept',
                stage: card.stage,
                status: captureDraft.status,
                linkedRunId: runId
            });
        } else if (captureDraft.type === 'card') {
            await onCreateHubRecord('cards', {
                title: captureDraft.title,
                summary: captureDraft.summary,
                type: 'idea',
                stage: card.stage,
                status: 'ready-for-review',
                linkedRunId: runId
            });
        } else if (captureDraft.type === 'task') {
            await onCreateHubRecord('tasks', {
                title: captureDraft.title,
                details: captureDraft.summary,
                stage: card.stage,
                status: 'open',
                linkedEntityType: 'tool-run',
                linkedEntityId: runId
            });
        } else {
            await onCreateHubRecord('decisions', {
                title: captureDraft.title,
                background: captureDraft.summary,
                decision: captureDraft.summary || captureDraft.title,
                options: '',
                rationale: '',
                status: 'decided',
                metadata: {
                    linkedRunId: runId,
                    requiresApproval: false
                }
            });
        }

        setCaptureDraft({ type: 'artifact', title: '', summary: '', status: 'draft' });
        setTeamQuickAddMode(null);
    };

    const openTeamQuickAdd = (mode: Exclude<TeamQuickAddMode, null>) => {
        setTeamQuickAddMode(mode);
        setActiveTeamCollection(null);
        setTeamItemMenuKey(null);

        if (mode === 'thread') {
            return;
        }

        setCaptureDraft({
            type: mode,
            title: '',
            summary: '',
            status: mode === 'artifact' ? 'draft' : 'draft'
        });
    };

    const toggleTeamCollection = (mode: TeamCollectionMode) => {
        setActiveTeamCollection((current) => current === mode ? null : mode);
        setTeamQuickAddMode(null);
        setTeamItemMenuKey(null);
    };

    const handleOpenTeamEditor = (resource: TeamEditableResource, record: TeamEditableRecord) => {
        setTeamEditorState({
            resource,
            record,
            draft: createTeamEditorDraft(resource, record)
        });
        setTeamItemMenuKey(null);
    };

    const handleSaveTeamEditor = async () => {
        if (!teamEditorState) {
            return;
        }

        const { resource, record, draft } = teamEditorState;

        if (resource === 'threads') {
            const thread = record as CommentThread;
            await onUpdateHubRecord('threads', thread.id, {
                ...thread,
                title: (draft.title || '').trim() || thread.title,
                body: draft.body || '',
                nextStep: draft.nextStep || '',
                status: draft.status || thread.status,
                version: thread.version
            });
        } else if (resource === 'cards') {
            const linkedCard = record as CollaborationCard;
            await onUpdateHubRecord('cards', linkedCard.id, {
                ...linkedCard,
                title: (draft.title || '').trim() || linkedCard.title,
                summary: draft.summary || '',
                type: draft.type || linkedCard.type,
                status: draft.status || linkedCard.status,
                version: linkedCard.version
            });
        } else if (resource === 'artifacts') {
            const artifact = record as ProjectArtifact;
            await onUpdateHubRecord('artifacts', artifact.id, {
                ...artifact,
                title: (draft.title || '').trim() || artifact.title,
                summary: draft.summary || '',
                type: draft.type || artifact.type,
                status: draft.status || artifact.status,
                version: artifact.version
            });
        } else if (resource === 'decisions') {
            const decision = record as DecisionLogEntry;
            await onUpdateHubRecord('decisions', decision.id, {
                ...decision,
                title: (draft.title || '').trim() || decision.title,
                background: draft.background || '',
                options: draft.options || '',
                decision: draft.decision || '',
                rationale: draft.rationale || '',
                version: decision.version
            });
        } else {
            const task = record as TaskItem;
            await onUpdateHubRecord('tasks', task.id, {
                ...task,
                title: (draft.title || '').trim() || task.title,
                details: draft.details || '',
                status: draft.status || task.status,
                version: task.version
            });
        }

        setTeamEditorState(null);
    };

    const handleConfirmTeamDelete = async () => {
        if (!teamDeleteState) {
            return;
        }

        await onDeleteHubRecord(teamDeleteState.resource, teamDeleteState.recordId);
        setTeamDeleteState(null);
        setTeamItemMenuKey(null);
    };

    const activeTeamItems = activeTeamCollection
        ? buildTeamCollectionItems(activeTeamCollection, {
            runThreads,
            linkedCards,
            linkedArtifacts,
            linkedDecisions,
            linkedTasks
        })
        : [];

    const handleFacilitatorPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) {
            return;
        }

        facilitatorDragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            moved: false
        };

        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleFacilitatorPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
        const dragState = facilitatorDragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) {
            return;
        }

        const shellRect = shellRef.current?.getBoundingClientRect();
        if (!shellRect) {
            return;
        }

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;

        if (!dragState.moved && Math.hypot(deltaX, deltaY) < FACILITATOR_DRAG_THRESHOLD) {
            return;
        }

        if (!dragState.moved) {
            dragState.moved = true;
            setIsFacilitatorDragging(true);
        }

        event.preventDefault();

        const distances = [
            { edge: 'left' as const, distance: Math.abs(event.clientX - shellRect.left) },
            { edge: 'right' as const, distance: Math.abs(shellRect.right - event.clientX) },
            { edge: 'top' as const, distance: Math.abs(event.clientY - shellRect.top) },
            { edge: 'bottom' as const, distance: Math.abs(shellRect.bottom - event.clientY) }
        ];
        const nearestEdge = distances.reduce((closest, next) => next.distance < closest.distance ? next : closest);
        const pointerX = event.clientX - shellRect.left - facilitatorDockSize.width / 2;
        const pointerY = event.clientY - shellRect.top - facilitatorDockSize.height / 2;
        const nextAnchor = nearestEdge.edge === 'left' || nearestEdge.edge === 'right'
            ? { edge: nearestEdge.edge, offset: pointerY }
            : { edge: nearestEdge.edge, offset: pointerX };

        setFacilitatorDockAnchor(clampFacilitatorDockAnchor(nextAnchor, {
            width: shellRect.width,
            height: shellRect.height
        }, facilitatorDockSize));
    };

    const handleFacilitatorPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
        const dragState = facilitatorDragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) {
            return;
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        if (dragState.moved) {
            suppressFacilitatorToggleRef.current = true;
            window.setTimeout(() => {
                suppressFacilitatorToggleRef.current = false;
            }, 140);
        }

        facilitatorDragStateRef.current = null;
        setIsFacilitatorDragging(false);
    };

    const handleOpenFacilitator = () => {
        if (suppressFacilitatorToggleRef.current) {
            suppressFacilitatorToggleRef.current = false;
            return;
        }

        setIsFacilitatorOpen(true);
    };

    const handleSelectReferencePage = (pageId: string) => {
        setActiveReferencePageId(pageId);

        if (guideStep === 'card-pages' && pageId.endsWith('-ai')) {
            onGuideStepChange?.('card-ai');
        }
    };

    const desktopPanelClasses = cn(
        'relative surface-panel-strong flex flex-col transition-transform duration-300 ease-in-out border-t shadow-[0_-12px_40px_rgba(15,23,42,0.12)]',
        isImmersiveLayout
            ? 'absolute bottom-0 left-0 right-0 z-40 h-[82%] rounded-t-[28px] xl:order-1 xl:h-full xl:w-[38%] xl:translate-y-0 xl:static xl:rounded-[32px] xl:border xl:shadow-[0_28px_64px_rgba(15,23,42,0.08)]'
            : 'lg:w-[38%] lg:h-full lg:translate-y-0 lg:static lg:shadow-none',
        isImmersiveLayout
            ? (isMobileAiPanelOpen ? 'translate-y-0' : 'translate-y-[110%] xl:translate-y-0')
            : (isMobileAiPanelOpen ? 'translate-y-0' : 'translate-y-[110%]')
    );

    const classicReferencePane = (
        <div className="relative h-full w-full shrink-0 border-r border-white/10 bg-[linear-gradient(180deg,#09111f,#0d1728)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] lg:w-[62%] flex flex-col overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,rgba(148,163,184,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.6)_1px,transparent_1px)] bg-[size:30px_30px]" />
            <div className={cn('absolute top-[-8%] right-[-10%] h-[22rem] w-[22rem] rounded-full blur-[90px] pointer-events-none', theme.accentGlow)} />

            <div className="absolute top-4 left-4 z-20">
                <Button variant="secondary" size="sm" onClick={onBack} className="bg-white/88 border-white/70 dark:bg-white/12 dark:border-white/12 dark:text-white dark:hover:bg-white/18">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
            </div>

            <div ref={referenceHeaderRef} className="px-6 pt-20 lg:px-8 lg:pt-24">
                <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] bg-white/6 text-white/72', theme.accentBorder)}>
                    Reference Deck
                </div>
                <h2 className="mt-4 text-3xl font-display font-semibold text-white">{card.title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200 lg:text-base">{card.purpose}</p>
            </div>

            <div className="relative flex flex-1 min-h-[24rem] w-full items-center justify-center overflow-hidden px-2 lg:min-h-0 lg:px-0">
                <button
                    type="button"
                    onClick={() => setIsReferencePreviewOpen(true)}
                    className="group relative flex h-full w-full cursor-zoom-in items-center justify-center overflow-hidden px-1 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    aria-label="Preview reference image"
                >
                    <div key={activeReferencePage.id} className="relative h-full w-full animate-reference-page-in">
                        <Image
                            src={activeReferencePage.image}
                            alt="Method Reference"
                            fill
                            sizes="(min-width: 1024px) 62vw, 100vw"
                            style={{ objectFit: 'contain', objectPosition: 'center' }}
                            className="p-2 md:p-3 lg:p-4 xl:p-5 transition-transform duration-200 group-hover:scale-[1.015]"
                            unoptimized
                        />
                    </div>
                </button>
            </div>

            <div className="px-4 pb-4 lg:px-6">
                <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-between">
                    <div ref={referenceTabsRef} className="flex flex-wrap justify-center gap-2">
                        {referencePages.map(page => (
                            <button
                                key={`${page.id}-classic`}
                                type="button"
                                onClick={() => handleSelectReferencePage(page.id)}
                                className={cn(
                                    'rounded-full border px-4 py-2 text-xs font-medium transition-all backdrop-blur-sm lg:text-sm',
                                    page.id === activeReferencePage.id
                                        ? `${theme.accentSolid} border-transparent text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]`
                                        : `bg-white/8 text-slate-200 border-white/10 ${theme.accentHover}`
                                )}
                            >
                                {page.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div
                            ref={referenceHelpRef}
                            className="relative"
                            onMouseEnter={() => setIsReferenceHelpOpen(true)}
                            onMouseLeave={() => setIsReferenceHelpOpen(false)}
                        >
                            <button
                                type="button"
                                onClick={() => setIsReferenceHelpOpen((current) => !current)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-slate-200 backdrop-blur-sm transition-colors hover:bg-white/12 hover:text-white"
                                aria-label="How to use this card view"
                                aria-expanded={isReferenceHelpOpen}
                            >
                                <CircleHelp className="h-4 w-4" />
                            </button>

                            <div
                                className={cn(
                                    'absolute bottom-[calc(100%+0.75rem)] right-0 z-20 w-[16rem] rounded-[22px] border border-white/12 bg-slate-950/92 p-4 text-sm leading-relaxed text-slate-200 shadow-[0_24px_52px_rgba(2,6,23,0.34)] backdrop-blur-xl transition-all duration-200',
                                    isReferenceHelpOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
                                )}
                            >
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                                    How to use
                                </div>
                                <div className="mt-3">
                                    Front explains the method. AI Prompt Page helps you run it faster.
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsReferencePreviewOpen(true)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm transition-colors hover:bg-white/12"
                        >
                            <Expand className="h-3.5 w-3.5" />
                            Open large view
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/8 bg-black/22 px-4 py-3 text-center text-[11px] text-slate-400 lg:px-6 lg:text-xs">
                Reference Card: {card.title} / {activeReferencePage.label}
            </div>
        </div>
    );

    return (
        <div ref={shellRef} className={cn('relative flex h-full overflow-hidden', isImmersiveLayout ? 'flex-col xl:flex-row' : 'flex-col lg:flex-row')}>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--body-top),var(--body-bottom))]"></div>
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', theme.accentGradient)}></div>
            {isImmersiveLayout && (
                <>
                    <div className={cn('pointer-events-none absolute right-[18%] top-[-14%] h-[30rem] w-[30rem] rounded-full opacity-60 blur-[120px]', theme.accentGlow)} />
                    <div className={cn('pointer-events-none absolute right-[8%] top-[-6%] h-[24rem] w-[24rem] rounded-full opacity-35 blur-[100px]', theme.accentGlow)} />
                    <div className={cn('pointer-events-none absolute left-[56%] top-[-8%] hidden h-[24rem] w-[18rem] -translate-x-1/2 rounded-full opacity-28 blur-[112px] lg:block', theme.accentGlow)} />
                    <div className="pointer-events-none absolute inset-y-0 left-[58%] hidden w-24 -translate-x-1/2 bg-[linear-gradient(90deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06),transparent)] opacity-70 blur-[26px] dark:bg-[linear-gradient(90deg,rgba(148,163,184,0.16),rgba(15,23,42,0.04),transparent)] lg:block" />
                </>
            )}

            {isImmersiveLayout ? (
            <div className="relative order-1 flex h-full w-full shrink-0 flex-col overflow-visible bg-[linear-gradient(180deg,var(--panel-strong),var(--panel))] xl:order-2 xl:w-[62%]">
                <div className={cn('pointer-events-none absolute right-[-6%] top-[-10%] h-[22rem] w-[22rem] rounded-full opacity-55 blur-[92px]', theme.accentGlow)} />
                <div className="pointer-events-none absolute inset-y-0 right-[-2.5rem] hidden w-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),rgba(255,255,255,0.03),transparent)] opacity-75 blur-[22px] dark:bg-[linear-gradient(90deg,rgba(148,163,184,0.12),rgba(15,23,42,0.03),transparent)] xl:block" />

                <div ref={referenceHeaderRef} className="relative z-30 hidden border-b border-[var(--panel-border)] px-4 py-4 lg:px-6 lg:py-5 xl:block">
                    <div ref={immersiveDesktopControlsRef} className="flex items-center justify-end gap-3">
                        <div ref={referenceTabsRef} className="flex items-center gap-3">
                            <div className="inline-flex items-center gap-1.5 rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-strong)]/92 p-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.1)] backdrop-blur-xl">
                                {referencePages.map(page => (
                                    <button
                                        key={`${page.id}-header`}
                                        type="button"
                                        onClick={() => handleSelectReferencePage(page.id)}
                                        className={cn(
                                            'rounded-[18px] px-5 py-3 text-sm font-semibold transition-all',
                                            page.id === activeReferencePage.id
                                                ? `${theme.accentSolid} border-transparent text-white shadow-[0_10px_22px_rgba(15,23,42,0.14)]`
                                                : 'text-[var(--foreground-soft)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]'
                                        )}
                                    >
                                        {page.label}
                                    </button>
                                ))}
                            </div>
                            <div
                                ref={referenceHelpRef}
                                className="relative"
                                onMouseEnter={() => setIsReferenceHelpOpen(true)}
                                onMouseLeave={() => setIsReferenceHelpOpen(false)}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsReferenceHelpOpen((current) => !current)}
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)]/94 text-[var(--foreground-soft)] shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-colors hover:text-[var(--foreground)]"
                                    aria-label="How to use this card view"
                                    aria-expanded={isReferenceHelpOpen}
                                >
                                    <CircleHelp className="h-[1.15rem] w-[1.15rem]" />
                                </button>

                                <div
                                    className={cn(
                                        'absolute right-0 top-[calc(100%+0.7rem)] z-50 w-[16rem] rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-strong)] p-4 text-sm leading-relaxed text-[var(--foreground-soft)] shadow-[0_24px_52px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-200',
                                        isReferenceHelpOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
                                    )}
                                >
                                    <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', theme.accentText)}>
                                        How to use
                                    </div>
                                    <div className="mt-3">
                                        Front explains the method. AI Prompt Page helps you run it faster.
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsReferencePreviewOpen(true)}
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)]/94 px-5 py-3 text-sm font-semibold text-[var(--foreground-soft)] shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-colors hover:text-[var(--foreground)]"
                            >
                                <Expand className="h-3.5 w-3.5" />
                                Open large view
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden p-4 lg:p-5">
                    <div
                        className="relative min-h-0 flex-1 overflow-hidden rounded-[32px] border border-[var(--panel-border)] shadow-[0_28px_64px_rgba(15,23,42,0.08)]"
                        style={referencePreviewShellStyle}
                    >
                        <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r', theme.accentGradient)} />
                        <div className="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.2]" style={referencePreviewGridStyle} />
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.26),transparent_46%)] opacity-55 dark:bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.08),transparent_52%)] dark:opacity-80" />
                        <div ref={immersiveMobileControlsRef} className="relative z-30 border-b border-[var(--panel-border)] px-3 py-3 xl:hidden">
                            <div className="flex items-start justify-between gap-3">
                                <Button variant="secondary" size="sm" onClick={onBack}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <div className="min-w-0 text-right">
                                    <div className={cn('text-[10px] font-semibold uppercase tracking-[0.22em]', theme.accentText)}>
                                        Reference Deck
                                    </div>
                                    <div className="mt-1 text-base font-display font-semibold text-[var(--foreground)]">
                                        {card.title}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {referencePages.map(page => (
                                        <button
                                            key={`${page.id}-mobile`}
                                            type="button"
                                            onClick={() => handleSelectReferencePage(page.id)}
                                            className={cn(
                                                'rounded-full border px-3 py-2 text-xs font-semibold',
                                                page.id === activeReferencePage.id
                                                    ? `${theme.accentSolid} border-transparent text-white`
                                                    : 'border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-soft)]'
                                            )}
                                        >
                                            {page.id.endsWith('-front') ? 'Front' : 'AI Prompt'}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsReferenceHelpOpen((current) => !current)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-soft)]"
                                        aria-label="How to use this card view"
                                        aria-expanded={isReferenceHelpOpen}
                                    >
                                        <CircleHelp className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsReferencePreviewOpen(true)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-soft)]"
                                        aria-label="Open large view"
                                    >
                                        <Expand className="h-4 w-4" />
                                    </button>
                                </div>
                        </div>
                        </div>
                        {isReferenceHelpOpen && (
                            <div className="relative z-30 mx-3 mt-3 rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm leading-relaxed text-[var(--foreground-soft)] xl:hidden">
                                Front explains the method. AI Prompt Page helps you run it faster.
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsReferencePreviewOpen(true)}
                            className="group relative flex h-full w-full cursor-zoom-in items-center justify-center overflow-hidden px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel-strong)] lg:px-4 lg:py-4"
                            aria-label="Preview reference image"
                        >
                            <div key={activeReferencePage.id} className="relative h-full min-h-[24rem] w-full animate-reference-page-in sm:min-h-[30rem] lg:min-h-[38rem] xl:min-h-[42rem]">
                                <Image
                                    src={activeReferencePage.image}
                                    alt="Method Reference"
                                    fill
                                    sizes="(min-width: 1024px) 56vw, 100vw"
                                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                                    className="p-0.5 lg:p-1 transition-transform duration-200 group-hover:scale-[1.018]"
                                    unoptimized
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            ) : classicReferencePane}

            <div className={desktopPanelClasses}>
                <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-[var(--panel-border)]">
                    <div className="space-y-3">
                        <span className={cn('font-semibold flex items-center gap-2', theme.accentText)}>
                            {activePanel === 'ai' ? <Sparkles className="w-4 h-4" /> : <Workflow className="w-4 h-4" />}
                            {activePanel === 'ai' ? 'AI Actions' : 'Team Collaboration'}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setActivePanel('ai')}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-medium',
                                    activePanel === 'ai'
                                        ? `${theme.accentSolid} border-transparent text-white`
                                        : 'border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)]'
                                )}
                            >
                                AI Facilitator
                            </button>
                            <button
                                type="button"
                                onClick={() => setActivePanel('team')}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-medium',
                                    activePanel === 'team'
                                        ? `${theme.accentSolid} border-transparent text-white`
                                        : 'border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)]'
                                )}
                            >
                                Team
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileAiPanelOpen(false)} className="p-2 rounded-full bg-[var(--panel)]">
                        <ArrowDownCircle className="w-5 h-5 text-[var(--foreground-muted)]" />
                    </button>
                </div>

                <div className={cn('border-b border-[var(--panel-border)] px-8 py-7 shrink-0', isImmersiveLayout ? 'hidden xl:block' : 'hidden lg:block')}>
                    {isImmersiveLayout ? (
                        <>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]', theme.accentBorder, theme.accentSoft, theme.accentText)}>
                                        Reference Deck
                                    </div>
                                    {isImmersiveSummaryCollapsed && (
                                        <div className="mt-4">
                                            <div className="min-w-0 text-xl font-display font-semibold leading-none text-[var(--foreground)]">
                                                <span className="block truncate">{card.title}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsImmersiveSummaryCollapsed((current) => !current)}
                                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]"
                                        aria-expanded={!isImmersiveSummaryCollapsed}
                                        aria-controls="immersive-method-summary"
                                    >
                                        {isImmersiveSummaryCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                        {isImmersiveSummaryCollapsed ? 'Show details' : 'Hide details'}
                                    </button>
                                    <Button variant="secondary" size="sm" onClick={onBack} className="min-h-11">
                                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                </div>
                            </div>
                            <div
                                id="immersive-method-summary"
                                className={cn(
                                    'grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out',
                                    isImmersiveSummaryCollapsed ? 'mt-0 grid-rows-[0fr] opacity-0' : 'mt-6 grid-rows-[1fr] opacity-100'
                                )}
                            >
                                {!isImmersiveSummaryCollapsed && (
                                    <div className="min-h-0 overflow-hidden">
                                        <h2 className="text-[2rem] font-display font-semibold leading-[0.98] text-[var(--foreground)]">
                                            {card.title}
                                        </h2>
                                        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--foreground-soft)]">
                                            {card.purpose}
                                        </p>
                                        <div className={cn('mt-6 rounded-[28px] border p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]', theme.accentBorder, theme.accentSoft)}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className={cn('text-[11px] uppercase tracking-[0.22em] font-semibold', theme.accentText)}>
                                                        {desktopPanelContent.eyebrow}
                                                    </div>
                                                    <h3 className="mt-3 text-[1.45rem] font-display font-semibold leading-tight text-[var(--foreground)]">
                                                        {desktopPanelContent.title}
                                                    </h3>
                                                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--foreground-soft)]">
                                                        {desktopPanelContent.description}
                                                    </p>
                                                </div>
                                                <div className={cn('rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]', theme.accentBorder, theme.accentSoft, theme.accentText)}>
                                                    {desktopPanelContent.chip}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className={cn('flex gap-2', isImmersiveSummaryCollapsed ? 'mt-4' : 'mt-5')}>
                                <button
                                    type="button"
                                    onClick={() => setActivePanel('ai')}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm font-medium',
                                        activePanel === 'ai'
                                            ? `${theme.accentSolid} border-transparent text-white`
                                            : 'border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)]'
                                    )}
                                >
                                    AI Facilitator
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActivePanel('team')}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm font-medium',
                                        activePanel === 'team'
                                            ? `${theme.accentSolid} border-transparent text-white`
                                            : 'border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)]'
                                    )}
                                >
                                    Team Collaboration
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={cn('text-[11px] uppercase tracking-[0.22em] font-semibold', theme.accentText)}>
                                {classicPanelContent.eyebrow}
                            </div>
                            <h3 className="mt-3 text-2xl font-display font-semibold text-[var(--foreground)]">{classicPanelContent.title}</h3>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--foreground-soft)]">{classicPanelContent.description}</p>
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActivePanel('ai')}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm font-medium',
                                        activePanel === 'ai'
                                            ? `${theme.accentSolid} border-transparent text-white`
                                            : 'border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)]'
                                    )}
                                >
                                    AI Facilitator
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActivePanel('team')}
                                    className={cn(
                                        'rounded-full border px-4 py-2 text-sm font-medium',
                                        activePanel === 'team'
                                            ? `${theme.accentSolid} border-transparent text-white`
                                            : 'border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)]'
                                    )}
                                >
                                    Team Collaboration
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="scrollbar-none flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
                    {activePanel === 'ai' && (
                        <>
                    <div ref={promptBoardRef} className={cn('rounded-[24px] border bg-[var(--panel)]/88 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] lg:p-5 dark:shadow-[0_20px_42px_rgba(2,6,23,0.22)]', theme.accentBorder, theme.accentSoft)}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', theme.accentText)}>AI Facilitator</div>
                                <div className="mt-2 text-base font-semibold text-[var(--foreground)]">Prompt board is ready for this method.</div>
                                <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                    Pick a prompt below for a focused facilitation nudge, or open the bubble for a live back-and-forth while the team is working.
                                </div>
                            </div>
                            <div className={cn('rounded-full px-3 py-1 text-xs font-semibold', theme.accentSolid, 'text-white')}>
                                Live
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {card.aiPrompts.map(prompt => (
                            <button
                                key={prompt.id}
                                onClick={() => handlePromptClick(prompt.promptTemplate, prompt.label)}
                                disabled={isLoading}
                                className={cn(
                                    'text-left px-4 py-4 lg:px-5 lg:py-4 bg-[var(--panel)] border rounded-2xl shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition-all group flex items-center justify-between',
                                    theme.accentBorder,
                                    theme.accentHover
                                )}
                            >
                                <span className="font-medium text-[var(--foreground-soft)] text-sm lg:text-base pr-4">{prompt.label}</span>
                                <Sparkles className={cn('w-4 h-4 shrink-0 text-slate-300 transition-colors', theme.accentText)} />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-5 pt-4 border-t border-[var(--panel-border)] pb-20 lg:pb-0">
                        <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-[0.22em]">AI Session Log</h3>

                        {responses.length === 0 && (
                            <div className="text-center py-10 text-[var(--foreground-muted)] italic text-sm rounded-[24px] border border-dashed border-[var(--panel-border)] bg-[var(--panel)]">
                                Pick one of the prompts above to start a grounded facilitation thread for this method.
                            </div>
                        )}

                        {responses.map((item, idx) => (
                            <div key={idx} className={cn('bg-[var(--panel-strong)] p-5 lg:p-6 rounded-[24px] border shadow-[0_16px_34px_rgba(15,23,42,0.08)]', theme.accentBorder)}>
                                <div className={cn('text-xs font-semibold mb-3 flex items-center gap-2 uppercase tracking-[0.18em]', theme.accentText)}>
                                    <Bot className="w-3.5 h-3.5" />
                                    Prompt
                                </div>
                                <div className="text-sm text-[var(--foreground-muted)] mb-4 leading-relaxed">{item.prompt}</div>
                                <div className="text-[var(--foreground)] whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
                                    {item.response}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className={cn('bg-[var(--panel)] p-6 rounded-[24px] border shadow-[0_12px_28px_rgba(15,23,42,0.06)] flex items-center justify-center', theme.accentBorder)}>
                                <Sparkles className={cn('w-5 h-5 animate-spin', theme.accentText)} />
                            </div>
                        )}
                    </div>
                        </>
                    )}

                    {activePanel === 'team' && (
                        <>
                            <div className={cn('rounded-[24px] border bg-[var(--panel)]/88 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] lg:p-5 dark:shadow-[0_20px_42px_rgba(2,6,23,0.22)]', theme.accentBorder, theme.accentSoft)}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', theme.accentText)}>Outcome capture</div>
                                        <div className="mt-2 text-base font-semibold text-[var(--foreground)]">Create the next project record without leaving this card.</div>
                                        <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                            Use the metric cards below to see what this run already created and open a focused add form only when you need it.
                                        </div>
                                    </div>
                                    <div className={cn('rounded-full px-3 py-1 text-xs font-semibold', theme.accentSolid, 'text-white')}>
                                        {isHubLoading ? 'Syncing' : 'Live'}
                                    </div>
                                </div>
                            </div>

                            {teamQuickAddMode && (
                                <TeamQuickAddPanel
                                    mode={teamQuickAddMode}
                                    tone={theme}
                                    threadDraft={threadDraft}
                                    captureDraft={captureDraft}
                                    onThreadChange={setThreadDraft}
                                    onCaptureChange={setCaptureDraft}
                                    onClose={() => setTeamQuickAddMode(null)}
                                    onSubmit={() => {
                                        if (teamQuickAddMode === 'thread') {
                                            void handleCreateThread();
                                            return;
                                        }

                                        void handleCaptureOutcome();
                                    }}
                                />
                            )}

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                <TeamMetricActionCard
                                    title="Threads"
                                    value={String(runThreads.length)}
                                    helper="Open questions and follow-up"
                                    icon={MessageSquareMore}
                                    tone={theme}
                                    active={activeTeamCollection === 'thread'}
                                    onOpen={() => toggleTeamCollection('thread')}
                                    onAdd={() => openTeamQuickAdd('thread')}
                                />
                                <TeamMetricActionCard
                                    title="Linked cards"
                                    value={String(linkedCards.length)}
                                    helper="Board cards captured from this run"
                                    icon={LayoutGrid}
                                    tone={theme}
                                    active={activeTeamCollection === 'card'}
                                    onOpen={() => toggleTeamCollection('card')}
                                    onAdd={() => openTeamQuickAdd('card')}
                                />
                                <TeamMetricActionCard
                                    title="Artifacts"
                                    value={String(linkedArtifacts.length)}
                                    helper="Reusable outputs and evidence"
                                    icon={FileStack}
                                    tone={theme}
                                    active={activeTeamCollection === 'artifact'}
                                    onOpen={() => toggleTeamCollection('artifact')}
                                    onAdd={() => openTeamQuickAdd('artifact')}
                                />
                                <TeamMetricActionCard
                                    title="Decisions"
                                    value={String(linkedDecisions.length)}
                                    helper="Captured calls from this card"
                                    icon={Gavel}
                                    tone={theme}
                                    active={activeTeamCollection === 'decision'}
                                    onOpen={() => toggleTeamCollection('decision')}
                                    onAdd={() => openTeamQuickAdd('decision')}
                                />
                                <TeamMetricActionCard
                                    title="Tasks"
                                    value={String(linkedTasks.length)}
                                    helper="Actions to push the work forward"
                                    icon={ListTodo}
                                    tone={theme}
                                    active={activeTeamCollection === 'task'}
                                    onOpen={() => toggleTeamCollection('task')}
                                    onAdd={() => openTeamQuickAdd('task')}
                                />
                            </div>

                            {activeTeamCollection && (
                                <TeamCollectionPanel
                                    mode={activeTeamCollection}
                                    tone={theme}
                                    items={activeTeamItems}
                                    openMenuKey={teamItemMenuKey}
                                    onToggleMenu={setTeamItemMenuKey}
                                    onClose={() => setActiveTeamCollection(null)}
                                    onEdit={handleOpenTeamEditor}
                                    onDelete={(resource, record) => {
                                        setTeamDeleteState({
                                            resource,
                                            recordId: record.id,
                                            title: record.title
                                        });
                                        setTeamItemMenuKey(null);
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            <SpotlightGuide
                open={guideStep === 'card-pages'}
                targetRef={isImmersiveLayout
                    ? (isImmersiveDesktopViewport ? immersiveDesktopControlsRef : immersiveMobileControlsRef)
                    : referenceTabsRef}
                currentStep={cardPagesGuide?.currentStep || 7}
                totalSteps={cardPagesGuide?.totalSteps || 8}
                placement="left"
                title="Each method card has a front and an AI prompt page"
                description="The front explains the method itself. The AI page gives you suggested prompts you can use to prepare, reframe, or facilitate the activity with more confidence."
                purpose="Switch between these two pages whenever you need to understand the method first, then translate it into questions and facilitation moves."
                primaryAction={referencePages.find((page) => page.id.endsWith('-ai')) ? {
                    label: 'Show AI Prompts page',
                    onClick: () => {
                        const aiPage = referencePages.find((page) => page.id.endsWith('-ai'));
                        if (!aiPage) {
                            return;
                        }

                        handleSelectReferencePage(aiPage.id);
                    }
                } : undefined}
                onBack={() => onGuideStepChange?.('explore-card')}
                onSkip={onDismissGuide}
            />
            <SpotlightGuide
                open={guideStep === 'card-ai' && activePanel === 'ai'}
                targetRef={promptBoardRef}
                currentStep={cardAiGuide?.currentStep || 8}
                totalSteps={cardAiGuide?.totalSteps || 8}
                placement="left"
                title="The AI on the right helps you run the method, not replace it"
                description="Use the prompt board to generate facilitation questions, reframes, and next moves for this specific card. You can also open the floating AI Facilitator bubble for a free-form conversation while you work."
                purpose="This is useful when you need help preparing a workshop, wording a question better, or turning a method into clear follow-up actions for the team."
                primaryAction={{
                    label: 'Finish guide',
                    onClick: () => onDismissGuide?.()
                }}
                onBack={() => onGuideStepChange?.('card-pages')}
                onSkip={onDismissGuide}
            />

            <div className="lg:hidden absolute bottom-6 left-6 z-30">
                <button
                    onClick={() => setIsMobileAiPanelOpen(true)}
                    className={cn('text-white p-4 rounded-full shadow-2xl transition-transform active:scale-95 flex items-center justify-center', theme.accentSolid)}
                >
                    <Zap className="w-6 h-6" />
                </button>
            </div>

            <div
                className={cn(
                    'absolute z-50 transition-[top,left,right,bottom] ease-out',
                    isFacilitatorDragging ? 'duration-0' : 'duration-200'
                )}
                style={facilitatorDockStyle}
            >
                {!isFacilitatorOpen && (
                    <div
                        className="relative"
                        style={{
                            width: facilitatorDockSize.width,
                            height: facilitatorDockSize.height
                        }}
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                'pointer-events-none absolute inset-[-8px] rounded-full opacity-40 blur-[2px] animate-facilitator-breathe',
                                theme.accentSolid
                            )}
                        />
                        <button
                            ref={facilitatorLauncherRef}
                            onClick={handleOpenFacilitator}
                            onPointerDown={handleFacilitatorPointerDown}
                            onPointerMove={handleFacilitatorPointerMove}
                            onPointerUp={handleFacilitatorPointerEnd}
                            onPointerCancel={handleFacilitatorPointerEnd}
                            aria-label="Open AI Facilitator"
                            title="Open AI Facilitator. Drag to move it to any edge."
                            className={cn(
                                'relative inline-flex h-full w-full touch-none select-none items-center justify-center gap-2.5 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-[0_22px_54px_rgba(15,23,42,0.18)] transition-transform border border-white/20 backdrop-blur-xl lg:px-5 lg:py-4 lg:text-base',
                                isFacilitatorDragging ? 'scale-[1.03] cursor-grabbing' : 'cursor-grab hover:scale-105',
                                theme.accentSolid
                            )}
                        >
                            <Bot className="w-5 h-5 lg:w-6 lg:h-6 shrink-0 text-white" strokeWidth={2.1} />
                            <span className="whitespace-nowrap text-white">AI Facilitator</span>
                        </button>
                    </div>
                )}

                {isFacilitatorOpen && (
                    <div
                        className="surface-panel-strong absolute flex w-72 flex-col overflow-hidden rounded-[24px] shadow-[0_24px_60px_rgba(15,23,42,0.18)] lg:w-80"
                        style={facilitatorPanelStyle}
                    >
                        <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
                            <span className="font-semibold flex items-center gap-2 text-sm">
                                <Bot className={cn('w-4 h-4', theme.accentText.replace('text-', 'text-'))} />
                                AI Facilitator
                            </span>
                            <button onClick={() => setIsFacilitatorOpen(false)}><X className="w-4 h-4" /></button>
                        </div>
                        <div className="h-64 space-y-3 p-4 bg-[var(--panel)] overflow-y-auto text-sm text-[var(--foreground-soft)] leading-relaxed">
                            <div className={cn('max-w-[88%] rounded-[18px] border px-4 py-3 shadow-sm', theme.accentBorder, theme.accentSoft)}>
                                I have the project frame for <strong>{context.name}</strong>. Ask me to sharpen the next prompt, surface a blind spot, or guide the team through <strong>{card.title}</strong>.
                            </div>
                            {responses.map((item, index) => (
                                <div key={`${item.timestamp}-${index}`} className="space-y-2">
                                    <div className="ml-auto max-w-[88%] rounded-[18px] bg-slate-950 px-4 py-3 text-white shadow-sm">
                                        {item.prompt}
                                    </div>
                                    <div className={cn('max-w-[88%] rounded-[18px] border px-4 py-3 whitespace-pre-wrap shadow-sm', theme.accentBorder, theme.accentSoft)}>
                                        {item.response}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className={cn('inline-flex items-center gap-2 rounded-[18px] border px-4 py-3 shadow-sm', theme.accentBorder, theme.accentSoft)}>
                                    <Sparkles className={cn('w-4 h-4 animate-spin', theme.accentText)} />
                                    Shaping the next facilitation move...
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-[var(--panel-border)] bg-[var(--panel-strong)] flex gap-2">
                            <input
                                className="flex-1 text-sm outline-none bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                                placeholder="Ask for a reframe, prompt, or next move"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        handleChatSubmit();
                                    }
                                }}
                            />
                            <button
                                onClick={handleChatSubmit}
                                disabled={!chatInput.trim() || isLoading}
                                className={cn(
                                    'p-2 rounded-xl transition-opacity',
                                    theme.accentSoft,
                                    theme.accentText,
                                    !chatInput.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                                )}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isReferencePreviewOpen && (
                <div className="modal-backdrop-enter absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/62 p-4 backdrop-blur-sm dark:bg-slate-950/78">
                    <button
                        type="button"
                        aria-label="Close enlarged reference"
                        className="absolute inset-0"
                        onClick={() => setIsReferencePreviewOpen(false)}
                    />

                    <div className="modal-panel-enter surface-panel-strong relative z-10 flex h-full max-h-[min(92vh,72rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] shadow-[0_30px_80px_rgba(2,6,23,0.28)]">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_48%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_48%)]" />
                        <div className="relative flex items-center justify-between gap-4 border-b border-[var(--panel-border)] px-5 py-4 text-[var(--foreground)] lg:px-6">
                            <div>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Reference Preview</div>
                                <div className="mt-1 text-base font-semibold lg:text-lg">{card.title}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsReferencePreviewOpen(false)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground)] transition-colors hover:bg-[var(--panel-strong)]"
                                aria-label="Close enlarged reference"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="relative flex-1 p-4 lg:p-6">
                            <div className="relative h-full w-full overflow-auto rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)]">
                                <div className="relative mx-auto h-full min-h-[36rem] w-full max-w-[96rem]">
                                    <Image
                                        src={activeReferencePage.image}
                                        alt={`${card.title} enlarged reference`}
                                        fill
                                        sizes="100vw"
                                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                                        className="p-3 lg:p-6"
                                        unoptimized
                                    />
                                </div>
                            </div>
                        </div>

                        {referencePages.length > 1 && (
                            <div className="relative flex flex-wrap justify-center gap-2 border-t border-[var(--panel-border)] px-4 py-4">
                                {referencePages.map(page => (
                                    <button
                                        key={`${page.id}-preview`}
                                        type="button"
                                        onClick={() => setActiveReferencePageId(page.id)}
                                        className={cn(
                                            'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all lg:text-sm',
                                            page.id === activeReferencePage.id
                                                ? `${theme.accentSolid} border-transparent text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]`
                                                : 'border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)] hover:bg-[var(--panel-strong)]'
                                        )}
                                    >
                                        {page.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {teamEditorState && (
                <TeamOverlayDialog
                    title={getTeamEditorMeta(teamEditorState.resource).title}
                    eyebrow={getTeamEditorMeta(teamEditorState.resource).eyebrow}
                    description={getTeamEditorMeta(teamEditorState.resource).description}
                    tone={theme}
                    icon={getTeamEditorMeta(teamEditorState.resource).icon}
                    onClose={() => setTeamEditorState(null)}
                >
                    {teamEditorState.resource === 'threads' ? (
                        <>
                            <TeamInputField
                                label="Thread title"
                                value={teamEditorState.draft.title || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, title: value }
                                } : current)}
                            />
                            <TeamTextareaField
                                label="Thread notes"
                                value={teamEditorState.draft.body || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, body: value }
                                } : current)}
                            />
                            <TeamInputField
                                label="Next step"
                                value={teamEditorState.draft.nextStep || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, nextStep: value }
                                } : current)}
                            />
                            <TeamSelectField
                                label="Status"
                                value={teamEditorState.draft.status || 'open'}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, status: value }
                                } : current)}
                                options={[
                                    { value: 'open', label: 'Open' },
                                    { value: 'resolved', label: 'Resolved' }
                                ]}
                            />
                        </>
                    ) : teamEditorState.resource === 'cards' ? (
                        <>
                            <TeamInputField
                                label="Card title"
                                value={teamEditorState.draft.title || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, title: value }
                                } : current)}
                            />
                            <TeamTextareaField
                                label="Summary"
                                value={teamEditorState.draft.summary || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, summary: value }
                                } : current)}
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                                <TeamSelectField
                                    label="Type"
                                    value={teamEditorState.draft.type || 'idea'}
                                    onChange={(value) => setTeamEditorState((current) => current ? {
                                        ...current,
                                        draft: { ...current.draft, type: value }
                                    } : current)}
                                    options={['idea', 'insight', 'experiment', 'story', 'risk', 'dependency'].map((value) => ({ value, label: formatLinkedCardType(value) }))}
                                />
                                <TeamSelectField
                                    label="Lane"
                                    value={teamEditorState.draft.status || 'open-questions'}
                                    onChange={(value) => setTeamEditorState((current) => current ? {
                                        ...current,
                                        draft: { ...current.draft, status: value }
                                    } : current)}
                                    options={['open-questions', 'in-progress', 'ready-for-review', 'approved', 'parked'].map((value) => ({ value, label: formatLinkedCardStatus(value) }))}
                                />
                            </div>
                        </>
                    ) : teamEditorState.resource === 'artifacts' ? (
                        <>
                            <TeamInputField
                                label="Output title"
                                value={teamEditorState.draft.title || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, title: value }
                                } : current)}
                            />
                            <TeamTextareaField
                                label="Summary"
                                value={teamEditorState.draft.summary || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, summary: value }
                                } : current)}
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                                <TeamSelectField
                                    label="Type"
                                    value={teamEditorState.draft.type || 'concept'}
                                    onChange={(value) => setTeamEditorState((current) => current ? {
                                        ...current,
                                        draft: { ...current.draft, type: value }
                                    } : current)}
                                    options={['concept', 'insight', 'experiment', 'narrative', 'attachment'].map((value) => ({ value, label: formatArtifactType(value) }))}
                                />
                                <TeamSelectField
                                    label="Status"
                                    value={teamEditorState.draft.status || 'draft'}
                                    onChange={(value) => setTeamEditorState((current) => current ? {
                                        ...current,
                                        draft: { ...current.draft, status: value }
                                    } : current)}
                                    options={['draft', 'ready', 'approved'].map((value) => ({ value, label: formatArtifactStatus(value) }))}
                                />
                            </div>
                        </>
                    ) : teamEditorState.resource === 'decisions' ? (
                        <>
                            <TeamInputField
                                label="Decision title"
                                value={teamEditorState.draft.title || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, title: value }
                                } : current)}
                            />
                            <TeamTextareaField
                                label="Decision"
                                value={teamEditorState.draft.decision || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, decision: value }
                                } : current)}
                            />
                            <TeamTextareaField
                                label="Rationale"
                                value={teamEditorState.draft.rationale || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, rationale: value }
                                } : current)}
                            />
                            <TeamTextareaField
                                label="Background"
                                value={teamEditorState.draft.background || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, background: value }
                                } : current)}
                            />
                            <TeamTextareaField
                                label="Options"
                                value={teamEditorState.draft.options || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, options: value }
                                } : current)}
                            />
                        </>
                    ) : (
                        <>
                            <TeamInputField
                                label="Task title"
                                value={teamEditorState.draft.title || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, title: value }
                                } : current)}
                            />
                            <TeamTextareaField
                                label="Details"
                                value={teamEditorState.draft.details || ''}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, details: value }
                                } : current)}
                            />
                            <TeamSelectField
                                label="Status"
                                value={teamEditorState.draft.status || 'open'}
                                onChange={(value) => setTeamEditorState((current) => current ? {
                                    ...current,
                                    draft: { ...current.draft, status: value }
                                } : current)}
                                options={['open', 'in-progress', 'blocked', 'done'].map((value) => ({ value, label: formatTaskStatus(value) }))}
                            />
                        </>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={() => void handleSaveTeamEditor()}>Save changes</Button>
                    </div>
                </TeamOverlayDialog>
            )}

            {teamDeleteState && (
                <TeamOverlayDialog
                    title="Delete item"
                    eyebrow="Delete"
                    description={`Delete "${teamDeleteState.title}" from this method run? This removes it from Project Hub too.`}
                    tone={theme}
                    icon={Trash2}
                    onClose={() => setTeamDeleteState(null)}
                >
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setTeamDeleteState(null)}>Cancel</Button>
                        <Button onClick={() => void handleConfirmTeamDelete()}>Delete</Button>
                    </div>
                </TeamOverlayDialog>
            )}
        </div>
    );
}

function TeamMetricActionCard({
    title,
    value,
    helper,
    icon: Icon,
    tone,
    active,
    onOpen,
    onAdd
}: {
    title: string;
    value: string;
    helper: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: StageTheme;
    active: boolean;
    onOpen: () => void;
    onAdd: () => void;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen();
                }
            }}
            className={cn(
                'rounded-[24px] border bg-[var(--panel)] p-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-all',
                tone.accentBorder,
                active && 'border-current shadow-[0_20px_38px_rgba(15,23,42,0.1)]',
                active ? tone.accentText : 'hover:-translate-y-0.5'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className={cn('inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-[var(--panel-strong)]', tone.accentBorder, tone.accentText)}>
                    <Icon className="h-5 w-5" />
                </div>
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onAdd();
                    }}
                    className={cn('inline-flex h-10 w-10 items-center justify-center rounded-full border bg-[var(--panel-strong)] transition-colors', tone.accentBorder, tone.accentText)}
                    aria-label={`Add ${title}`}
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">{title}</div>
            <div className="mt-2 text-3xl font-display font-semibold text-[var(--foreground)]">{value}</div>
            <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">{helper}</div>
        </div>
    );
}

function TeamCollectionPanel({
    mode,
    tone,
    items,
    openMenuKey,
    onToggleMenu,
    onClose,
    onEdit,
    onDelete
}: {
    mode: TeamCollectionMode;
    tone: StageTheme;
    items: TeamCollectionItem[];
    openMenuKey: string | null;
    onToggleMenu: React.Dispatch<React.SetStateAction<string | null>>;
    onClose: () => void;
    onEdit: (resource: TeamEditableResource, record: TeamEditableRecord) => void;
    onDelete: (resource: TeamEditableResource, record: TeamEditableRecord) => void;
}) {
    const meta = getTeamCollectionMeta(mode);

    return (
        <div className={cn('rounded-[26px] border bg-[var(--panel)] p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)]', tone.accentBorder)}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', tone.accentText)}>{meta.eyebrow}</div>
                    <div className="mt-2 text-xl font-display font-semibold text-[var(--foreground)]">{meta.title}</div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">{meta.description}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]"
                    aria-label={`Close ${meta.title}`}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-5 space-y-3">
                {items.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-4 text-sm text-[var(--foreground-soft)]">
                        {meta.emptyState}
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={`${item.resource}-${item.record.id}`} className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-base font-semibold text-[var(--foreground)]">{item.title}</div>
                                        <div className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', tone.accentSoft, tone.accentText)}>
                                            {item.statusLabel}
                                        </div>
                                    </div>
                                    <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground-soft)]">
                                        {item.description}
                                    </div>
                                    {item.meta && (
                                        <div className="mt-3 text-xs font-medium tracking-[0.04em] text-[var(--foreground-muted)]">
                                            {item.meta}
                                        </div>
                                    )}
                                </div>

                                <div data-team-item-menu className="relative shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => onToggleMenu((current) => current === item.menuKey ? null : item.menuKey)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]"
                                        aria-label={`Open actions for ${item.title}`}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>

                                    {openMenuKey === item.menuKey && (
                                        <div className="absolute right-0 top-[calc(100%+0.55rem)] z-20 w-36 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                                            <button
                                                type="button"
                                                onClick={() => onEdit(item.resource, item.record)}
                                                className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
                                            >
                                                <PencilLine className="h-4 w-4" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDelete(item.resource, item.record)}
                                                className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function TeamQuickAddPanel({
    mode,
    tone,
    threadDraft,
    captureDraft,
    onThreadChange,
    onCaptureChange,
    onClose,
    onSubmit
}: {
    mode: Exclude<TeamQuickAddMode, null>;
    tone: StageTheme;
    threadDraft: { title: string; body: string; nextStep: string };
    captureDraft: { type: string; title: string; summary: string; status: string };
    onThreadChange: React.Dispatch<React.SetStateAction<{ title: string; body: string; nextStep: string }>>;
    onCaptureChange: React.Dispatch<React.SetStateAction<{ type: string; title: string; summary: string; status: string }>>;
    onClose: () => void;
    onSubmit: () => void;
}) {
    const meta = getTeamQuickAddMeta(mode);

    return (
        <div className={cn('rounded-[26px] border bg-[var(--panel)] p-5 shadow-[0_16px_34px_rgba(15,23,42,0.07)]', tone.accentBorder)}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', tone.accentText)}>Quick add</div>
                    <div className="mt-2 text-xl font-display font-semibold text-[var(--foreground)]">{meta.title}</div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">{meta.description}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]"
                    aria-label="Close quick add"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {mode === 'thread' ? (
                <div className="mt-5 space-y-3">
                    <input
                        value={threadDraft.title}
                        onChange={(event) => onThreadChange((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Thread title"
                        className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
                    />
                    <AutoGrowField
                        value={threadDraft.body}
                        onChange={(event) => onThreadChange((current) => ({ ...current, body: event.target.value }))}
                        placeholder="What still needs team input?"
                    />
                    <input
                        value={threadDraft.nextStep}
                        onChange={(event) => onThreadChange((current) => ({ ...current, nextStep: event.target.value }))}
                        placeholder="Next step"
                        className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
                    />
                </div>
            ) : (
                <div className="mt-5 space-y-3">
                    <input
                        value={captureDraft.title}
                        onChange={(event) => onCaptureChange((current) => ({ ...current, title: event.target.value }))}
                        placeholder={meta.titlePlaceholder}
                        className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
                    />
                    <AutoGrowField
                        value={captureDraft.summary}
                        onChange={(event) => onCaptureChange((current) => ({ ...current, summary: event.target.value }))}
                        placeholder={meta.bodyPlaceholder}
                    />
                </div>
            )}

            <div className="mt-4 flex justify-end">
                <Button onClick={onSubmit}>{meta.submitLabel}</Button>
            </div>
        </div>
    );
}

function AutoGrowField({
    value,
    onChange,
    placeholder
}: {
    value: string;
    onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
    placeholder: string;
}) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
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
            onChange={onChange}
            placeholder={placeholder}
            className="w-full resize-none overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
        />
    );
}

type TeamCollectionItem = {
    resource: TeamEditableResource;
    record: TeamEditableRecord;
    title: string;
    description: string;
    meta: string;
    statusLabel: string;
    menuKey: string;
};

function createTeamEditorDraft(resource: TeamEditableResource, record: TeamEditableRecord) {
    if (resource === 'threads') {
        const thread = record as CommentThread;
        return {
            title: thread.title,
            body: thread.body,
            nextStep: thread.nextStep,
            status: thread.status
        };
    }

    if (resource === 'cards') {
        const linkedCard = record as CollaborationCard;
        return {
            title: linkedCard.title,
            summary: linkedCard.summary,
            type: linkedCard.type,
            status: linkedCard.status
        };
    }

    if (resource === 'artifacts') {
        const artifact = record as ProjectArtifact;
        return {
            title: artifact.title,
            summary: artifact.summary,
            type: artifact.type,
            status: artifact.status
        };
    }

    if (resource === 'decisions') {
        const decision = record as DecisionLogEntry;
        return {
            title: decision.title,
            decision: decision.decision,
            rationale: decision.rationale,
            background: decision.background,
            options: decision.options
        };
    }

    const task = record as TaskItem;
    return {
        title: task.title,
        details: task.details,
        status: task.status
    };
}

function buildTeamCollectionItems(
    mode: TeamCollectionMode,
    collections: {
        runThreads: CommentThread[];
        linkedCards: CollaborationCard[];
        linkedArtifacts: ProjectArtifact[];
        linkedDecisions: DecisionLogEntry[];
        linkedTasks: TaskItem[];
    }
): TeamCollectionItem[] {
    if (mode === 'thread') {
        return collections.runThreads.map((thread) => ({
            resource: 'threads',
            record: thread,
            title: thread.title || 'Untitled thread',
            description: thread.body || 'No thread notes yet.',
            meta: thread.nextStep ? `Next step: ${thread.nextStep}` : 'Waiting for team review.',
            statusLabel: thread.status === 'resolved' ? 'Resolved' : 'Open',
            menuKey: `threads:${thread.id}`
        }));
    }

    if (mode === 'card') {
        return collections.linkedCards.map((linkedCard) => ({
            resource: 'cards',
            record: linkedCard,
            title: linkedCard.title,
            description: linkedCard.summary || 'No summary added yet.',
            meta: `${formatLinkedCardType(linkedCard.type)} · ${formatLinkedCardStatus(linkedCard.status)}`,
            statusLabel: formatLinkedCardStatus(linkedCard.status),
            menuKey: `cards:${linkedCard.id}`
        }));
    }

    if (mode === 'artifact') {
        return collections.linkedArtifacts.map((artifact) => ({
            resource: 'artifacts',
            record: artifact,
            title: artifact.title,
            description: artifact.summary || 'No output summary added yet.',
            meta: `${formatArtifactType(artifact.type)} · ${formatArtifactStatus(artifact.status)}`,
            statusLabel: formatArtifactStatus(artifact.status),
            menuKey: `artifacts:${artifact.id}`
        }));
    }

    if (mode === 'decision') {
        return collections.linkedDecisions.map((decision) => ({
            resource: 'decisions',
            record: decision,
            title: decision.title,
            description: decision.decision || decision.background || 'No decision details added yet.',
            meta: decision.rationale ? `Why: ${decision.rationale}` : 'Decision captured from this method.',
            statusLabel: formatDecisionStatus(decision.status),
            menuKey: `decisions:${decision.id}`
        }));
    }

    return collections.linkedTasks.map((task) => ({
        resource: 'tasks',
        record: task,
        title: task.title,
        description: task.details || 'No task details added yet.',
        meta: task.dueDate ? `Due: ${task.dueDate}` : 'No due date set.',
        statusLabel: formatTaskStatus(task.status),
        menuKey: `tasks:${task.id}`
    }));
}

function getTeamCollectionMeta(mode: TeamCollectionMode) {
    if (mode === 'thread') {
        return {
            eyebrow: 'Threads',
            title: 'Open thread list',
            description: 'Review unresolved questions and next steps captured from this method run.',
            emptyState: 'No threads have been captured from this card yet.'
        };
    }

    if (mode === 'card') {
        return {
            eyebrow: 'Linked cards',
            title: 'Board cards from this run',
            description: 'These cards were created directly from the current method so the team can track them in Hub.',
            emptyState: 'No linked board cards yet.'
        };
    }

    if (mode === 'artifact') {
        return {
            eyebrow: 'Artifacts',
            title: 'Captured outputs',
            description: 'Reusable outputs, evidence, or notes that came out of this card.',
            emptyState: 'No artifacts have been captured from this card yet.'
        };
    }

    if (mode === 'decision') {
        return {
            eyebrow: 'Decisions',
            title: 'Logged decisions',
            description: 'Calls that were made in this card and sent back into Project Hub.',
            emptyState: 'No decisions have been logged from this card yet.'
        };
    }

    return {
        eyebrow: 'Tasks',
        title: 'Action list',
        description: 'Tasks created from this method so momentum carries into execution.',
        emptyState: 'No follow-up tasks have been created from this card yet.'
    };
}

function getTeamEditorMeta(resource: TeamEditableResource) {
    if (resource === 'threads') {
        return {
            title: 'Edit thread',
            eyebrow: 'Thread',
            description: 'Adjust the thread summary, notes, and next step without leaving this card.',
            icon: MessageSquareMore
        };
    }

    if (resource === 'cards') {
        return {
            title: 'Edit linked card',
            eyebrow: 'Board card',
            description: 'Update the linked board card using the same card-style editor as Project Hub.',
            icon: LayoutGrid
        };
    }

    if (resource === 'artifacts') {
        return {
            title: 'Edit artifact',
            eyebrow: 'Artifact',
            description: 'Refine the captured output so the team can review or reuse it later.',
            icon: FileStack
        };
    }

    if (resource === 'decisions') {
        return {
            title: 'Edit decision',
            eyebrow: 'Decision',
            description: 'Update the decision record in place without leaving the method card.',
            icon: Gavel
        };
    }

    return {
        title: 'Edit task',
        eyebrow: 'Task',
        description: 'Adjust the task wording and status before sending the team back to Hub.',
        icon: ListTodo
    };
}

function TeamOverlayDialog({
    title,
    eyebrow,
    description,
    tone,
    icon: Icon,
    children,
    onClose
}: {
    title: string;
    eyebrow: string;
    description: string;
    tone: StageTheme;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/56 p-4 backdrop-blur-md">
            <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close dialog" />
            <div className="surface-panel-strong relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/10 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.34)] lg:p-7">
                <div className={cn('pointer-events-none absolute inset-x-10 top-3 h-1 rounded-full bg-gradient-to-r opacity-75', tone.accentGradient)} />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/0 via-white/70 to-white/0 opacity-70 dark:via-white/20" />
                <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[0_14px_32px_rgba(15,23,42,0.12)]', tone.accentBorder, tone.accentSoft, tone.accentText)}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className={cn('rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.08em]', tone.accentBorder, tone.accentText, tone.accentSoft)}>
                                {eyebrow}
                            </div>
                        </div>
                        <h3 className="mt-4 text-2xl font-display font-semibold text-[var(--foreground)] lg:text-[2rem]">{title}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)] lg:text-[0.95rem]">{description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
                </div>
                <div className="relative mt-6 space-y-4">{children}</div>
            </div>
        </div>
    );
}

function readStoredFacilitatorDock(): FacilitatorDockAnchor {
    if (typeof window === 'undefined') {
        return DEFAULT_FACILITATOR_DOCK;
    }

    try {
        const rawValue = window.localStorage.getItem(FACILITATOR_DOCK_STORAGE_KEY);
        if (!rawValue) {
            return DEFAULT_FACILITATOR_DOCK;
        }

        const parsedValue = JSON.parse(rawValue) as Partial<FacilitatorDockAnchor>;
        if (
            parsedValue &&
            typeof parsedValue.edge === 'string' &&
            ['left', 'right', 'top', 'bottom'].includes(parsedValue.edge) &&
            typeof parsedValue.offset === 'number'
        ) {
            return {
                edge: parsedValue.edge as FacilitatorDockEdge,
                offset: parsedValue.offset
            };
        }
    } catch {
        return DEFAULT_FACILITATOR_DOCK;
    }

    return DEFAULT_FACILITATOR_DOCK;
}

function clampFacilitatorDockAnchor(
    anchor: FacilitatorDockAnchor,
    bounds: FacilitatorDockBounds,
    dockSize: FacilitatorDockSize
): FacilitatorDockAnchor {
    if (!bounds.width || !bounds.height) {
        return anchor;
    }

    const maxVerticalOffset = Math.max(FACILITATOR_EDGE_PADDING, bounds.height - dockSize.height - FACILITATOR_EDGE_PADDING);
    const maxHorizontalOffset = Math.max(FACILITATOR_EDGE_PADDING, bounds.width - dockSize.width - FACILITATOR_EDGE_PADDING);
    const clampedOffset = anchor.edge === 'left' || anchor.edge === 'right'
        ? clampNumber(anchor.offset, FACILITATOR_EDGE_PADDING, maxVerticalOffset)
        : clampNumber(anchor.offset, FACILITATOR_EDGE_PADDING, maxHorizontalOffset);

    return {
        edge: anchor.edge,
        offset: Math.round(clampedOffset)
    };
}

function getFacilitatorDockStyle(
    anchor: FacilitatorDockAnchor,
    bounds: FacilitatorDockBounds,
    dockSize: FacilitatorDockSize
): React.CSSProperties {
    const clampedAnchor = clampFacilitatorDockAnchor(anchor, bounds, dockSize);

    switch (clampedAnchor.edge) {
        case 'left':
            return {
                left: FACILITATOR_EDGE_PADDING,
                top: clampedAnchor.offset
            };
        case 'top':
            return {
                left: clampedAnchor.offset,
                top: FACILITATOR_EDGE_PADDING
            };
        case 'bottom':
            return {
                left: clampedAnchor.offset,
                bottom: FACILITATOR_EDGE_PADDING
            };
        case 'right':
        default:
            return {
                right: FACILITATOR_EDGE_PADDING,
                top: clampedAnchor.offset
            };
    }
}

function getFacilitatorPanelStyle(
    anchor: FacilitatorDockAnchor,
    bounds: FacilitatorDockBounds,
    dockSize: FacilitatorDockSize
): React.CSSProperties {
    if (!bounds.width || !bounds.height) {
        switch (anchor.edge) {
            case 'left':
                return {
                    left: `calc(100% + ${FACILITATOR_DOCK_GAP}px)`,
                    top: 0
                };
            case 'top':
                return {
                    top: `calc(100% + ${FACILITATOR_DOCK_GAP}px)`,
                    left: 0
                };
            case 'bottom':
                return {
                    bottom: `calc(100% + ${FACILITATOR_DOCK_GAP}px)`,
                    left: 0
                };
            case 'right':
            default:
                return {
                    right: `calc(100% + ${FACILITATOR_DOCK_GAP}px)`,
                    top: 0
                };
        }
    }

    const clampedAnchor = clampFacilitatorDockAnchor(anchor, bounds, dockSize);

    if (clampedAnchor.edge === 'left' || clampedAnchor.edge === 'right') {
        const preferredTop = clampedAnchor.offset - (FACILITATOR_PANEL_HEIGHT - dockSize.height) / 2;
        const maxTop = Math.max(FACILITATOR_EDGE_PADDING, bounds.height - FACILITATOR_PANEL_HEIGHT - FACILITATOR_EDGE_PADDING);
        const clampedTop = clampNumber(preferredTop, FACILITATOR_EDGE_PADDING, maxTop);

        return clampedAnchor.edge === 'left'
            ? {
                left: `calc(100% + ${FACILITATOR_DOCK_GAP}px)`,
                top: clampedTop - clampedAnchor.offset
            }
            : {
                right: `calc(100% + ${FACILITATOR_DOCK_GAP}px)`,
                top: clampedTop - clampedAnchor.offset
            };
    }

    const preferredLeft = clampedAnchor.offset - (FACILITATOR_PANEL_WIDTH - dockSize.width) / 2;
    const maxLeft = Math.max(FACILITATOR_EDGE_PADDING, bounds.width - FACILITATOR_PANEL_WIDTH - FACILITATOR_EDGE_PADDING);
    const clampedLeft = clampNumber(preferredLeft, FACILITATOR_EDGE_PADDING, maxLeft);

    return clampedAnchor.edge === 'top'
        ? {
            top: `calc(100% + ${FACILITATOR_DOCK_GAP}px)`,
            left: clampedLeft - clampedAnchor.offset
        }
        : {
            bottom: `calc(100% + ${FACILITATOR_DOCK_GAP}px)`,
            left: clampedLeft - clampedAnchor.offset
        };
}

function clampNumber(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function TeamInputField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</div>
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]"
            />
        </label>
    );
}

function TeamTextareaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</div>
            <AutoGrowField value={value} onChange={(event) => onChange(event.target.value)} placeholder="" />
        </label>
    );
}

function TeamSelectField({
    label,
    value,
    onChange,
    options
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</div>
            <RoundedSelect value={value} onChange={onChange} options={options} />
        </label>
    );
}

function formatLinkedCardType(type: string) {
    if (type === 'open-questions') {
        return 'Open questions';
    }

    return type.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatLinkedCardStatus(status: string) {
    return status.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatArtifactType(type: string) {
    return type.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatArtifactStatus(status: string) {
    return status.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDecisionStatus(status: string) {
    return status.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTaskStatus(status: string) {
    return status.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function getTeamQuickAddMeta(mode: Exclude<TeamQuickAddMode, null>) {
    if (mode === 'thread') {
        return {
            title: 'Add thread',
            description: 'Capture an open question, debate, or follow-up that still needs team review.',
            titlePlaceholder: 'Thread title',
            bodyPlaceholder: 'What still needs team input?',
            submitLabel: 'Add thread'
        };
    }

    if (mode === 'card') {
        return {
            title: 'Add linked card',
            description: 'Create a board card from this method run so it shows up in Project Hub.',
            titlePlaceholder: 'Board card title',
            bodyPlaceholder: 'Short summary or next move',
            submitLabel: 'Add board card'
        };
    }

    if (mode === 'artifact') {
        return {
            title: 'Add artifact',
            description: 'Capture a reusable output, insight, or concept from this method.',
            titlePlaceholder: 'Artifact title',
            bodyPlaceholder: 'What should the team reuse later?',
            submitLabel: 'Add artifact'
        };
    }

    if (mode === 'decision') {
        return {
            title: 'Log decision',
            description: 'Capture the call that was made here. Decisions added from the card save as decided by default.',
            titlePlaceholder: 'Decision title',
            bodyPlaceholder: 'What was decided and why?',
            submitLabel: 'Log decision'
        };
    }

    return {
        title: 'Add task',
        description: 'Turn the next action into a task before the workshop momentum fades.',
        titlePlaceholder: 'Task title',
        bodyPlaceholder: 'What needs to happen next?',
        submitLabel: 'Add task'
    };
}


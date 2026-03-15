import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDownCircle, Bot, ChevronLeft, Expand, Send, Sparkles, Workflow, X, Zap } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { RoundedSelect } from '@/components/ui/RoundedSelect';
import { cn } from '@/lib/utils';
import { MethodCard, ProjectContext, ProjectHubData, ToolRun } from '@/types';
import { aiGateway } from '@/lib/services/aiGateway';

interface MethodSplitViewProps {
    card: MethodCard;
    context: ProjectContext;
    existingRun?: ToolRun;
    hub: ProjectHubData;
    isHubLoading?: boolean;
    onCreateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks' | 'presence'>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
    onSave: (run: Partial<ToolRun>) => void;
    onBack: () => void;
}

const createAiResponseEntry = (prompt: string, response: string) => ({
    prompt,
    response,
    timestamp: Date.now()
});

const STAGE_THEMES = {
    explore: {
        accentText: 'text-emerald-600',
        accentBorder: 'border-emerald-200',
        accentSoft: 'bg-emerald-50/70',
        accentSolid: 'bg-emerald-600',
        accentHover: 'hover:border-emerald-300 hover:text-emerald-700',
        accentGradient: 'from-emerald-500/24 via-emerald-300/10 to-transparent',
        accentGlow: 'bg-emerald-400/18'
    },
    imagine: {
        accentText: 'text-rose-600',
        accentBorder: 'border-rose-200',
        accentSoft: 'bg-rose-50/70',
        accentSolid: 'bg-rose-600',
        accentHover: 'hover:border-rose-300 hover:text-rose-700',
        accentGradient: 'from-rose-500/24 via-rose-300/10 to-transparent',
        accentGlow: 'bg-rose-400/18'
    },
    implement: {
        accentText: 'text-amber-600',
        accentBorder: 'border-amber-200',
        accentSoft: 'bg-amber-50/70',
        accentSolid: 'bg-amber-600',
        accentHover: 'hover:border-amber-300 hover:text-amber-700',
        accentGradient: 'from-amber-500/24 via-amber-300/10 to-transparent',
        accentGlow: 'bg-amber-400/18'
    },
    'tell-story': {
        accentText: 'text-sky-600',
        accentBorder: 'border-sky-200',
        accentSoft: 'bg-sky-50/70',
        accentSolid: 'bg-sky-600',
        accentHover: 'hover:border-sky-300 hover:text-sky-700',
        accentGradient: 'from-sky-500/24 via-sky-300/10 to-transparent',
        accentGlow: 'bg-sky-400/18'
    }
} as const;

export function MethodSplitView({
    card,
    context,
    existingRun,
    hub,
    isHubLoading = false,
    onCreateHubRecord,
    onUpdateHubRecord,
    onSave,
    onBack
}: MethodSplitViewProps) {
    const [responses, setResponses] = useState(existingRun?.aiResponses || []);
    const [isLoading, setIsLoading] = useState(false);
    const [isFacilitatorOpen, setIsFacilitatorOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isMobileAiPanelOpen, setIsMobileAiPanelOpen] = useState(false);
    const [isReferencePreviewOpen, setIsReferencePreviewOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<'ai' | 'team'>('ai');
    const [threadDraft, setThreadDraft] = useState({ title: '', body: '', nextStep: '' });
    const [captureDraft, setCaptureDraft] = useState({ type: 'artifact', title: '', summary: '', status: 'draft' });
    const hasPersistedResponsesRef = useRef(false);
    const onSaveRef = useRef(onSave);

    const referencePages = card.referencePages?.length
        ? card.referencePages
        : [{ id: `${card.id}-front`, label: 'Card Front', image: card.image }];
    const [activeReferencePageId, setActiveReferencePageId] = useState(referencePages[0].id);
    const theme = STAGE_THEMES[card.stage as keyof typeof STAGE_THEMES] || STAGE_THEMES.explore;

    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    useEffect(() => {
        if (!hasPersistedResponsesRef.current) {
            hasPersistedResponsesRef.current = true;
            return;
        }

        onSaveRef.current({ aiResponses: responses });
    }, [responses]);

    const activeReferencePage = referencePages.find(page => page.id === activeReferencePageId) || referencePages[0];
    const activeReferenceIndex = referencePages.findIndex(page => page.id === activeReferencePage.id);
    const runId = existingRun?.id || null;
    const runThreads = runId ? hub.threads.filter((thread) => thread.entityType === 'tool-run' && thread.entityId === runId) : [];
    const linkedCards = runId ? hub.cards.filter((item) => item.linkedRunId === runId) : [];
    const linkedArtifacts = runId ? hub.artifacts.filter((item) => item.linkedRunId === runId) : [];
    const linkedTasks = runId ? hub.tasks.filter((item) => item.linkedEntityType === 'tool-run' && item.linkedEntityId === runId) : [];
    const linkedDecisions = runId ? hub.decisions.filter((item) => String(item.metadata.linkedRunId || '') === runId) : [];

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
                decision: '',
                options: '',
                rationale: '',
                status: 'proposed',
                metadata: {
                    linkedRunId: runId
                }
            });
        }

        setCaptureDraft({ type: 'artifact', title: '', summary: '', status: 'draft' });
    };

    return (
        <div className="relative flex flex-col lg:flex-row h-full overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--body-top),var(--body-bottom))]"></div>
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', theme.accentGradient)}></div>

            <div className="relative h-full w-full shrink-0 border-r border-white/10 bg-[linear-gradient(180deg,#09111f,#0d1728)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] lg:w-[62%] flex flex-col overflow-hidden">
                <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,rgba(148,163,184,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.6)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
                <div className={cn('absolute top-[-8%] right-[-10%] h-[22rem] w-[22rem] rounded-full blur-[90px] pointer-events-none', theme.accentGlow)}></div>

                <div className="absolute top-4 left-4 z-20">
                    <Button variant="secondary" size="sm" onClick={onBack} className="bg-white/88 border-white/70">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                </div>

                <div className="px-6 pt-20 lg:px-8 lg:pt-24">
                    <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] bg-white/6 text-white/72', theme.accentBorder)}>
                        Reference Deck
                    </div>
                    <h2 className="mt-4 text-3xl font-display font-semibold text-white">{card.title}</h2>
                    <p className="mt-3 text-sm lg:text-base text-slate-200 max-w-xl leading-relaxed">{card.purpose}</p>
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
                        {referencePages.length > 1 ? (
                            <div className="inline-flex flex-wrap justify-center gap-2 rounded-full border border-white/10 bg-white/6 p-1.5 backdrop-blur-sm">
                            {referencePages.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => setActiveReferencePageId(page.id)}
                                    className={cn(
                                        'rounded-full px-4 py-2 text-xs lg:text-sm font-medium transition-all duration-300 border border-transparent backdrop-blur-sm',
                                        page.id === activeReferencePage.id
                                            ? `${theme.accentSolid} translate-y-[-1px] text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]`
                                            : `bg-transparent text-slate-200/86 hover:bg-white/10 ${theme.accentHover}`
                                    )}
                                >
                                    {page.label}
                                </button>
                            ))}
                            </div>
                        ) : (
                            <div />
                        )}

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

                <div className="bg-black/22 border-t border-white/8 px-4 py-3 lg:px-6 text-[11px] lg:text-xs text-center text-slate-400">
                    <div key={`${activeReferencePage.id}-${activeReferenceIndex}`} className="animate-reference-page-in">
                        Reference Card: {card.title} / {activeReferencePage.label}
                    </div>
                </div>
            </div>

            <div
                className={cn(
                    'relative surface-panel-strong flex flex-col transition-transform duration-300 ease-in-out border-t shadow-[0_-12px_40px_rgba(15,23,42,0.12)]',
                    'lg:w-[38%] lg:h-full lg:translate-y-0 lg:static lg:shadow-none',
                    'absolute bottom-0 left-0 right-0 h-[82%] z-40 rounded-t-[28px]',
                    isMobileAiPanelOpen ? 'translate-y-0' : 'translate-y-[110%]'
                )}
            >
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

                <div className="hidden lg:block border-b border-[var(--panel-border)] px-8 py-7 shrink-0">
                    <div className={cn('text-[11px] uppercase tracking-[0.22em] font-semibold', theme.accentText)}>
                        {activePanel === 'ai' ? 'Prompt Board' : 'Team Collaboration'}
                    </div>
                    <h3 className="mt-3 text-2xl font-display font-semibold text-[var(--foreground)]">{card.title}</h3>
                    <p className="mt-2 text-[var(--foreground-soft)] text-sm leading-relaxed">{card.purpose}</p>
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
                </div>

                <div className="scrollbar-none flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
                    {activePanel === 'ai' && (
                        <>
                    <div className={cn('rounded-[24px] border p-4 lg:p-5', theme.accentBorder, theme.accentSoft)}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', theme.accentText)}>AI Facilitator</div>
                                <div className="mt-2 text-base font-semibold text-[var(--foreground)]">Prompt board is live for this method.</div>
                                <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                    Start with the suggested prompts below, or open the facilitator bubble for free-form help while you run the session.
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
                                Select a prompt above to start the session.
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
                            <div className={cn('rounded-[24px] border p-4 lg:p-5', theme.accentBorder, theme.accentSoft)}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', theme.accentText)}>Outcome capture</div>
                                        <div className="mt-2 text-base font-semibold text-[var(--foreground)]">Turn this method run into shared project work.</div>
                                        <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                            Capture artifacts, board cards, decisions, and tasks directly from the method so nothing gets lost after the session.
                                        </div>
                                    </div>
                                    <div className={cn('rounded-full px-3 py-1 text-xs font-semibold', theme.accentSolid, 'text-white')}>
                                        {isHubLoading ? 'Syncing' : 'Live'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <TeamMetric title="Threads" value={String(runThreads.length)} />
                                <TeamMetric title="Linked Cards" value={String(linkedCards.length)} />
                                <TeamMetric title="Artifacts" value={String(linkedArtifacts.length)} />
                                <TeamMetric title="Decisions" value={String(linkedDecisions.length)} />
                                <TeamMetric title="Tasks" value={String(linkedTasks.length)} />
                            </div>

                            <div className="rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] p-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Capture Outcome</div>
                                <div className="mt-4 space-y-3">
                                    <RoundedSelect
                                        value={captureDraft.type}
                                        onChange={(value) => setCaptureDraft((current) => ({ ...current, type: value, status: value === 'artifact' ? 'draft' : current.status }))}
                                        options={[
                                            { value: 'artifact', label: 'Artifact' },
                                            { value: 'card', label: 'Board Card' },
                                            { value: 'decision', label: 'Decision' },
                                            { value: 'task', label: 'Task' }
                                        ]}
                                        buttonClassName="bg-[var(--panel-strong)]"
                                    />
                                    <input value={captureDraft.title} onChange={(event) => setCaptureDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Outcome title" className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]" />
                                    <textarea value={captureDraft.summary} onChange={(event) => setCaptureDraft((current) => ({ ...current, summary: event.target.value }))} placeholder="What should the team see or act on?" className="h-28 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]" />
                                    <Button onClick={() => void handleCaptureOutcome()}>Capture Outcome</Button>
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] p-5">
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Discussion Thread</div>
                                <div className="mt-4 space-y-3">
                                    <input value={threadDraft.title} onChange={(event) => setThreadDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Thread title" className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]" />
                                    <textarea value={threadDraft.body} onChange={(event) => setThreadDraft((current) => ({ ...current, body: event.target.value }))} placeholder="What needs feedback, review, or follow-up?" className="h-24 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]" />
                                    <input value={threadDraft.nextStep} onChange={(event) => setThreadDraft((current) => ({ ...current, nextStep: event.target.value }))} placeholder="Next step" className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]" />
                                    <Button variant="secondary" onClick={() => void handleCreateThread()}>Add Thread</Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {runThreads.length === 0 && (
                                    <div className="rounded-[24px] border border-dashed border-[var(--panel-border)] bg-[var(--panel)] px-4 py-6 text-center text-sm italic text-[var(--foreground-muted)]">
                                        No team threads are attached to this method yet.
                                    </div>
                                )}
                                {runThreads.map((thread) => (
                                    <div key={thread.id} className={cn('rounded-[24px] border bg-[var(--panel)] p-5', theme.accentBorder)}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-semibold text-[var(--foreground)]">{thread.title}</div>
                                                <div className="mt-1 text-xs text-[var(--foreground-muted)]">{thread.status} • next: {thread.nextStep || 'Not set'}</div>
                                            </div>
                                            <Button size="sm" variant="secondary" onClick={() => void onUpdateHubRecord('threads', thread.id, { ...thread, status: thread.status === 'open' ? 'resolved' : 'open', version: thread.version })}>
                                                {thread.status === 'open' ? 'Resolve' : 'Re-open'}
                                            </Button>
                                        </div>
                                        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground-soft)]">{thread.body}</div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="lg:hidden absolute bottom-6 left-6 z-30">
                <button
                    onClick={() => setIsMobileAiPanelOpen(true)}
                    className={cn('text-white p-4 rounded-full shadow-2xl transition-transform active:scale-95 flex items-center justify-center', theme.accentSolid)}
                >
                    <Zap className="w-6 h-6" />
                </button>
            </div>

            <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8 z-50">
                {!isFacilitatorOpen && (
                    <div className="relative">
                        <span
                            aria-hidden="true"
                            className={cn(
                                'pointer-events-none absolute inset-[-8px] rounded-full opacity-40 blur-[2px] animate-facilitator-breathe',
                                theme.accentSolid
                            )}
                        />
                        <button
                            onClick={() => setIsFacilitatorOpen(true)}
                            aria-label="Open AI Facilitator"
                            className={cn(
                                'relative inline-flex items-center gap-2.5 rounded-full px-4 py-3 lg:px-5 lg:py-4 text-sm lg:text-base font-semibold text-white shadow-[0_22px_54px_rgba(15,23,42,0.18)] hover:scale-105 transition-transform border border-white/20 backdrop-blur-xl',
                                theme.accentSolid
                            )}
                        >
                            <Bot className="w-5 h-5 lg:w-6 lg:h-6 shrink-0 text-white" strokeWidth={2.1} />
                            <span className="whitespace-nowrap text-white">AI Facilitator</span>
                        </button>
                    </div>
                )}

                {isFacilitatorOpen && (
                    <div className="surface-panel-strong rounded-[24px] shadow-[0_24px_60px_rgba(15,23,42,0.18)] w-72 lg:w-80 flex flex-col overflow-hidden absolute bottom-16 right-0 lg:static">
                        <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
                            <span className="font-semibold flex items-center gap-2 text-sm">
                                <Bot className={cn('w-4 h-4', theme.accentText.replace('text-', 'text-'))} />
                                AI Facilitator
                            </span>
                            <button onClick={() => setIsFacilitatorOpen(false)}><X className="w-4 h-4" /></button>
                        </div>
                        <div className="h-64 space-y-3 p-4 bg-[var(--panel)] overflow-y-auto text-sm text-[var(--foreground-soft)] leading-relaxed">
                            <div className={cn('max-w-[88%] rounded-[18px] border px-4 py-3 shadow-sm', theme.accentBorder, theme.accentSoft)}>
                                Hello. I know about <strong>{context.name}</strong>. Ask for help with facilitation, framing, or the next move in <strong>{card.title}</strong>.
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
                                    Thinking through the next facilitation step...
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-[var(--panel-border)] bg-[var(--panel-strong)] flex gap-2">
                            <input
                                className="flex-1 text-sm outline-none bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                                placeholder="Ask for help..."
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
                <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/86 p-4 backdrop-blur-md">
                    <button
                        type="button"
                        aria-label="Close enlarged reference"
                        className="absolute inset-0"
                        onClick={() => setIsReferencePreviewOpen(false)}
                    />

                    <div className="relative z-10 flex h-full max-h-[min(92vh,72rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,#0a1323,#0c1728)] shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
                        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 text-white lg:px-6">
                            <div>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">Reference Preview</div>
                                <div className="mt-1 text-base font-semibold lg:text-lg">{card.title}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsReferencePreviewOpen(false)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition-colors hover:bg-white/12"
                                aria-label="Close enlarged reference"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="relative flex-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_45%)] p-4 lg:p-6">
                            <div className="relative h-full w-full overflow-auto rounded-[24px] border border-white/8 bg-slate-950/30">
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
                            <div className="flex flex-wrap justify-center gap-2 border-t border-white/10 px-4 py-4">
                                {referencePages.map(page => (
                                    <button
                                        key={`${page.id}-preview`}
                                        type="button"
                                        onClick={() => setActiveReferencePageId(page.id)}
                                        className={cn(
                                            'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all lg:text-sm',
                                            page.id === activeReferencePage.id
                                                ? `${theme.accentSolid} border-transparent text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]`
                                                : 'border-white/12 bg-white/6 text-white/78 hover:bg-white/10'
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
        </div>
    );
}

function TeamMetric({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">{title}</div>
            <div className="mt-2 text-2xl font-display font-semibold text-[var(--foreground)]">{value}</div>
        </div>
    );
}

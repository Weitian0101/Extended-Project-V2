import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDownCircle, Bot, ChevronLeft, Send, Sparkles, X, Zap } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { MethodCard, ProjectContext, ToolRun } from '@/types';
import { aiGateway } from '@/lib/services/aiGateway';

interface MethodSplitViewProps {
    card: MethodCard;
    context: ProjectContext;
    existingRun?: ToolRun;
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

export function MethodSplitView({ card, context, existingRun, onSave, onBack }: MethodSplitViewProps) {
    const [responses, setResponses] = useState(existingRun?.aiResponses || []);
    const [isLoading, setIsLoading] = useState(false);
    const [isFacilitatorOpen, setIsFacilitatorOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isMobileAiPanelOpen, setIsMobileAiPanelOpen] = useState(false);
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

    return (
        <div className="relative flex flex-col lg:flex-row h-full overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--body-top),var(--body-bottom))]"></div>
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', theme.accentGradient)}></div>

            <div className="relative w-full lg:w-[58%] h-full bg-[linear-gradient(180deg,#09111f,#0d1728)] border-r border-white/8 flex flex-col overflow-hidden shrink-0">
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

                <div className="relative flex-1 min-h-[24rem] w-full lg:min-h-0">
                    <div key={activeReferencePage.id} className="absolute inset-0 animate-reference-page-in">
                        <Image
                            src={activeReferencePage.image}
                            alt="Method Reference"
                            fill
                            sizes="(min-width: 1024px) 58vw, 100vw"
                            style={{ objectFit: 'contain' }}
                            className="p-2 md:p-4 lg:p-5 xl:p-6"
                            unoptimized
                        />
                    </div>
                </div>

                {referencePages.length > 1 && (
                    <div className="px-4 pb-4 lg:px-6">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {referencePages.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => setActiveReferencePageId(page.id)}
                                    className={cn(
                                        'px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-all border backdrop-blur-sm',
                                        page.id === activeReferencePage.id
                                            ? `${theme.accentSolid} text-white border-transparent shadow-[0_14px_28px_rgba(15,23,42,0.18)]`
                                            : `bg-white/8 text-slate-200 border-white/10 ${theme.accentHover}`
                                    )}
                                >
                                    {page.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-black/22 border-t border-white/8 px-4 py-3 lg:px-6 text-[11px] lg:text-xs text-center text-slate-400">
                    Reference Card: {card.title} / {activeReferencePage.label}
                </div>
            </div>

            <div
                className={cn(
                    'relative surface-panel-strong flex flex-col transition-transform duration-300 ease-in-out border-t shadow-[0_-12px_40px_rgba(15,23,42,0.12)]',
                    'lg:w-[42%] lg:h-full lg:translate-y-0 lg:static lg:shadow-none',
                    'absolute bottom-0 left-0 right-0 h-[82%] z-40 rounded-t-[28px]',
                    isMobileAiPanelOpen ? 'translate-y-0' : 'translate-y-[110%]'
                )}
            >
                <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-[var(--panel-border)]">
                    <span className={cn('font-semibold flex items-center gap-2', theme.accentText)}>
                        <Sparkles className="w-4 h-4" /> AI Actions
                    </span>
                    <button onClick={() => setIsMobileAiPanelOpen(false)} className="p-2 rounded-full bg-[var(--panel)]">
                        <ArrowDownCircle className="w-5 h-5 text-[var(--foreground-muted)]" />
                    </button>
                </div>

                <div className="hidden lg:block border-b border-[var(--panel-border)] px-8 py-7 shrink-0">
                    <div className={cn('text-[11px] uppercase tracking-[0.22em] font-semibold', theme.accentText)}>Prompt Board</div>
                    <h3 className="mt-3 text-2xl font-display font-semibold text-[var(--foreground)]">{card.title}</h3>
                    <p className="mt-2 text-[var(--foreground-soft)] text-sm leading-relaxed">{card.purpose}</p>
                </div>

                <div className="scrollbar-none flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
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
        </div>
    );
}

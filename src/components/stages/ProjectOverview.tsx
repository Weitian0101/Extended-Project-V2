'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bot, FileText, Layers, PencilLine, Send, ShieldCheck, Sparkles, Target, Users2, Wand2, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { aiGateway } from '@/lib/services/aiGateway';
import { ProjectData } from '@/types';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ContextDraft {
    challenge: string;
    desiredShift: string;
    audiences: string[];
    constraints: string[];
    aiHandoffPrompt: string;
}

interface ProjectOverviewProps {
    project: ProjectData;
    onUpdateContext: (context: Partial<ProjectData['context']>) => void;
}

const PROMPT_RAIL = {
    challenge: [
        'A workshop series for reducing the delay between insight and action.',
        'A high-friction customer journey that keeps resurfacing in service calls.',
        'A product concept that needs clearer evidence before funding.'
    ],
    audience: [
        'Primary users in the most time-sensitive workflow',
        'Internal sponsor approving scope and budget',
        'Frontline team members who feel the pain every week'
    ],
    constraint: [
        'Must ship an experiment before the next steering review',
        'Needs legal approval before any external testing',
        'Can only use the current product team capacity'
    ]
};

function parseStructuredChallenge(value: string) {
    const raw = value.trim();
    if (!raw) {
        return {
            challenge: '',
            desiredShift: ''
        };
    }

    const sections = raw.split(/\n\s*\n/);
    let challenge = raw;
    let desiredShift = '';

    sections.forEach((section) => {
        const normalized = section.trim();
        if (/^desired shift:/i.test(normalized)) {
            desiredShift = normalized.replace(/^desired shift:\s*/i, '').trim();
        } else if (/^challenge:/i.test(normalized)) {
            challenge = normalized.replace(/^challenge:\s*/i, '').trim();
        }
    });

    if (!/^challenge:/i.test(raw) && !/^desired shift:/im.test(raw)) {
        challenge = raw;
    }

    return { challenge, desiredShift };
}

function serializeStructuredChallenge(challenge: string, desiredShift: string) {
    return [
        challenge.trim() ? `Challenge:\n${challenge.trim()}` : '',
        desiredShift.trim() ? `Desired shift:\n${desiredShift.trim()}` : ''
    ].filter(Boolean).join('\n\n');
}

function parseListField(value: string) {
    return value
        .split('\n')
        .map((entry) => entry.replace(/^\s*[-*]\s*/, '').trim())
        .filter(Boolean);
}

function serializeListField(values: string[]) {
    return values
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => `- ${value}`)
        .join('\n');
}

function buildDraft(context: ProjectData['context']): ContextDraft {
    const parsedChallenge = parseStructuredChallenge(context.background || '');

    return {
        challenge: parsedChallenge.challenge,
        desiredShift: parsedChallenge.desiredShift,
        audiences: parseListField(context.objectives || ''),
        constraints: parseListField(context.assumptions || ''),
        aiHandoffPrompt: context.aiHandoffPrompt || ''
    };
}

function buildAiHandoffMarkdown(projectName: string, draft: ContextDraft) {
    const audienceLines = draft.audiences.length > 0
        ? draft.audiences.map((item) => `- ${item}`).join('\n')
        : '- Audience still needs to be clarified.';
    const constraintLines = draft.constraints.length > 0
        ? draft.constraints.map((item) => `- ${item}`).join('\n')
        : '- Constraints still need to be clarified.';

    return [
        `# ${projectName || 'Innovation Sandbox Project'} System Prompt`,
        '',
        '## Role',
        'You are the project AI facilitator for this innovation sandbox. Stay grounded in the project frame below and keep responses practical, concrete, and decision-oriented.',
        '',
        '## Challenge',
        draft.challenge.trim() || 'Challenge still needs to be clarified.',
        '',
        '## Desired Shift',
        draft.desiredShift.trim() || 'Desired shift is still undefined.',
        '',
        '## Priority Audiences',
        audienceLines,
        '',
        '## Constraints',
        constraintLines,
        '',
        '## Facilitation Rules',
        '- Prefer concise outputs that help the team make progress.',
        '- Reflect tradeoffs, dependencies, and unresolved assumptions clearly.',
        '- Use the project context as the source of truth before suggesting new ideas.',
        '- When context is incomplete, call out the missing information instead of guessing.',
        '',
        '## Output Style',
        '- Use markdown.',
        '- Separate observations, risks, and recommended next actions.',
        '- Keep language concrete and useful for workshop or delivery teams.'
    ].join('\n');
}

function getPromptPreview(value: string) {
    return value
        .split('\n')
        .filter((line) => line.trim())
        .slice(0, 5)
        .join('\n');
}

export function ProjectOverview({ project, onUpdateContext }: ProjectOverviewProps) {
    const [draft, setDraft] = useState<ContextDraft>(() => buildDraft(project.context));
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [advancedPrompt, setAdvancedPrompt] = useState('');
    const [aiCorrectionInput, setAiCorrectionInput] = useState('');
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
    const [isGeneratingReply, setIsGeneratingReply] = useState(false);

    useEffect(() => {
        setDraft(buildDraft(project.context));
    }, [project.context]);

    useEffect(() => {
        if (isAdvancedOpen) {
            setAdvancedPrompt(draft.aiHandoffPrompt || buildAiHandoffMarkdown(project.context.name, draft));
        }
    }, [draft, isAdvancedOpen, project.context.name]);

    const completionCount = [
        draft.challenge.trim(),
        draft.audiences.length > 0 ? 'audiences' : '',
        draft.constraints.length > 0 ? 'constraints' : '',
        draft.aiHandoffPrompt.trim()
    ].filter(Boolean).length;

    const promptPreview = useMemo(() => (
        getPromptPreview(draft.aiHandoffPrompt || buildAiHandoffMarkdown(project.context.name, draft))
    ), [draft, project.context.name]);

    const syncContext = (nextDraft: ContextDraft) => {
        setDraft(nextDraft);
        onUpdateContext({
            background: serializeStructuredChallenge(nextDraft.challenge, nextDraft.desiredShift),
            objectives: serializeListField(nextDraft.audiences),
            assumptions: serializeListField(nextDraft.constraints),
            aiHandoffPrompt: nextDraft.aiHandoffPrompt
        });
    };

    const updateDraft = (updates: Partial<ContextDraft>) => {
        syncContext({
            ...draft,
            ...updates
        });
    };

    const handleGenerateHandoff = () => {
        updateDraft({
            aiHandoffPrompt: buildAiHandoffMarkdown(project.context.name, draft)
        });
    };

    const handleAdvancedSave = () => {
        updateDraft({
            aiHandoffPrompt: advancedPrompt
        });
        setIsAdvancedOpen(false);
    };

    const handleAiCorrection = async () => {
        const trimmed = aiCorrectionInput.trim();
        if (!trimmed || isGeneratingReply) {
            return;
        }

        setIsGeneratingReply(true);
        setAiMessages((current) => [...current, { role: 'user', content: trimmed }]);
        setAiCorrectionInput('');

        try {
            const response = await aiGateway.facilitatorChat({
                methodId: 'project-context-handoff',
                methodTitle: 'Project Context Handoff',
                stage: project.currentStage,
                project: {
                    ...project.context,
                    background: serializeStructuredChallenge(draft.challenge, draft.desiredShift),
                    objectives: serializeListField(draft.audiences),
                    assumptions: serializeListField(draft.constraints)
                },
                message: `Help revise the project system prompt with this correction: ${trimmed}`,
                history: []
            });

            setAiMessages((current) => [...current, { role: 'assistant', content: response.reply }]);
        } catch (error) {
            setAiMessages((current) => [...current, {
                role: 'assistant',
                content: error instanceof Error ? error.message : 'Unable to prepare a revision suggestion right now.'
            }]);
        } finally {
            setIsGeneratingReply(false);
        }
    };

    return (
        <div className="relative h-full overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="absolute top-0 right-0 h-[540px] w-[540px] rounded-full bg-gradient-to-br from-sky-100 to-cyan-100 blur-[110px] opacity-60 pointer-events-none" />

            <div className="scrollbar-none relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
                <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="surface-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                            <Layers className="h-4 w-4 text-sky-600" />
                            Project Context
                        </div>
                        <h1 className="mt-4 text-3xl font-display font-semibold tracking-tight text-[var(--foreground)] lg:text-4xl">Project Context</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ContextChip label={`${completionCount}/4 context signals`} />
                        <ContextChip label={`${draft.audiences.length} audiences`} />
                        <ContextChip label={`${draft.constraints.length} constraints`} />
                    </div>
                </header>

                <div className="space-y-6">
                    <div className="surface-panel-strong rounded-[32px] p-5 lg:p-7">
                        <label className="block">
                            <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[var(--foreground-muted)]">Project name</div>
                            <input
                                className="w-full border-b-2 border-[var(--panel-border)] bg-transparent pb-2 text-2xl font-display font-semibold text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--foreground-muted)] focus:border-blue-600 lg:text-3xl"
                                value={project.context.name}
                                onChange={(event) => onUpdateContext({ name: event.target.value })}
                                placeholder="Untitled Innovation Project"
                            />
                        </label>

                        <div className="mt-7 grid gap-5 lg:grid-cols-2">
                            <ContextField
                                label="Challenge narrative"
                                placeholder="What is the core problem, opportunity, or tension behind this project?"
                                value={draft.challenge}
                                onChange={(value) => updateDraft({ challenge: value })}
                                rows={5}
                                icon={Layers}
                                accentClassName="text-sky-600"
                                panelClassName="lg:min-h-[18rem] border-sky-200/60 bg-[linear-gradient(180deg,rgba(56,189,248,0.09),rgba(56,189,248,0.02))]"
                            />
                            <ContextField
                                label="Desired shift"
                                placeholder="What should be different if this project succeeds?"
                                value={draft.desiredShift}
                                onChange={(value) => updateDraft({ desiredShift: value })}
                                rows={5}
                                icon={Target}
                                accentClassName="text-violet-600"
                                panelClassName="lg:min-h-[18rem] border-violet-200/60 bg-[linear-gradient(180deg,rgba(139,92,246,0.09),rgba(139,92,246,0.02))]"
                            />
                            <ListComposer
                                label="Audience list"
                                placeholder="Add an audience or stakeholder"
                                values={draft.audiences}
                                suggestions={PROMPT_RAIL.audience}
                                accent="text-emerald-600"
                                compact
                                showSuggestions={false}
                                icon={Users2}
                                panelClassName="lg:min-h-[18rem] border-emerald-200/60 bg-[linear-gradient(180deg,rgba(16,185,129,0.09),rgba(16,185,129,0.02))]"
                                onChange={(values) => updateDraft({ audiences: values })}
                            />
                            <ListComposer
                                label="Constraint list"
                                placeholder="Add a constraint, risk, or dependency"
                                values={draft.constraints}
                                suggestions={PROMPT_RAIL.constraint}
                                accent="text-amber-600"
                                compact
                                showSuggestions={false}
                                icon={ShieldCheck}
                                panelClassName="lg:min-h-[18rem] border-amber-200/60 bg-[linear-gradient(180deg,rgba(245,158,11,0.09),rgba(245,158,11,0.02))]"
                                onChange={(values) => updateDraft({ constraints: values })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.42fr_0.58fr]">
                        <div className="surface-panel-strong rounded-[32px] p-5 lg:p-6">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                <FileText className="h-4 w-4 text-violet-500" />
                                AI handoff
                            </div>
                            <div className="mt-4 rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] p-4 lg:p-5">
                                <pre className="max-h-[12.5rem] overflow-hidden whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--foreground-soft)] lg:max-h-none">
                                    {promptPreview || 'Generate the project system prompt after you frame the challenge, audiences, and constraints.'}
                                </pre>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button onClick={handleGenerateHandoff}>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Generate AI Handoff
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (!draft.aiHandoffPrompt.trim()) {
                                            handleGenerateHandoff();
                                        }
                                        setIsAdvancedOpen(true);
                                    }}
                                >
                                    <PencilLine className="mr-2 h-4 w-4" />
                                    Advanced
                                </Button>
                            </div>
                        </div>

                        <div className="surface-panel-strong rounded-[32px] p-5 lg:p-6">
                            <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                <Sparkles className="h-4 w-4 text-sky-500" />
                                Context health
                            </div>
                            <div className="grid gap-3">
                                <ContextMetric
                                    icon={Layers}
                                    label="Challenge blocks"
                                    value={draft.challenge.trim() ? 'Ready' : 'Empty'}
                                    helper={draft.challenge.trim() ? 'Core problem framing is in place.' : 'Add the main tension or opportunity.'}
                                    tone="sky"
                                    compact
                                />
                                <ContextMetric
                                    icon={Users2}
                                    label="Audience coverage"
                                    value={`${draft.audiences.length} item${draft.audiences.length === 1 ? '' : 's'}`}
                                    helper={draft.audiences.length > 0 ? 'Priority people are listed.' : 'Add the stakeholders this work serves.'}
                                    tone="emerald"
                                    compact
                                />
                                <ContextMetric
                                    icon={Target}
                                    label="Constraint coverage"
                                    value={`${draft.constraints.length} item${draft.constraints.length === 1 ? '' : 's'}`}
                                    helper={draft.constraints.length > 0 ? 'Guardrails and dependencies are captured.' : 'Add limits, risks, or dependencies.'}
                                    tone="amber"
                                    compact
                                />
                                <ContextMetric
                                    icon={ShieldCheck}
                                    label="Prompt status"
                                    value={draft.aiHandoffPrompt.trim() ? 'Generated' : 'Pending'}
                                    helper={draft.aiHandoffPrompt.trim() ? 'AI handoff is ready to review.' : 'Generate the project system prompt.'}
                                    tone="violet"
                                    compact
                                />
                            </div>
                        </div>
                    </div>

                    <div className="surface-panel-strong rounded-[32px] p-5 lg:p-6">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                            <Sparkles className="h-4 w-4 text-sky-500" />
                            Prompt examples
                        </div>
                        <div className="mt-4 grid gap-4 xl:grid-cols-3">
                            <PromptRailCard
                                title="Challenge"
                                accent="text-sky-600"
                                prompts={PROMPT_RAIL.challenge}
                                onPick={(value) => updateDraft({ challenge: draft.challenge ? `${draft.challenge}\n${value}` : value })}
                            />
                            <PromptRailCard
                                title="Audience"
                                accent="text-emerald-600"
                                prompts={PROMPT_RAIL.audience}
                                onPick={(value) => updateDraft({ audiences: [...draft.audiences, value].filter((item, index, array) => array.indexOf(item) === index) })}
                            />
                            <PromptRailCard
                                title="Constraint"
                                accent="text-amber-600"
                                prompts={PROMPT_RAIL.constraint}
                                onPick={(value) => updateDraft({ constraints: [...draft.constraints, value].filter((item, index, array) => array.indexOf(item) === index) })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isAdvancedOpen && (
                <PromptModal
                    value={advancedPrompt}
                    messages={aiMessages}
                    aiCorrectionInput={aiCorrectionInput}
                    isGeneratingReply={isGeneratingReply}
                    onClose={() => setIsAdvancedOpen(false)}
                    onChange={setAdvancedPrompt}
                    onSave={handleAdvancedSave}
                    onRegenerate={() => setAdvancedPrompt(buildAiHandoffMarkdown(project.context.name, draft))}
                    onCorrectionChange={setAiCorrectionInput}
                    onAskAi={() => void handleAiCorrection()}
                />
            )}
        </div>
    );
}

function ContextChip({ label }: { label: string }) {
    return (
        <div className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-soft)]">
            {label}
        </div>
    );
}

function ContextField({
    label,
    value,
    placeholder,
    rows,
    onChange,
    icon: Icon,
    accentClassName,
    panelClassName
}: {
    label: string;
    value: string;
    placeholder: string;
    rows: number;
    onChange: (value: string) => void;
    icon?: React.ComponentType<{ className?: string }>;
    accentClassName?: string;
    panelClassName?: string;
}) {
    return (
        <div className={cn('rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel)] p-4 lg:p-5', panelClassName)}>
            <div className={cn('mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]', accentClassName)}>
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {label}
            </div>
            <textarea
                className="w-full resize-none rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-base leading-relaxed text-[var(--foreground-soft)] outline-none transition-all placeholder:text-[var(--foreground-muted)] hover:bg-[var(--panel-strong)] focus:bg-[var(--panel-strong)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={rows}
            />
        </div>
    );
}

function ListComposer({
    label,
    placeholder,
    values,
    suggestions,
    accent,
    compact = false,
    showSuggestions = true,
    icon: Icon,
    panelClassName,
    onChange
}: {
    label: string;
    placeholder: string;
    values: string[];
    suggestions: string[];
    accent: string;
    compact?: boolean;
    showSuggestions?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
    panelClassName?: string;
    onChange: (values: string[]) => void;
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
        <div className={cn('rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel)] p-4', compact && 'lg:p-5', panelClassName)}>
            <div className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]', accent)}>
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {label}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {values.length === 0 && <div className="text-sm text-[var(--foreground-muted)]">Nothing added yet.</div>}
                {values.map((value) => (
                    <span key={value} className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-1.5 text-sm text-[var(--foreground-soft)]">
                        {value}
                        <button
                            type="button"
                            onClick={() => onChange(values.filter((item) => item !== value))}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </span>
                ))}
            </div>
            {showSuggestions ? (
                <div className="mt-4 flex flex-wrap gap-2">
                    {suggestions.filter((item) => !values.includes(item)).map((suggestion) => (
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
            ) : null}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
    );
}

function PromptRailCard({
    title,
    accent,
    prompts,
    onPick
}: {
    title: string;
    accent: string;
    prompts: string[];
    onPick: (value: string) => void;
}) {
    return (
        <div className="rounded-[26px] border border-[var(--panel-border)] bg-[var(--panel)] p-4">
            <div className={cn('text-xs font-semibold uppercase tracking-[0.22em]', accent)}>{title}</div>
            <div className="mt-4 space-y-2">
                {prompts.map((prompt) => (
                    <button
                        key={prompt}
                        type="button"
                        onClick={() => onPick(prompt)}
                        className="w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-3 text-left text-sm text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ContextMetric({
    icon: Icon,
    label,
    value,
    helper,
    tone,
    compact = false
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper: string;
    tone: 'sky' | 'emerald' | 'amber' | 'violet';
    compact?: boolean;
}) {
    const toneStyles = {
        sky: {
            panel: 'border-sky-300/20 bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(56,189,248,0.03))]',
            bar: 'from-sky-400 via-cyan-400 to-blue-500',
            icon: 'border-sky-300/25 bg-sky-500/12 text-sky-600',
            value: 'text-sky-700 dark:text-sky-300'
        },
        emerald: {
            panel: 'border-emerald-300/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(16,185,129,0.03))]',
            bar: 'from-emerald-400 via-green-400 to-teal-500',
            icon: 'border-emerald-300/25 bg-emerald-500/12 text-emerald-600',
            value: 'text-emerald-700 dark:text-emerald-300'
        },
        amber: {
            panel: 'border-amber-300/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.10),rgba(245,158,11,0.03))]',
            bar: 'from-amber-400 via-orange-400 to-yellow-500',
            icon: 'border-amber-300/25 bg-amber-500/12 text-amber-600',
            value: 'text-amber-700 dark:text-amber-300'
        },
        violet: {
            panel: 'border-violet-300/20 bg-[linear-gradient(180deg,rgba(139,92,246,0.10),rgba(139,92,246,0.03))]',
            bar: 'from-violet-400 via-fuchsia-400 to-indigo-500',
            icon: 'border-violet-300/25 bg-violet-500/12 text-violet-600',
            value: 'text-violet-700 dark:text-violet-300'
        }
    }[tone];

    if (compact) {
        return (
            <div className={cn('relative overflow-hidden rounded-[24px] border p-4', toneStyles.panel)}>
                <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', toneStyles.bar)} />
                <div className="flex items-center gap-3">
                    <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border', toneStyles.icon)}>
                        <Icon className="h-[17px] w-[17px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] leading-[1.45] text-[var(--foreground-muted)]">
                            {label}
                        </div>
                    </div>
                    <div className={cn('shrink-0 text-right text-lg font-display font-semibold leading-tight tracking-tight sm:text-[1.35rem]', toneStyles.value)}>
                        {value}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('relative overflow-hidden rounded-[26px] border p-4 lg:p-5', toneStyles.panel)}>
            <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', toneStyles.bar)} />
            <div className="flex items-start gap-4">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border', toneStyles.icon)}>
                    <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] leading-[1.45] text-[var(--foreground-muted)]">
                        {label}
                    </div>
                    <div className={cn('mt-2 text-[clamp(1.7rem,2.6vw,2.5rem)] font-display font-semibold leading-[0.96] tracking-tight sm:whitespace-nowrap', toneStyles.value)}>
                        {value}
                    </div>
                    <div className="mt-2 max-w-[24ch] text-sm leading-relaxed text-[var(--foreground-muted)]">
                        {helper}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PromptModal({
    value,
    messages,
    aiCorrectionInput,
    isGeneratingReply,
    onClose,
    onChange,
    onSave,
    onRegenerate,
    onCorrectionChange,
    onAskAi
}: {
    value: string;
    messages: ChatMessage[];
    aiCorrectionInput: string;
    isGeneratingReply: boolean;
    onClose: () => void;
    onChange: (value: string) => void;
    onSave: () => void;
    onRegenerate: () => void;
    onCorrectionChange: (value: string) => void;
    onAskAi: () => void;
}) {
    return (
        <div
            className="modal-backdrop-enter fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="modal-panel-enter surface-panel-strong relative z-10 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[34px] p-6 lg:p-8"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">AI handoff</div>
                        <h3 className="mt-2 text-2xl font-display font-semibold text-[var(--foreground)]">System prompt editor</h3>
                    </div>
                    <Button variant="secondary" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                    <div>
                        <textarea
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            className="h-[520px] w-full rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel)] px-5 py-4 font-mono text-sm leading-relaxed text-[var(--foreground)]"
                        />
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Button onClick={onSave}>
                                <PencilLine className="mr-2 h-4 w-4" />
                                Save prompt
                            </Button>
                            <Button variant="secondary" onClick={onRegenerate}>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Regenerate
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-[var(--panel-border)] bg-[var(--panel)] p-5">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                            <Bot className="h-4 w-4 text-sky-500" />
                            AI correction
                        </div>
                        <div className="mt-4 space-y-3">
                            <textarea
                                value={aiCorrectionInput}
                                onChange={(event) => onCorrectionChange(event.target.value)}
                                placeholder="Describe what the AI should correct, add, or de-emphasize."
                                className="h-32 w-full rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
                            />
                            <Button variant="secondary" onClick={onAskAi} disabled={!aiCorrectionInput.trim() || isGeneratingReply}>
                                <Send className="mr-2 h-4 w-4" />
                                {isGeneratingReply ? 'Thinking...' : 'Review with AI'}
                            </Button>
                        </div>

                        <div className="mt-5 space-y-3">
                            {messages.length === 0 && (
                                <div className="rounded-[22px] border border-dashed border-[var(--panel-border)] px-4 py-6 text-sm text-[var(--foreground-muted)]">
                                    Ask the AI to tighten the handoff and its revision notes will appear here.
                                </div>
                            )}
                            {messages.map((message, index) => (
                                <div
                                    key={`${message.role}-${index}`}
                                    className={message.role === 'assistant'
                                        ? 'rounded-[22px] border border-sky-300/20 bg-sky-500/10 px-4 py-4 text-sm leading-relaxed text-[var(--foreground-soft)]'
                                        : 'rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-4 text-sm leading-relaxed text-[var(--foreground)]'}
                                >
                                    {message.content}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

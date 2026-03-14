'use client';

import React, { useMemo, useState } from 'react';
import {
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    Flag,
    MessageSquare,
    Milestone,
    Plus,
    Radar,
    Users2
} from 'lucide-react';

import { BOARD_COLUMNS, PROJECT_HUB_TABS, formatPresenceLabel } from '@/lib/collaboration';
import { cn } from '@/lib/utils';
import { AvatarCluster } from '@/components/ui/AvatarCluster';
import { Button } from '@/components/ui/Button';
import {
    CollaborationCard,
    ProjectBrief,
    ProjectData,
    ProjectHubData,
    ProjectHubTab,
    StageId,
    UserProfileData,
    WorkspaceProject
} from '@/types';

type ProjectHubResource = 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'tasks';

interface ProjectHubProps {
    project: ProjectData;
    projectSummary: WorkspaceProject;
    profile: UserProfileData;
    hub: ProjectHubData;
    isLoading: boolean;
    error: string | null;
    onUpdateBrief: (updates: Partial<ProjectBrief>) => Promise<ProjectBrief>;
    onCreateRecord: <TResource extends ProjectHubResource>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateRecord: <TResource extends ProjectHubResource>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
    onDeleteRecord: (resource: 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'tasks', id: string) => Promise<void>;
    onOpenStage: (stage: StageId) => void;
    onSyncContext: (contextUpdates: Partial<ProjectData['context']>) => void;
}

export function ProjectHub({
    project,
    projectSummary,
    hub,
    isLoading,
    error,
    onUpdateBrief,
    onCreateRecord,
    onUpdateRecord,
    onDeleteRecord,
    onOpenStage,
    onSyncContext
}: ProjectHubProps) {
    const [activeTab, setActiveTab] = useState<ProjectHubTab>('brief');
    const [savingBrief, setSavingBrief] = useState(false);
    const [briefDraft, setBriefDraft] = useState<ProjectBrief>(hub.brief);
    const [boardDraft, setBoardDraft] = useState({ title: '', summary: '', type: 'idea', status: 'open-questions' });
    const [taskDraft, setTaskDraft] = useState({ title: '', details: '', status: 'open' });
    const [sessionDraft, setSessionDraft] = useState({ title: '', goal: '', agenda: '', participants: '', scheduledAt: '' });
    const [decisionDraft, setDecisionDraft] = useState({ title: '', background: '', options: '', decision: '', rationale: '' });
    const [artifactDraft, setArtifactDraft] = useState({ title: '', summary: '', type: 'concept', status: 'draft' });

    React.useEffect(() => {
        setBriefDraft(hub.brief);
    }, [hub.brief]);

    const unresolvedBriefThreads = hub.threads.filter((thread) => thread.entityType === 'brief' && thread.status === 'open').length;
    const nextSession = hub.sessions.find((session) => session.scheduledAt && session.status !== 'canceled');
    const openTasks = hub.tasks.filter((task) => task.status !== 'done');
    const reviewItems = hub.cards.filter((card) => card.status === 'ready-for-review').length
        + hub.artifacts.filter((artifact) => artifact.status === 'ready').length
        + hub.decisions.filter((decision) => decision.status === 'proposed').length;

    const cardsByColumn = useMemo(() => Object.fromEntries(
        BOARD_COLUMNS.map((column) => [column.id, hub.cards.filter((card) => card.status === column.id)])
    ) as Record<CollaborationCard['status'], CollaborationCard[]>, [hub.cards]);

    const handleBriefSave = async () => {
        setSavingBrief(true);
        try {
            await onUpdateBrief(briefDraft);
            onSyncContext({
                background: briefDraft.background,
                objectives: briefDraft.objectives,
                assumptions: briefDraft.assumptions
            });
        } finally {
            setSavingBrief(false);
        }
    };

    const threadCount = (entityType: string, entityId: string) => hub.threads.filter((thread) => thread.entityType === entityType && thread.entityId === entityId).length;

    if (isLoading) {
        return <div className="flex h-full items-center justify-center text-sm text-[var(--foreground-muted)]">Loading project hub...</div>;
    }

    return (
        <div className="scrollbar-none h-full overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="surface-panel-strong rounded-[32px] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Project Hub</div>
                            <h1 className="mt-3 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-4xl">{project.context.name}</h1>
                            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--foreground-soft)]">{projectSummary.summary}</p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <button onClick={() => onOpenStage('explore')} className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">Open Explore</button>
                                <button onClick={() => onOpenStage('implement')} className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">Open Implement</button>
                                <button onClick={() => onOpenStage('tell-story')} className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">Open Story</button>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <SummaryTile icon={Milestone} label="Next milestone" value={briefDraft.milestones || 'Set the next milestone'} />
                            <SummaryTile icon={CalendarClock} label="Next session" value={nextSession?.title || 'No session scheduled'} helper={nextSession?.scheduledAt || null} />
                            <SummaryTile icon={ClipboardList} label="Open tasks" value={`${openTasks.length}`} helper="tracked in board" />
                            <SummaryTile icon={CheckCircle2} label="Needs review" value={`${reviewItems}`} helper={`${unresolvedBriefThreads} unresolved brief threads`} />
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
                        <div className="flex items-center gap-3">
                            <AvatarCluster members={projectSummary.members} size="sm" />
                            <div>
                                <div className="text-sm font-semibold text-[var(--foreground)]">Team presence</div>
                                <div className="text-xs text-[var(--foreground-muted)]">{hub.presence.length ? formatPresenceLabel(hub.presence[0]) : 'Presence will appear when collaborators join.'}</div>
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

                {error && (
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
                )}

                {activeTab === 'brief' && (
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="surface-panel-strong rounded-[32px] p-6">
                            <SectionHeading icon={Radar} title="Shared brief" description="This is the common operating picture for every collaborator." />
                            <BriefField label="Challenge" value={briefDraft.background} onChange={(value) => setBriefDraft((current) => ({ ...current, background: value }))} rows={5} />
                            <BriefField label="Target audience" value={briefDraft.objectives} onChange={(value) => setBriefDraft((current) => ({ ...current, objectives: value }))} rows={4} />
                            <BriefField label="Unknowns and constraints" value={briefDraft.assumptions} onChange={(value) => setBriefDraft((current) => ({ ...current, assumptions: value }))} rows={4} />
                            <div className="grid gap-4 lg:grid-cols-2">
                                <BriefField label="Success metrics" value={briefDraft.successMetrics} onChange={(value) => setBriefDraft((current) => ({ ...current, successMetrics: value }))} rows={4} />
                                <BriefField label="Milestones" value={briefDraft.milestones} onChange={(value) => setBriefDraft((current) => ({ ...current, milestones: value }))} rows={4} />
                                <BriefField label="Team roles" value={briefDraft.teamRoles} onChange={(value) => setBriefDraft((current) => ({ ...current, teamRoles: value }))} rows={4} />
                                <BriefField label="Working norms and key links" value={`${briefDraft.workingNorms}\n${briefDraft.keyLinks}`.trim()} onChange={(value) => {
                                    const [workingNorms, ...rest] = value.split('\n');
                                    setBriefDraft((current) => ({
                                        ...current,
                                        workingNorms,
                                        keyLinks: rest.join('\n')
                                    }));
                                }} rows={4} />
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={() => void handleBriefSave()} disabled={savingBrief}>
                                    {savingBrief ? 'Saving...' : 'Save Brief'}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <MiniPanel icon={Users2} title="Roles" body={briefDraft.teamRoles || 'List the roles and responsibilities that matter in this sprint.'} />
                            <MiniPanel icon={Flag} title="Success criteria" body={briefDraft.successMetrics || 'Capture the evidence that will tell the team this work is moving.'} />
                            <MiniPanel icon={MessageSquare} title="Open discussions" body={`${unresolvedBriefThreads} unresolved thread${unresolvedBriefThreads === 1 ? '' : 's'} attached to the brief.`} />
                        </div>
                    </div>
                )}

                {activeTab === 'board' && (
                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="grid gap-4 xl:grid-cols-5">
                            {BOARD_COLUMNS.map((column) => (
                                <div key={column.id} className="surface-panel rounded-[28px] p-4">
                                    <div className="text-sm font-semibold text-[var(--foreground)]">{column.label}</div>
                                    <div className="mt-3 space-y-3">
                                        {cardsByColumn[column.id].map((card) => (
                                            <RecordCard
                                                key={card.id}
                                                title={card.title}
                                                body={card.summary}
                                                meta={`${card.type} • ${threadCount('card', card.id)} threads`}
                                                action={<select value={card.status} onChange={(event) => void onUpdateRecord('cards', card.id, { ...card, status: event.target.value, version: card.version })} className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs">
                                                    {BOARD_COLUMNS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                                                </select>}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <Composer title="Add board card" onSubmit={() => void onCreateRecord('cards', boardDraft).then(() => setBoardDraft({ title: '', summary: '', type: 'idea', status: 'open-questions' }))}>
                                <input value={boardDraft.title} onChange={(event) => setBoardDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Card title" className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                                <textarea value={boardDraft.summary} onChange={(event) => setBoardDraft((current) => ({ ...current, summary: event.target.value }))} placeholder="What needs to move?" className="h-28 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <select value={boardDraft.type} onChange={(event) => setBoardDraft((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm">
                                        <option value="idea">Idea</option>
                                        <option value="insight">Insight</option>
                                        <option value="experiment">Experiment</option>
                                        <option value="story">Story</option>
                                        <option value="risk">Risk</option>
                                        <option value="dependency">Dependency</option>
                                    </select>
                                    <select value={boardDraft.status} onChange={(event) => setBoardDraft((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm">
                                        {BOARD_COLUMNS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                                    </select>
                                </div>
                            </Composer>
                            <Composer title="Task queue" onSubmit={() => void onCreateRecord('tasks', taskDraft).then(() => setTaskDraft({ title: '', details: '', status: 'open' }))}>
                                <input value={taskDraft.title} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Task title" className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                                <textarea value={taskDraft.details} onChange={(event) => setTaskDraft((current) => ({ ...current, details: event.target.value }))} placeholder="Details and next step" className="h-24 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                                <div className="space-y-3">
                                    {hub.tasks.map((task) => (
                                        <RecordCard
                                            key={task.id}
                                            title={task.title}
                                            body={task.details}
                                            meta={task.status}
                                            action={<div className="flex gap-2">
                                                <select value={task.status} onChange={(event) => void onUpdateRecord('tasks', task.id, { ...task, status: event.target.value, version: task.version })} className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs">
                                                    <option value="open">Open</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="blocked">Blocked</option>
                                                    <option value="done">Done</option>
                                                </select>
                                                <Button size="sm" variant="ghost" onClick={() => void onDeleteRecord('tasks', task.id)}>Remove</Button>
                                            </div>}
                                        />
                                    ))}
                                </div>
                            </Composer>
                        </div>
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                        <Composer title="Schedule a session" onSubmit={() => void onCreateRecord('sessions', sessionDraft).then(() => setSessionDraft({ title: '', goal: '', agenda: '', participants: '', scheduledAt: '' }))}>
                            <input value={sessionDraft.title} onChange={(event) => setSessionDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Session title" className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <textarea value={sessionDraft.goal} onChange={(event) => setSessionDraft((current) => ({ ...current, goal: event.target.value }))} placeholder="What should this session accomplish?" className="h-24 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <textarea value={sessionDraft.agenda} onChange={(event) => setSessionDraft((current) => ({ ...current, agenda: event.target.value }))} placeholder="Agenda" className="h-24 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <input value={sessionDraft.participants} onChange={(event) => setSessionDraft((current) => ({ ...current, participants: event.target.value }))} placeholder="Participants" className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <input type="datetime-local" value={sessionDraft.scheduledAt} onChange={(event) => setSessionDraft((current) => ({ ...current, scheduledAt: event.target.value }))} className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                        </Composer>
                        <div className="space-y-4">
                            {hub.sessions.map((session) => (
                                <RecordCard
                                    key={session.id}
                                    title={session.title}
                                    body={session.goal || session.agenda}
                                    meta={session.scheduledAt || 'No time yet'}
                                    action={<div className="flex gap-2">
                                        <select value={session.status} onChange={(event) => void onUpdateRecord('sessions', session.id, { ...session, status: event.target.value, version: session.version })} className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs">
                                            <option value="planned">Planned</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="canceled">Canceled</option>
                                        </select>
                                        <Button size="sm" variant="ghost" onClick={() => void onDeleteRecord('sessions', session.id)}>Remove</Button>
                                    </div>}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'decisions' && (
                    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                        <Composer title="Log a decision" onSubmit={() => void onCreateRecord('decisions', decisionDraft).then(() => setDecisionDraft({ title: '', background: '', options: '', decision: '', rationale: '' }))}>
                            <input value={decisionDraft.title} onChange={(event) => setDecisionDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Decision title" className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <textarea value={decisionDraft.background} onChange={(event) => setDecisionDraft((current) => ({ ...current, background: event.target.value }))} placeholder="Background" className="h-24 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <textarea value={decisionDraft.options} onChange={(event) => setDecisionDraft((current) => ({ ...current, options: event.target.value }))} placeholder="Options" className="h-24 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <textarea value={decisionDraft.decision} onChange={(event) => setDecisionDraft((current) => ({ ...current, decision: event.target.value }))} placeholder="Current call" className="h-24 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <textarea value={decisionDraft.rationale} onChange={(event) => setDecisionDraft((current) => ({ ...current, rationale: event.target.value }))} placeholder="Why this is the right call" className="h-24 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                        </Composer>
                        <div className="space-y-4">
                            {hub.decisions.map((decision) => (
                                <RecordCard
                                    key={decision.id}
                                    title={decision.title}
                                    body={decision.decision || decision.background}
                                    meta={`${decision.status} • ${threadCount('decision', decision.id)} threads`}
                                    action={<div className="flex gap-2">
                                        <select value={decision.status} onChange={(event) => void onUpdateRecord('decisions', decision.id, { ...decision, status: event.target.value, version: decision.version })} className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs">
                                            <option value="proposed">Proposed</option>
                                            <option value="decided">Decided</option>
                                            <option value="revisit">Revisit</option>
                                        </select>
                                        <Button size="sm" variant="ghost" onClick={() => void onDeleteRecord('decisions', decision.id)}>Remove</Button>
                                    </div>}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'artifacts' && (
                    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                        <Composer title="Capture an artifact" onSubmit={() => void onCreateRecord('artifacts', artifactDraft).then(() => setArtifactDraft({ title: '', summary: '', type: 'concept', status: 'draft' }))}>
                            <input value={artifactDraft.title} onChange={(event) => setArtifactDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Artifact title" className="w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <textarea value={artifactDraft.summary} onChange={(event) => setArtifactDraft((current) => ({ ...current, summary: event.target.value }))} placeholder="What did the team produce?" className="h-28 w-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm" />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <select value={artifactDraft.type} onChange={(event) => setArtifactDraft((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm">
                                    <option value="concept">Concept</option>
                                    <option value="insight">Insight</option>
                                    <option value="experiment">Experiment</option>
                                    <option value="narrative">Narrative</option>
                                    <option value="attachment">Attachment</option>
                                </select>
                                <select value={artifactDraft.status} onChange={(event) => setArtifactDraft((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm">
                                    <option value="draft">Draft</option>
                                    <option value="ready">Ready for Review</option>
                                    <option value="approved">Approved</option>
                                </select>
                            </div>
                        </Composer>
                        <div className="space-y-4">
                            {hub.artifacts.map((artifact) => (
                                <RecordCard
                                    key={artifact.id}
                                    title={artifact.title}
                                    body={artifact.summary}
                                    meta={`${artifact.type} • ${artifact.status}`}
                                    action={<div className="flex gap-2">
                                        <select value={artifact.status} onChange={(event) => void onUpdateRecord('artifacts', artifact.id, { ...artifact, status: event.target.value, version: artifact.version })} className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-xs">
                                            <option value="draft">Draft</option>
                                            <option value="ready">Ready</option>
                                            <option value="approved">Approved</option>
                                        </select>
                                        <Button size="sm" variant="ghost" onClick={() => void onDeleteRecord('artifacts', artifact.id)}>Remove</Button>
                                    </div>}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryTile({ icon: Icon, label, value, helper }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; helper?: string | null }) {
    return <div className="rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4"><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]"><Icon className="h-4 w-4" />{label}</div><div className="mt-3 text-base font-semibold text-[var(--foreground)]">{value}</div>{helper && <div className="mt-1 text-xs text-[var(--foreground-muted)]">{helper}</div>}</div>;
}

function SectionHeading({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
    return <div className="mb-5"><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]"><Icon className="h-4 w-4" />Hub section</div><h2 className="mt-3 text-2xl font-display font-semibold text-[var(--foreground)]">{title}</h2><p className="mt-2 text-sm text-[var(--foreground-soft)]">{description}</p></div>;
}

function BriefField({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
    return <label className="mb-4 block"><div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">{label}</div><textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)]" /></label>;
}

function MiniPanel({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
    return <div className="surface-panel rounded-[28px] p-5"><Icon className="h-5 w-5 text-sky-500" /><div className="mt-4 text-lg font-display font-semibold text-[var(--foreground)]">{title}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground-soft)]">{body}</p></div>;
}

function Composer({ title, children, onSubmit }: { title: string; children: React.ReactNode; onSubmit: () => void }) {
    return <div className="surface-panel-strong rounded-[28px] p-5"><div className="flex items-center gap-2 text-lg font-display font-semibold text-[var(--foreground)]"><Plus className="h-5 w-5 text-sky-500" />{title}</div><div className="mt-4 space-y-3">{children}</div><div className="mt-4 flex justify-end"><Button onClick={onSubmit}>Create</Button></div></div>;
}

function RecordCard({ title, body, meta, action }: { title: string; body: string; meta: string; action: React.ReactNode }) {
    return <div className="rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold text-[var(--foreground)]">{title}</div><div className="mt-1 text-xs text-[var(--foreground-muted)]">{meta}</div></div>{action}</div><div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground-soft)]">{body || 'No details yet.'}</div></div>;
}

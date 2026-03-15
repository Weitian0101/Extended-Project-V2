'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    Activity,
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Download,
    Folder,
    Layers3,
    MessageSquareMore,
    MoreVertical,
    PencilLine,
    Plus,
    ShieldCheck,
    Trash2,
    Upload,
    UserCheck2,
    UserPlus
} from 'lucide-react';

import { ProjectSettingsDialog } from '@/components/dashboard/ProjectSettingsDialog';
import { SpotlightGuide } from '@/components/guide/SpotlightGuide';
import { AvatarCluster } from '@/components/ui/AvatarCluster';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserMenu } from '@/components/ui/UserMenu';
import { getGuideProgress, shouldShowCreateStep } from '@/data/onboarding';
import { getMembershipPlan } from '@/lib/membership';
import { cn } from '@/lib/utils';
import { GuideFlowVariant, OnboardingStepId, ProjectInvite, TeamMember, UserProfileData, WorkspaceCollaborationOverview, WorkspaceProject } from '@/types';

interface DashboardProps {
    runtimeMode?: 'local-mvp' | 'remote-supabase';
    projects: WorkspaceProject[];
    profile: UserProfileData;
    currentUserId?: string;
    onOpenProject: (projectId: string) => void;
    onCreateProject: () => Promise<WorkspaceProject | null> | WorkspaceProject | null;
    onUpdateProject: (projectId: string, updates: Partial<WorkspaceProject>) => Promise<void> | void;
    onDeleteProject: (projectId: string) => void;
    onOpenProfile: () => void;
    onOpenLearningCenter: () => void;
    onLogout: () => void;
    onExportWorkspace?: () => void;
    onImportWorkspace?: (file: File) => Promise<void>;
    onInviteMember?: (projectId: string, email: string, permission: TeamMember['permission']) => Promise<{
        delivery: 'invite-created';
        invite: ProjectInvite;
    }>;
    onSendInviteEmail?: (projectId: string, inviteId: string) => Promise<void>;
    onRevokeInvite?: (projectId: string, inviteId: string) => Promise<void>;
    onUpdateMemberPermission?: (projectId: string, memberId: string, permission: TeamMember['permission']) => Promise<void>;
    onRemoveMember?: (projectId: string, memberId: string) => Promise<void>;
    workspaceStatus?: string | null;
    workspaceError?: string | null;
    collaborationOverview?: WorkspaceCollaborationOverview;
    guideStep?: OnboardingStepId | null;
    guideVariant?: GuideFlowVariant | null;
    onGuideStepChange?: (step: OnboardingStepId | null) => void;
    onDismissGuide?: () => void;
}

interface OverviewCardItem {
    id: string;
    projectId: string;
    title: string;
    subtitle?: string;
    meta?: string;
    icon?: React.ComponentType<{ className?: string }>;
    accentText?: string;
}

function getOwner(project: WorkspaceProject): TeamMember | undefined {
    return project.members.find((member) => member.id === project.ownerId) || project.members[0];
}

function formatStageLabel(stage?: WorkspaceProject['currentStage']) {
    if (!stage) {
        return 'Overview';
    }

    return stage
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function formatDateTime(value?: string | null, fallback = 'Nothing scheduled') {
    if (!value) {
        return fallback;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    }).format(parsed);
}

function getLatestProject(projects: WorkspaceProject[]) {
    return projects[0];
}

export function Dashboard({
    projects,
    profile,
    currentUserId,
    onOpenProject,
    onCreateProject,
    onUpdateProject,
    onDeleteProject,
    onOpenProfile,
    onOpenLearningCenter,
    onLogout,
    runtimeMode = 'local-mvp',
    onExportWorkspace,
    onImportWorkspace,
    onInviteMember,
    onSendInviteEmail,
    onRevokeInvite,
    onUpdateMemberPermission,
    onRemoveMember,
    workspaceStatus,
    workspaceError,
    collaborationOverview,
    guideStep,
    guideVariant,
    onGuideStepChange,
    onDismissGuide
}: DashboardProps) {
    const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
    const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
    const [settingsProject, setSettingsProject] = useState<WorkspaceProject | null>(null);
    const [projectPendingDelete, setProjectPendingDelete] = useState<WorkspaceProject | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [pendingOpenProjectId, setPendingOpenProjectId] = useState<string | null>(null);
    const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
    const activeMenuRef = useRef<HTMLDivElement | null>(null);
    const importInputRef = useRef<HTMLInputElement | null>(null);
    const newProjectButtonRef = useRef<HTMLButtonElement | null>(null);
    const emptyStateCreateButtonRef = useRef<HTMLButtonElement | null>(null);
    const firstProjectCardRef = useRef<HTMLDivElement | null>(null);
    const activityTrackersRef = useRef<HTMLDivElement | null>(null);
    const collaboratorCount = new Set(projects.flatMap((project) => project.members.map((member) => member.id))).size;
    const currentPlan = getMembershipPlan(profile.subscriptionTier);
    const latestProject = getLatestProject(projects);
    const totalNeedsReview = projects.reduce((sum, project) => sum + (project.pendingReviewCount || 0), 0);
    const totalOpenTasks = projects.reduce((sum, project) => sum + (project.openTasksCount || 0), 0);
    const hasGuide = Boolean(guideStep && guideVariant);
    const showCreateStep = guideVariant ? shouldShowCreateStep(guideVariant) : false;
    const dashboardSummaryGuide = guideVariant && guideStep === 'dashboard-summary'
        ? getGuideProgress(guideVariant, 'dashboard-summary')
        : null;
    const dashboardCreateGuide = guideVariant && guideStep === 'dashboard-create'
        ? getGuideProgress(guideVariant, 'dashboard-create')
        : null;
    const dashboardOpenGuide = guideVariant && guideStep === 'dashboard-open'
        ? getGuideProgress(guideVariant, 'dashboard-open')
        : null;

    useEffect(() => {
        if (!menuProjectId && !workspaceMenuOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            const insideProjectMenu = activeMenuRef.current?.contains(target);
            const insideWorkspaceMenu = workspaceMenuRef.current?.contains(target);

            if (!insideProjectMenu && !insideWorkspaceMenu) {
                setMenuProjectId(null);
                setWorkspaceMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuProjectId(null);
                setWorkspaceMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [menuProjectId, workspaceMenuOpen]);

    const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !onImportWorkspace) return;

        try {
            setIsImporting(true);
            await onImportWorkspace(file);
        } finally {
            setIsImporting(false);
            event.target.value = '';
        }
    };

    const handleCreateProjectClick = async () => {
        try {
            setIsCreatingProject(true);
            const createdProject = await Promise.resolve(onCreateProject());

            if (createdProject) {
                if (guideStep === 'dashboard-create') {
                    onGuideStepChange?.('dashboard-open');
                    return;
                }

                setPendingOpenProjectId(createdProject.id);
                setSettingsProject(createdProject);
            }
        } catch {
            // Parent shell owns the error surface.
        } finally {
            setIsCreatingProject(false);
        }
    };

    const handleProjectOpen = (projectId: string) => {
        if (guideStep === 'dashboard-open' || (guideStep === 'dashboard-summary' && !showCreateStep)) {
            onGuideStepChange?.('hub');
        }

        onOpenProject(projectId);
    };

    const overviewCards = [
        {
            title: 'Needs Review',
            icon: CheckCircle2,
            accent: 'from-emerald-500/20 via-emerald-400/8 to-transparent',
            accentText: 'text-emerald-600',
            items: collaborationOverview?.needsReview.map((item) => ({
                id: item.id,
                projectId: item.projectId,
                title: item.title,
                subtitle: item.projectName,
                meta: item.type === 'decision' ? 'Decision' : item.type === 'artifact' ? 'Output' : 'Board card',
                icon: item.type === 'decision' ? ShieldCheck : item.type === 'artifact' ? Folder : CheckCircle2,
                accentText: item.type === 'decision' ? 'text-violet-600' : item.type === 'artifact' ? 'text-sky-600' : 'text-emerald-600'
            })) || [],
            emptyState: 'Nothing is waiting for review.'
        },
        {
            title: 'Upcoming Sessions',
            icon: Clock3,
            accent: 'from-sky-500/20 via-sky-400/8 to-transparent',
            accentText: 'text-sky-600',
            items: collaborationOverview?.upcomingSessions.map((item) => ({
                id: item.id,
                projectId: item.projectId,
                title: item.title,
                subtitle: item.projectName,
                meta: formatDateTime(item.scheduledAt, item.scheduledAt),
                icon: CalendarClock,
                accentText: 'text-sky-600'
            })) || [],
            emptyState: 'No sessions scheduled.'
        },
        {
            title: 'Assigned To Me',
            icon: UserCheck2,
            accent: 'from-amber-500/20 via-amber-400/8 to-transparent',
            accentText: 'text-amber-600',
            items: collaborationOverview?.assignedTasks.map((item) => ({
                id: item.id,
                projectId: item.projectId,
                title: item.title,
                subtitle: item.projectName,
                meta: item.dueDate ? `Due ${formatDateTime(item.dueDate, item.dueDate)}` : 'No due date',
                icon: ClipboardList,
                accentText: 'text-amber-600'
            })) || [],
            emptyState: 'No tasks assigned.'
        },
        {
            title: 'Recent Activity',
            icon: Activity,
            accent: 'from-violet-500/20 via-violet-400/8 to-transparent',
            accentText: 'text-violet-600',
            items: collaborationOverview?.recentActivity.map((item) => ({
                id: item.id,
                projectId: item.projectId,
                title: item.message,
                subtitle: item.actorName,
                meta: item.projectName,
                icon: item.entityType === 'task'
                    ? ClipboardList
                    : item.entityType === 'session'
                        ? CalendarClock
                        : item.entityType === 'artifact'
                            ? Folder
                            : item.entityType === 'decision'
                                ? ShieldCheck
                                : MessageSquareMore,
                accentText: item.entityType === 'task'
                    ? 'text-amber-600'
                    : item.entityType === 'session'
                        ? 'text-sky-600'
                        : item.entityType === 'artifact'
                            ? 'text-violet-600'
                            : item.entityType === 'decision'
                                ? 'text-emerald-600'
                                : 'text-rose-600'
            })) || [],
            emptyState: 'Activity will appear here.'
        }
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.07),transparent_28%),linear-gradient(180deg,var(--body-top),var(--body-bottom))]" />

            <header className="sticky top-0 z-30 border-b border-[var(--panel-border)] bg-[color:var(--panel-strong)]/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
                    <BrandLockup compact />
                    <div className="flex items-center gap-2 lg:gap-3">
                        <ThemeToggle compact />
                        <UserMenu
                            name={profile.name}
                            title={profile.accountRole || profile.title}
                            tier={profile.subscriptionTier}
                            onOpenProfile={onOpenProfile}
                            onOpenLearningCenter={onOpenLearningCenter}
                            onLogout={onLogout}
                        />
                    </div>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">
                <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-semibold text-[var(--foreground)]">Dashboard</h1>
                        <p className="mt-2 max-w-2xl text-base text-[var(--foreground-soft)]">
                            Pick a project, invite collaborators, or create a new sandbox project without leaving this page.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {onImportWorkspace && (
                            <input
                                ref={importInputRef}
                                type="file"
                                accept="application/json"
                                className="hidden"
                                onChange={handleImportFileChange}
                            />
                        )}
                        {(onExportWorkspace || onImportWorkspace) && (
                            <div ref={workspaceMenuRef} className="relative">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => setWorkspaceMenuOpen((current) => !current)}
                                >
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                                {workspaceMenuOpen && (
                                    <div className="absolute right-0 top-14 z-40 w-52 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel-strong)] p-2 shadow-[0_18px_40px_rgba(15,23,42,0.22)]">
                                        {onExportWorkspace && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onExportWorkspace();
                                                    setWorkspaceMenuOpen(false);
                                                }}
                                                className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                            >
                                                <Download className="h-4 w-4" />
                                                Export Workspace
                                            </button>
                                        )}
                                        {onImportWorkspace && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    importInputRef.current?.click();
                                                    setWorkspaceMenuOpen(false);
                                                }}
                                                disabled={isImporting}
                                                className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Upload className="h-4 w-4" />
                                                {isImporting ? 'Importing...' : 'Import Workspace'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <Button
                            ref={newProjectButtonRef}
                            size="lg"
                            onClick={() => void handleCreateProjectClick()}
                            disabled={isCreatingProject}
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            {isCreatingProject ? 'Creating...' : 'New Project'}
                        </Button>
                    </div>
                </div>

                <section className="relative z-20 mb-8 grid gap-4 xl:grid-cols-[1.16fr_0.84fr] xl:items-stretch">
                    <div className="surface-panel-strong relative overflow-hidden rounded-[34px] p-7 lg:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_70%)]" />
                        <div className="relative">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">Workspace</div>
                            <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-4xl">
                                Welcome back, {profile.name.split(' ')[0]}.
                            </h2>
                            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--foreground-soft)]">
                                Open a project, invite collaborators, and keep momentum across your workspace.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <ProjectChip label={`${projects.length} project${projects.length === 1 ? '' : 's'}`} />
                                <ProjectChip label={`${collaboratorCount} collaborator${collaboratorCount === 1 ? '' : 's'}`} />
                                <ProjectChip label={`${currentPlan.title} plan`} />
                                <ProjectChip label={`${currentPlan.includedSeats} seat${currentPlan.includedSeats === 1 ? '' : 's'} included`} />
                            </div>
                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <WorkspacePulseTile
                                    icon={Folder}
                                    label="Most Active"
                                    value={latestProject?.name || 'No projects yet'}
                                    helper={latestProject ? formatDateTime(latestProject.lastActivityAt, latestProject.updated) : 'Create a project to get started.'}
                                    accent="text-sky-600"
                                />
                                <WorkspacePulseTile
                                    icon={Activity}
                                    label="Workspace Pulse"
                                    value={`${collaborationOverview?.recentActivity.length || 0} recent events`}
                                    helper={`${totalNeedsReview} in review | ${totalOpenTasks} open tasks`}
                                    accent="text-violet-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div ref={activityTrackersRef} className="grid gap-4 sm:grid-cols-2">
                        {overviewCards.map((card) => (
                            <OverviewInsightCard
                                key={card.title}
                                title={card.title}
                                icon={card.icon}
                                count={card.items.length}
                                items={card.items}
                                emptyState={card.emptyState}
                                accent={card.accent}
                                accentText={card.accentText}
                                onOpenProject={onOpenProject}
                            />
                        ))}
                    </div>
                </section>

                {(workspaceStatus || workspaceError) && (
                    <div className="mb-8 grid gap-3 lg:grid-cols-2">
                        {workspaceStatus && (
                            <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                                {workspaceStatus}
                            </div>
                        )}
                        {workspaceError && (
                            <div className="rounded-[22px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                                {workspaceError}
                            </div>
                        )}
                    </div>
                )}

                {projects.length === 0 ? (
                    <div className="surface-panel relative z-0 rounded-[32px] border border-dashed border-[var(--panel-border)] p-8">
                        <div className="max-w-2xl">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">First project</div>
                            <h3 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)]">Start with one real workspace.</h3>
                            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)] lg:text-base">
                                Create a project to unlock Project Hub, stage methods, and the full onboarding flow.
                                If you prefer a quick refresher first, open Learning Center from the avatar menu.
                            </p>
                            <div className="mt-6">
                                <Button ref={emptyStateCreateButtonRef} size="lg" onClick={() => void handleCreateProjectClick()} disabled={isCreatingProject}>
                                    <Plus className="mr-2 h-5 w-5" />
                                    {isCreatingProject ? 'Creating...' : 'Create your first project'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-0 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {projects.map((project, index) => {
                            const owner = getOwner(project);

                            return (
                                <div
                                    key={project.id}
                                    ref={index === 0 ? firstProjectCardRef : null}
                                    onClick={() => handleProjectOpen(project.id)}
                                    className="surface-panel group relative cursor-pointer overflow-hidden rounded-[30px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,0.16)]"
                                >
                                    <div className={`absolute inset-x-0 top-0 h-1 rounded-t-[30px] bg-gradient-to-r ${project.accent}`} />

                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-muted)] transition-colors group-hover:text-sky-500">
                                            <Folder className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-base font-semibold text-[var(--foreground)]">{project.name}</div>
                                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{project.updated}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <AvatarCluster members={project.members.filter((member) => member.status === 'online')} size="sm" />
                                        <div
                                            ref={menuProjectId === project.id ? activeMenuRef : null}
                                            className={cn('relative', menuProjectId === project.id && 'z-40')}
                                        >
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setMenuProjectId((current) => current === project.id ? null : project.id);
                                                }}
                                                aria-label={`Open actions for ${project.name}`}
                                                className="rounded-full p-2 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>

                                            {menuProjectId === project.id && (
                                                <div
                                                    className="absolute right-0 top-10 z-50 w-48 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel-strong)] p-2 shadow-[0_18px_40px_rgba(15,23,42,0.24)]"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSettingsProject(project);
                                                            setMenuProjectId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                                    >
                                                        <PencilLine className="h-4 w-4" />
                                                        Rename Project
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSettingsProject(project);
                                                            setMenuProjectId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                        Invite Team Member
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSettingsProject(project);
                                                            setMenuProjectId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                                                    >
                                                        <ShieldCheck className="h-4 w-4" />
                                                        Manage Access
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setProjectPendingDelete(project);
                                                            setMenuProjectId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete Project
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-6 text-sm leading-relaxed text-[var(--foreground-soft)]">{project.summary}</p>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <ProjectMetaTile icon={Layers3} label="Stage" value={formatStageLabel(project.currentStage)} accent="text-sky-600" />
                                    <ProjectMetaTile icon={CheckCircle2} label="Review" value={`${project.pendingReviewCount || 0}`} accent="text-emerald-600" />
                                    <ProjectMetaTile icon={ClipboardList} label="Tasks" value={`${project.openTasksCount || 0}`} accent="text-amber-600" />
                                    <ProjectMetaTile icon={MessageSquareMore} label="Threads" value={`${project.unresolvedThreadsCount || 0}`} accent="text-violet-600" />
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <SignalTile icon={CalendarClock} label="Next session" value={formatDateTime(project.nextSessionAt)} accent="text-sky-600" />
                                    <SignalTile icon={Activity} label="Last activity" value={formatDateTime(project.lastActivityAt, project.updated)} accent="text-violet-600" />
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-[var(--panel-border)] pt-4">
                                    <div className="text-sm text-[var(--foreground-soft)]">
                                        Owner: <span className="font-medium text-[var(--foreground)]">{owner?.name || 'User'}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                        Open
                                        <ArrowUpRight className="h-4 w-4" />
                                    </div>
                                </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <ProjectSettingsDialog
                open={Boolean(settingsProject)}
                project={settingsProject ? (projects.find((project) => project.id === settingsProject.id) || settingsProject) : null}
                projectId={settingsProject?.id}
                currentUserId={currentUserId}
                remoteMode={runtimeMode === 'remote-supabase'}
                isNewProject={pendingOpenProjectId === settingsProject?.id}
                onInviteMember={onInviteMember}
                onSendInviteEmail={onSendInviteEmail}
                onRevokeInvite={onRevokeInvite}
                onUpdateMemberPermission={onUpdateMemberPermission}
                onRemoveMember={onRemoveMember}
                onClose={() => {
                    setSettingsProject(null);
                    setPendingOpenProjectId(null);
                }}
                onSave={(updatedProject) => {
                    void Promise.resolve(onUpdateProject(updatedProject.id, updatedProject)).then(() => {
                        setSettingsProject(null);
                        if (pendingOpenProjectId === updatedProject.id) {
                            setPendingOpenProjectId(null);
                            onOpenProject(updatedProject.id);
                        }
                    });
                }}
            />
            <ConfirmDialog
                open={Boolean(projectPendingDelete)}
                title="Delete project"
                description={projectPendingDelete
                    ? `Delete "${projectPendingDelete.name}" from the workspace? This removes the project from the dashboard.`
                    : ''}
                confirmLabel="Delete Project"
                tone="danger"
                onClose={() => setProjectPendingDelete(null)}
                onConfirm={() => {
                    if (!projectPendingDelete) {
                        return;
                    }
                    onDeleteProject(projectPendingDelete.id);
                    setProjectPendingDelete(null);
                }}
            />
            <SpotlightGuide
                open={hasGuide && guideStep === 'dashboard-summary'}
                targetRef={activityTrackersRef}
                currentStep={dashboardSummaryGuide?.currentStep || 1}
                totalSteps={dashboardSummaryGuide?.totalSteps || 9}
                placement="left"
                title="These four panels tell you where to jump in"
                description="They track what needs review, which sessions are coming up, what is assigned to you, and the latest activity across every project."
                purpose="Use them to spot blocked work quickly, reopen an active project, and see where the team needs your attention first."
                primaryAction={guideVariant ? {
                    label: showCreateStep ? 'Show project creation' : 'Show project entry',
                    onClick: () => onGuideStepChange?.(showCreateStep ? 'dashboard-create' : 'dashboard-open')
                } : undefined}
                onSkip={onDismissGuide}
            />
            <SpotlightGuide
                open={hasGuide && guideStep === 'dashboard-create'}
                targetRef={projects.length === 0 ? emptyStateCreateButtonRef : newProjectButtonRef}
                currentStep={dashboardCreateGuide?.currentStep || 2}
                totalSteps={dashboardCreateGuide?.totalSteps || 9}
                placement="top"
                title="Create the project that will hold the whole workflow"
                description="A project is where this challenge lives. It gives you one place for the hub, context, Beyond Post-its methods, captured outcomes, and AI support."
                purpose="Click here to create your first working space. Once it appears on the dashboard, you can open it and continue the guided flow."
                primaryAction={{
                    label: 'Create first project',
                    onClick: () => void handleCreateProjectClick()
                }}
                onBack={() => onGuideStepChange?.('dashboard-summary')}
                onSkip={onDismissGuide}
            />
            <SpotlightGuide
                open={hasGuide && guideStep === 'dashboard-open'}
                targetRef={firstProjectCardRef}
                currentStep={dashboardOpenGuide?.currentStep || 3}
                totalSteps={dashboardOpenGuide?.totalSteps || 9}
                placement="left"
                title="Open the project from its card"
                description="Each project card takes you into the working space for that challenge and keeps its latest stage, tasks, and activity visible from the dashboard."
                purpose="Click the card to move from workspace overview into the project itself. That is where the hub, context, methods, and AI tools live."
                primaryAction={latestProject ? {
                    label: 'Open this project',
                    onClick: () => handleProjectOpen(latestProject.id)
                } : undefined}
                onBack={() => onGuideStepChange?.(showCreateStep ? 'dashboard-create' : 'dashboard-summary')}
                onSkip={onDismissGuide}
            />
        </div>
    );
}

function OverviewInsightCard({
    title,
    icon: Icon,
    count,
    items,
    emptyState,
    accent,
    accentText,
    onOpenProject
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
    items: OverviewCardItem[];
    emptyState: string;
    accent: string;
    accentText: string;
    onOpenProject: (projectId: string) => void;
}) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const closeTimerRef = useRef<number | null>(null);
    const primaryProjectId = items[0]?.projectId;

    const openPreview = () => {
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setIsPreviewOpen(true);
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

    const handlePrimaryOpen = () => {
        if (primaryProjectId) {
            onOpenProject(primaryProjectId);
        }
    };

    return (
        <div
            className={cn(
                'relative isolate z-20 surface-panel-strong overflow-visible rounded-[28px] p-5 transition-[z-index] hover:z-30',
                primaryProjectId && 'cursor-pointer'
            )}
            onMouseEnter={openPreview}
            onMouseLeave={closePreview}
            onFocus={openPreview}
            onBlur={closePreview}
            onClick={handlePrimaryOpen}
            onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && primaryProjectId) {
                    event.preventDefault();
                    handlePrimaryOpen();
                }
            }}
            role={primaryProjectId ? 'button' : undefined}
            tabIndex={primaryProjectId ? 0 : -1}
        >
            <div className={cn('absolute inset-0 rounded-[28px] bg-gradient-to-br opacity-80', accent)} />
            <div className="relative">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">{title}</div>
                        <div className="mt-4 text-4xl font-display font-semibold text-[var(--foreground)]">{count}</div>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)]">
                        <Icon className={cn('h-5 w-5', accentText)} />
                    </div>
                </div>

                <div className="mt-4 text-sm text-[var(--foreground-soft)]">
                    {count > 0 ? 'Hover to preview details. Click to jump into the project.' : emptyState}
                </div>
            </div>

            {count > 0 && (
                <div
                    className={cn(
                        'absolute left-0 right-0 top-full z-40 mt-3 rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel-strong)] p-3 shadow-[0_24px_44px_rgba(15,23,42,0.26)] transition-all duration-200',
                        isPreviewOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
                    )}
                    onMouseEnter={openPreview}
                    onMouseLeave={closePreview}
                >
                    <div className="space-y-2">
                        {items.slice(0, 4).map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenProject(item.projectId);
                                }}
                                className="group/item relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-[16px] border border-transparent bg-[var(--panel)] px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--panel-border)] hover:bg-[var(--panel-strong)]"
                            >
                                <span className={cn('absolute inset-y-2 left-1.5 w-1 rounded-full bg-gradient-to-b opacity-0 transition-opacity group-hover/item:opacity-100', accent)} />
                                <div className="flex min-w-0 items-start gap-3">
                                    {item.icon && (
                                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-strong)] transition-transform duration-200 group-hover/item:scale-105">
                                            <item.icon className={cn('h-4 w-4', item.accentText || accentText)} />
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

function ProjectChip({ label }: { label: string }) {
    return (
        <div className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-soft)]">
            {label}
        </div>
    );
}

function WorkspacePulseTile({
    icon: Icon,
    label,
    value,
    helper,
    accent
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper: string;
    accent: string;
}) {
    return (
        <div className="rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                <Icon className={cn('h-4 w-4', accent)} />
                {label}
            </div>
            <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</div>
            <div className="mt-1 text-xs text-[var(--foreground-muted)]">{helper}</div>
        </div>
    );
}

function ProjectMetaTile({
    icon: Icon,
    label,
    value,
    accent
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    accent: string;
}) {
    return (
        <div className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                <Icon className={cn('h-4 w-4', accent)} />
                {label}
            </div>
            <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</div>
        </div>
    );
}

function SignalTile({
    icon: Icon,
    label,
    value,
    accent
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    accent: string;
}) {
    return (
        <div className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                <Icon className={cn('h-4 w-4', accent)} />
                {label}
            </div>
            <div className="mt-1 text-sm text-[var(--foreground-soft)]">{value}</div>
        </div>
    );
}

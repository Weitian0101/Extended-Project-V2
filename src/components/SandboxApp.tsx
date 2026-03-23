'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Menu, Settings2 } from 'lucide-react';

import { SpotlightGuide } from '@/components/guide/SpotlightGuide';
import { ProjectSettingsDialog } from '@/components/dashboard/ProjectSettingsDialog';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProjectFacilitatorDialog } from '@/components/project/ProjectFacilitatorDialog';
import { ProjectHub } from '@/components/project/ProjectHub';
import { ExploreView } from '@/components/stages/ExploreView';
import { ImagineView } from '@/components/stages/ImagineView';
import { ImplementView } from '@/components/stages/ImplementView';
import { ProjectOverview } from '@/components/stages/ProjectOverview';
import { TellStoryView } from '@/components/stages/TellStoryView';
import { AvatarCluster } from '@/components/ui/AvatarCluster';
import { Button } from '@/components/ui/Button';
import { BrandedLoadingScreen } from '@/components/ui/BrandedLoadingScreen';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserMenu } from '@/components/ui/UserMenu';
import { getGuideProgress } from '@/data/onboarding';
import { useProjectHubData } from '@/hooks/useProjectHubData';
import { useProjectData } from '@/hooks/useProjectData';
import { aiGateway } from '@/lib/services/aiGateway';
import { AiResponseEntry, GuideFlowVariant, OnboardingStepId, ProjectInvite, ProjectSurface, StageId, TeamMember, UserProfileData, WorkspaceProject } from '@/types';

function getStagePreferenceMode(metadata: Record<string, unknown>): 'auto' | 'manual' {
    return metadata.stageMode === 'manual' ? 'manual' : 'auto';
}

function getManualStagePreference(metadata: Record<string, unknown>): StageId | null {
    const value = metadata.manualStage;
    return value === 'overview'
        || value === 'explore'
        || value === 'imagine'
        || value === 'implement'
        || value === 'tell-story'
        ? value
        : null;
}

const SURFACE_LABELS: Record<ProjectSurface, string> = {
    hub: 'Project Hub',
    overview: 'Project Context',
    explore: 'Explore',
    imagine: 'Imagine',
    implement: 'Implement',
    'tell-story': 'Tell Story'
};

interface SandboxAppProps {
    project: WorkspaceProject;
    profile: UserProfileData;
    currentSurface: ProjectSurface;
    onSurfaceChange: (surface: ProjectSurface) => void;
    onExit: () => void;
    onLogout: () => void;
    onUpdateProject: (projectId: string, updates: Partial<WorkspaceProject>) => void;
    onSyncProjectSummaryStage?: (projectId: string, stage: StageId) => void;
    onOpenProfile: () => void;
    onOpenLearningCenter: () => void;
    runtimeMode?: 'local-mvp' | 'remote-supabase';
    onInviteMember?: (projectId: string, email: string, permission: TeamMember['permission']) => Promise<{
        delivery: 'invite-created';
        invite: ProjectInvite;
    }>;
    onSendInviteEmail?: (projectId: string, inviteId: string) => Promise<void>;
    onRevokeInvite?: (projectId: string, inviteId: string) => Promise<void>;
    onUpdateMemberPermission?: (projectId: string, memberId: string, permission: TeamMember['permission']) => Promise<void>;
    onRemoveMember?: (projectId: string, memberId: string) => Promise<void>;
    guideStep?: OnboardingStepId | null;
    guideVariant?: GuideFlowVariant | null;
    onGuideStepChange?: (step: OnboardingStepId | null) => void;
    onDismissGuide?: () => void;
}

export function SandboxApp({
    project: projectSummary,
    profile,
    currentSurface,
    onSurfaceChange,
    onExit,
    onLogout,
    onUpdateProject,
    onSyncProjectSummaryStage,
    onOpenProfile,
    onOpenLearningCenter,
    runtimeMode = 'local-mvp',
    onInviteMember,
    onUpdateMemberPermission,
    onSendInviteEmail,
    onRevokeInvite,
    onRemoveMember,
    guideStep,
    guideVariant,
    onGuideStepChange,
    onDismissGuide
}: SandboxAppProps) {
    const { project, updateProject, isLoaded, hasCachedProject } = useProjectData(projectSummary.id, projectSummary.name);
    const {
        hub,
        isLoading: isHubLoading,
        hasCachedHub,
        error: hubError,
        updateBrief,
        createRecord,
        updateRecord,
        deleteRecord
    } = useProjectHubData({
        projectId: projectSummary.id,
        projectName: projectSummary.name,
        profile,
        context: project.context
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isProjectFacilitatorOpen, setIsProjectFacilitatorOpen] = useState(false);
    const [projectFacilitatorInput, setProjectFacilitatorInput] = useState('');
    const [projectFacilitatorHistory, setProjectFacilitatorHistory] = useState<AiResponseEntry[]>([]);
    const [isProjectFacilitatorLoading, setIsProjectFacilitatorLoading] = useState(false);
    const hubNavRef = useRef<HTMLButtonElement | null>(null);
    const overviewNavRef = useRef<HTMLButtonElement | null>(null);
    const hubGuideProgress = guideVariant ? getGuideProgress(guideVariant, 'hub') : null;
    const overviewGuideProgress = guideVariant ? getGuideProgress(guideVariant, 'overview') : null;
    const stagePreferenceMode = getStagePreferenceMode(hub.brief.metadata);
    const manualStagePreference = getManualStagePreference(hub.brief.metadata);
    const handleCreateHubRecord = async <
        TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks'
    >(resource: TResource, payload: Record<string, unknown>) => createRecord(resource, payload as never);

    const handleUpdateHubRecord = async <
        TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks' | 'presence'
    >(resource: TResource, id: string, payload: Record<string, unknown>) => updateRecord(resource, id, payload as never);

    useEffect(() => {
        void createRecord('presence', {
            surface: currentSurface,
            objectType: currentSurface === 'hub' ? 'brief' : null,
            objectId: currentSurface === 'hub' ? projectSummary.id : null
        });
    }, [createRecord, currentSurface, projectSummary.id]);

    const syncProjectStageStatus = useCallback((stage: StageId) => {
        updateProject({ currentStage: stage });
        onSyncProjectSummaryStage?.(projectSummary.id, stage);
    }, [onSyncProjectSummaryStage, projectSummary.id, updateProject]);

    useEffect(() => {
        if (stagePreferenceMode === 'manual' && manualStagePreference && project.currentStage !== manualStagePreference) {
            syncProjectStageStatus(manualStagePreference);
        }
    }, [manualStagePreference, project.currentStage, stagePreferenceMode, syncProjectStageStatus]);

    useEffect(() => {
        setIsProjectFacilitatorOpen(false);
        setProjectFacilitatorInput('');
        setProjectFacilitatorHistory([]);
    }, [projectSummary.id]);

    if (!isLoaded && !hasCachedProject) {
        return (
            <BrandedLoadingScreen
                fullscreen
                label="Loading project"
                detail="Rebuilding the project shell, stage navigation, and collaboration memory."
            />
        );
    }

    const handleSetSurface = (surface: ProjectSurface) => {
        if (surface !== 'hub' && stagePreferenceMode === 'auto') {
            syncProjectStageStatus(surface as StageId);
        }

        if (guideStep === 'hub' && surface === 'overview') {
            onGuideStepChange?.('overview');
        }

        if (guideStep === 'overview' && surface === 'explore') {
            onGuideStepChange?.('explore-home');
        }

        onSurfaceChange(surface);
        setSidebarOpen(false);
    };

    const handleUpdateContext = (contextUpdates: Partial<typeof project.context>) => {
        updateProject({
            context: { ...project.context, ...contextUpdates }
        });
    };

    const handleSaveProjectSettings = (nextProject: WorkspaceProject) => {
        onUpdateProject(projectSummary.id, nextProject);
        updateProject({
            context: {
                ...project.context,
                name: nextProject.name
            }
        });
        setSettingsOpen(false);
    };

    const handleProjectFacilitatorSubmit = async (prefill?: string) => {
        const message = (prefill ?? projectFacilitatorInput).trim();
        if (!message || isProjectFacilitatorLoading) {
            return;
        }

        setProjectFacilitatorInput('');

        setIsProjectFacilitatorLoading(true);

        try {
            const response = await aiGateway.facilitatorChat({
                methodId: 'project-shell-facilitator',
                methodTitle: SURFACE_LABELS[currentSurface],
                stage: currentSurface === 'hub' ? project.currentStage : currentSurface,
                project: project.context,
                message,
                history: projectFacilitatorHistory
            });

            setProjectFacilitatorHistory((current) => [...current, {
                prompt: message,
                response: response.reply,
                timestamp: Date.now()
            }]);
        } catch (error) {
            setProjectFacilitatorHistory((current) => [...current, {
                prompt: message,
                response: error instanceof Error ? error.message : 'The project facilitator could not prepare a response right now.',
                timestamp: Date.now()
            }]);
        } finally {
            setIsProjectFacilitatorLoading(false);
            setIsProjectFacilitatorOpen(true);
        }
    };

    const facilitatorSuggestions = currentSurface === 'hub'
        ? [
            'What should the team focus on next in this project?',
            'Turn the current hub state into a 30-minute working agenda.',
            'What is missing from the project setup before the next session?'
        ]
        : [
            `What is the sharpest next move in ${SURFACE_LABELS[currentSurface]}?`,
            'Rewrite the next facilitator prompt so the team gets more specific.',
            'What blind spot should we challenge before moving on?'
        ];

    const renderStage = () => {
        switch (currentSurface) {
            case 'hub':
                return (
                    <ProjectHub
                        project={project}
                        projectSummary={projectSummary}
                        profile={profile}
                        hub={hub}
                        currentSurface={currentSurface}
                        isLoading={isHubLoading}
                        hasCachedData={hasCachedHub}
                        error={hubError}
                        onUpdateBrief={updateBrief}
                        onCreateRecord={handleCreateHubRecord}
                        onUpdateRecord={handleUpdateHubRecord}
                            onDeleteRecord={async (resource, id) => {
                            await deleteRecord(resource, id);
                        }}
                        onOpenStage={(stage) => handleSetSurface(stage)}
                        onSetProjectStage={syncProjectStageStatus}
                        onSyncContext={handleUpdateContext}
                    />
                );
            case 'overview':
                return <ProjectOverview project={project} onUpdateContext={handleUpdateContext} />;
            case 'explore':
                return (
                    <ExploreView
                        projectId={projectSummary.id}
                        projectName={project.context.name}
                        hub={hub}
                        isHubLoading={isHubLoading}
                        onCreateHubRecord={handleCreateHubRecord}
                        onUpdateHubRecord={handleUpdateHubRecord}
                        onDeleteHubRecord={deleteRecord}
                        methodCardLayout={profile.guidePreferences?.methodCardLayout ?? 'classic'}
                        guideStep={guideStep}
                        guideVariant={guideVariant}
                        onGuideStepChange={onGuideStepChange}
                        onDismissGuide={onDismissGuide}
                    />
                );
            case 'imagine':
                return (
                    <ImagineView
                        projectId={projectSummary.id}
                        projectName={project.context.name}
                        hub={hub}
                        isHubLoading={isHubLoading}
                        onCreateHubRecord={handleCreateHubRecord}
                        onUpdateHubRecord={handleUpdateHubRecord}
                        onDeleteHubRecord={deleteRecord}
                        methodCardLayout={profile.guidePreferences?.methodCardLayout ?? 'classic'}
                    />
                );
            case 'implement':
                return (
                    <ImplementView
                        projectId={projectSummary.id}
                        projectName={project.context.name}
                        hub={hub}
                        isHubLoading={isHubLoading}
                        onCreateHubRecord={handleCreateHubRecord}
                        onUpdateHubRecord={handleUpdateHubRecord}
                        onDeleteHubRecord={deleteRecord}
                        methodCardLayout={profile.guidePreferences?.methodCardLayout ?? 'classic'}
                    />
                );
            case 'tell-story':
                return (
                    <TellStoryView
                        projectId={projectSummary.id}
                        projectName={project.context.name}
                        hub={hub}
                        isHubLoading={isHubLoading}
                        onCreateHubRecord={handleCreateHubRecord}
                        onUpdateHubRecord={handleUpdateHubRecord}
                        onDeleteHubRecord={deleteRecord}
                        methodCardLayout={profile.guidePreferences?.methodCardLayout ?? 'classic'}
                    />
                );
            default:
                return <ProjectOverview project={project} onUpdateContext={handleUpdateContext} />;
        }
    };

    return (
        <div className="relative flex h-screen overflow-hidden bg-[var(--background)]">
            <Sidebar
                currentSurface={currentSurface}
                onSetSurface={handleSetSurface}
                onGoDashboard={onExit}
                onOpenFacilitator={() => setIsProjectFacilitatorOpen(true)}
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
                onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
                facilitatorHint={currentSurface === 'hub' ? 'Briefs, reviews, next actions' : `${SURFACE_LABELS[currentSurface]} support`}
                navButtonRefs={{
                    hub: hubNavRef,
                    overview: overviewNavRef
                }}
            />

            <div className="relative flex flex-1 min-w-0 flex-col overflow-visible">
                <header className="surface-panel-strong relative z-[90] overflow-visible border-b px-4 py-3 lg:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(true)} className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] p-2 text-[var(--foreground-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:text-[var(--foreground)] lg:hidden">
                                <Menu className="h-5 w-5" />
                            </button>
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Current Project</div>
                                <div className="text-lg font-display font-semibold text-[var(--foreground)]">{project.context.name}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-3">
                            <div className="hidden items-center gap-3 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 sm:flex">
                                <AvatarCluster members={projectSummary.members.filter((member) => member.status !== 'offline')} size="sm" />
                            </div>
                            <ThemeToggle compact />
                            <button
                                type="button"
                                onClick={() => setSettingsOpen(true)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:text-[var(--foreground)]"
                                title="Project settings"
                            >
                                <Settings2 className="h-4 w-4" />
                            </button>
                            <UserMenu
                                name={profile.name}
                                title={profile.accountRole || profile.title}
                                tier={profile.subscriptionTier}
                                onOpenProfile={onOpenProfile}
                                onOpenLearningCenter={onOpenLearningCenter}
                                onLogout={onLogout}
                            />
                            <Button variant="secondary" onClick={onExit} className="hidden lg:inline-flex">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="relative flex-1 overflow-hidden lg:p-3">
                    <main className="relative flex h-full flex-col overflow-hidden rounded-none bg-[var(--panel-strong)] lg:rounded-[30px] lg:border lg:border-[var(--panel-border)]">
                        <div key={`${projectSummary.id}-${currentSurface}`} className="project-surface-enter flex h-full min-h-0 flex-col">
                            {renderStage()}
                        </div>
                    </main>
                </div>
            </div>

            <ProjectSettingsDialog
                open={settingsOpen}
                project={projectSummary}
                projectId={projectSummary.id}
                currentUserId={profile.id}
                remoteMode={runtimeMode === 'remote-supabase'}
                onInviteMember={onInviteMember}
                onSendInviteEmail={onSendInviteEmail}
                onRevokeInvite={onRevokeInvite}
                onUpdateMemberPermission={onUpdateMemberPermission}
                onRemoveMember={onRemoveMember}
                onClose={() => setSettingsOpen(false)}
                onSave={handleSaveProjectSettings}
            />
            <SpotlightGuide
                open={guideStep === 'hub'}
                targetRef={hubNavRef}
                currentStep={hubGuideProgress?.currentStep || 3}
                totalSteps={hubGuideProgress?.totalSteps || 8}
                placement="right"
                title="Project Hub keeps the work coordinated"
                description="This is the operating layer for the project. It keeps shared tasks, decisions, sessions, roles, and outcomes visible before you go deeper into stage work."
                purpose="Use Hub to see the state of the project quickly, align the team, and keep key information from scattering across separate tools."
                primaryAction={onGuideStepChange ? {
                    label: 'Open Project Context',
                    onClick: () => {
                        handleSetSurface('overview');
                        onGuideStepChange('overview');
                    }
                } : undefined}
                onSkip={onDismissGuide}
            />
            <SpotlightGuide
                open={guideStep === 'overview'}
                targetRef={overviewNavRef}
                currentStep={overviewGuideProgress?.currentStep || 4}
                totalSteps={overviewGuideProgress?.totalSteps || 8}
                placement="right"
                title="Project Context captures the brief"
                description="This page records the challenge background, objectives, and assumptions. It gives both the team and the AI the shared context they need before running methods."
                purpose="Use Context to define what problem you are solving, what success looks like, and what constraints should stay visible during the work."
                primaryAction={onGuideStepChange ? {
                    label: 'Open Explore',
                    onClick: () => {
                        handleSetSurface('explore');
                        onGuideStepChange('explore-home');
                    }
                } : undefined}
                onBack={onGuideStepChange ? () => onGuideStepChange('hub') : undefined}
                onSkip={onDismissGuide}
            />
            <ProjectFacilitatorDialog
                open={isProjectFacilitatorOpen}
                projectName={project.context.name}
                surfaceLabel={SURFACE_LABELS[currentSurface]}
                suggestions={facilitatorSuggestions}
                history={projectFacilitatorHistory}
                input={projectFacilitatorInput}
                isLoading={isProjectFacilitatorLoading}
                onClose={() => setIsProjectFacilitatorOpen(false)}
                onInputChange={setProjectFacilitatorInput}
                onSubmit={() => void handleProjectFacilitatorSubmit()}
                onSelectSuggestion={(prompt) => void handleProjectFacilitatorSubmit(prompt)}
            />
        </div>
    );
}


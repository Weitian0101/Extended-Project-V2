'use client';

import React, { useState } from 'react';
import { ArrowLeft, Menu, Settings2 } from 'lucide-react';

import { ProjectSettingsDialog } from '@/components/dashboard/ProjectSettingsDialog';
import { Sidebar } from '@/components/layout/Sidebar';
import { ExploreView } from '@/components/stages/ExploreView';
import { ImagineView } from '@/components/stages/ImagineView';
import { ImplementView } from '@/components/stages/ImplementView';
import { ProjectOverview } from '@/components/stages/ProjectOverview';
import { TellStoryView } from '@/components/stages/TellStoryView';
import { AvatarCluster } from '@/components/ui/AvatarCluster';
import { Button } from '@/components/ui/Button';
import { ProfilePanel } from '@/components/ui/ProfilePanel';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useProjectData } from '@/hooks/useProjectData';
import { ProjectInvite, StageId, TeamMember, UserProfileData, WorkspaceProject } from '@/types';

interface SandboxAppProps {
    project: WorkspaceProject;
    profile: UserProfileData;
    onExit: () => void;
    onUpdateProject: (projectId: string, updates: Partial<WorkspaceProject>) => void;
    onOpenProfile: () => void;
    runtimeMode?: 'local-mvp' | 'remote-supabase';
    onInviteMember?: (projectId: string, email: string, permission: TeamMember['permission']) => Promise<{
        delivery: 'member-added' | 'invite-created';
        invite?: ProjectInvite;
    }>;
    onUpdateMemberPermission?: (projectId: string, memberId: string, permission: TeamMember['permission']) => Promise<void>;
}

export function SandboxApp({
    project: projectSummary,
    profile,
    onExit,
    onUpdateProject,
    onOpenProfile,
    runtimeMode = 'local-mvp',
    onInviteMember,
    onUpdateMemberPermission
}: SandboxAppProps) {
    const { project, updateProject, isLoaded } = useProjectData(projectSummary.id, projectSummary.name);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    if (!isLoaded) {
        return <div className="flex h-screen items-center justify-center bg-[var(--background)] font-display text-[var(--foreground-muted)]">Loading project...</div>;
    }

    const handleSetStage = (stage: StageId) => {
        updateProject({ currentStage: stage });
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

    const renderStage = () => {
        switch (project.currentStage) {
            case 'overview':
                return <ProjectOverview project={project} onUpdateContext={handleUpdateContext} />;
            case 'explore':
                return <ExploreView projectId={projectSummary.id} projectName={project.context.name} />;
            case 'imagine':
                return <ImagineView projectId={projectSummary.id} projectName={project.context.name} />;
            case 'implement':
                return <ImplementView projectId={projectSummary.id} projectName={project.context.name} />;
            case 'tell-story':
                return <TellStoryView projectId={projectSummary.id} projectName={project.context.name} />;
            default:
                return <ProjectOverview project={project} onUpdateContext={handleUpdateContext} />;
        }
    };

    return (
        <div className="relative flex h-screen overflow-hidden bg-[var(--background)]">
            <Sidebar
                currentStage={project.currentStage}
                onSetStage={handleSetStage}
                onGoDashboard={onExit}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="relative flex flex-1 flex-col overflow-hidden">
                <header className="surface-panel-strong relative z-20 border-b px-4 py-3 lg:px-6">
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
                            <ProfilePanel
                                compact
                                name={profile.name}
                                title={profile.accountRole || profile.title}
                                onClick={onOpenProfile}
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
                        {renderStage()}
                    </main>
                </div>
            </div>

            <ProjectSettingsDialog
                open={settingsOpen}
                project={projectSummary}
                projectId={projectSummary.id}
                remoteMode={runtimeMode === 'remote-supabase'}
                onInviteMember={onInviteMember}
                onUpdateMemberPermission={onUpdateMemberPermission}
                onClose={() => setSettingsOpen(false)}
                onSave={handleSaveProjectSettings}
            />
        </div>
    );
}

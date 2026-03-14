'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Folder, LogOut, MoreVertical, PencilLine, Plus, ShieldCheck, Trash2, UserPlus } from 'lucide-react';

import { BrandLockup } from '@/components/ui/BrandLockup';
import { Button } from '@/components/ui/Button';
import { ProfilePanel } from '@/components/ui/ProfilePanel';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AvatarCluster } from '@/components/ui/AvatarCluster';
import { ProjectSettingsDialog } from '@/components/dashboard/ProjectSettingsDialog';
import { TeamMember, UserProfileData, WorkspaceProject } from '@/types';
import { cn } from '@/lib/utils';

interface DashboardProps {
    projects: WorkspaceProject[];
    profile: UserProfileData;
    onOpenProject: (projectId: string) => void;
    onCreateProject: () => void;
    onUpdateProject: (projectId: string, updates: Partial<WorkspaceProject>) => void;
    onDeleteProject: (projectId: string) => void;
    onOpenProfile: () => void;
    onLogout: () => void;
}

function getOwner(project: WorkspaceProject): TeamMember | undefined {
    return project.members.find(member => member.id === project.ownerId) || project.members[0];
}

export function Dashboard({ projects, profile, onOpenProject, onCreateProject, onUpdateProject, onDeleteProject, onOpenProfile, onLogout }: DashboardProps) {
    const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
    const [settingsProject, setSettingsProject] = useState<WorkspaceProject | null>(null);
    const activeMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!menuProjectId) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (!activeMenuRef.current?.contains(event.target as Node)) {
                setMenuProjectId(null);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuProjectId(null);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [menuProjectId]);

    return (
        <div className="relative min-h-screen bg-white">
            <div className="pointer-events-none fixed inset-0 z-0 bg-white" />

            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
                    <BrandLockup compact />
                    <div className="flex items-center gap-2 lg:gap-3">
                        <ThemeToggle compact />
                        <ProfilePanel
                            compact
                            name={profile.name}
                            title={`${profile.membershipLabel} membership`}
                            onClick={onOpenProfile}
                        />
                        <button onClick={onLogout} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-red-600">
                            <LogOut className="h-4 w-4" />
                            <span className="hidden lg:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">
                <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-semibold text-slate-950">Dashboard</h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-500">
                            Pick a project, invite collaborators, or create a new sandbox project without leaving this page.
                        </p>
                    </div>
                    <Button size="lg" onClick={onCreateProject}>
                        <Plus className="mr-2 h-5 w-5" />
                        New Project
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map(project => {
                        const owner = getOwner(project);

                        return (
                            <div
                                key={project.id}
                                onClick={() => onOpenProject(project.id)}
                                className="group relative cursor-pointer rounded-[30px] border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_44px_rgba(15,23,42,0.08)]"
                            >
                                <div className={`absolute inset-x-0 top-0 h-1 rounded-t-[30px] bg-gradient-to-r ${project.accent}`} />

                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-slate-50 text-slate-500 transition-colors group-hover:text-sky-500">
                                            <Folder className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{project.name}</div>
                                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{project.updated}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <AvatarCluster members={project.members.filter(member => member.status === 'online')} size="sm" />
                                        <div
                                            ref={menuProjectId === project.id ? activeMenuRef : null}
                                            className={cn('relative', menuProjectId === project.id && 'z-40')}
                                        >
                                            <button
                                                type="button"
                                                onClick={event => {
                                                    event.stopPropagation();
                                                    setMenuProjectId(current => current === project.id ? null : project.id);
                                                }}
                                                aria-label={`Open actions for ${project.name}`}
                                                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>

                                            {menuProjectId === project.id && (
                                                <div
                                                    className="absolute right-0 top-10 z-50 w-48 rounded-[18px] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                                                    onClick={event => event.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSettingsProject(project);
                                                            setMenuProjectId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
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
                                                        className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
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
                                                        className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                                    >
                                                        <ShieldCheck className="h-4 w-4" />
                                                        Manage Access
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const confirmed = window.confirm(`Delete "${project.name}"? This removes the project from the dashboard.`);
                                                            if (confirmed) {
                                                                onDeleteProject(project.id);
                                                            }
                                                            setMenuProjectId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete Project
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-6 text-sm leading-relaxed text-slate-500">{project.summary}</p>

                                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div className="text-sm text-slate-500">
                                        Owner: <span className="font-medium text-slate-800">{owner?.name || 'User'}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-900">Open</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            <ProjectSettingsDialog
                open={Boolean(settingsProject)}
                project={settingsProject}
                onClose={() => {
                    setSettingsProject(null);
                    setMenuProjectId(null);
                }}
                onSave={(project) => {
                    onUpdateProject(project.id, project);
                    setSettingsProject(null);
                }}
            />
        </div>
    );
}

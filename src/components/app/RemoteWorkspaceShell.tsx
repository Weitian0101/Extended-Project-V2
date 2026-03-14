'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

import { AuthPage } from '@/components/auth/AuthPage';
import { LandingPage } from '@/components/auth/LandingPage';
import { SignOutPage } from '@/components/auth/SignOutPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { SandboxApp } from '@/components/SandboxApp';
import { DEFAULT_USER } from '@/data/workspaceSeed';
import { WorkspaceExportDto, WorkspaceShellDto } from '@/lib/contracts/api';
import { loadWorkspaceBrowserState, useWorkspaceBrowserHistory } from '@/hooks/useWorkspaceBrowserHistory';
import { clearWorkspaceSession, loadWorkspaceSession, saveWorkspaceSession } from '@/lib/services/mvpWorkspace';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppViewState, PermissionLevel, UserProfileData, WorkspaceProject } from '@/types';

type CredentialMode = 'signin' | 'register';
type AuthActionHint = 'resend-confirmation';

interface WorkspaceResponse {
    workspace: WorkspaceShellDto;
}

interface InviteMemberResponse {
    delivery: 'member-added' | 'invite-created';
    invite?: {
        id: string;
        email: string;
        permission: PermissionLevel;
        status: 'pending' | 'accepted' | 'revoked';
        createdAt: string;
        inviteUrl?: string;
    };
}

interface EmailRegistrationStatus {
    exists: boolean;
    confirmed: boolean;
}

function getAuthBaseUrl() {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

async function parseApiResponse<T>(response: Response): Promise<T> {
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(body.error || 'Request failed.');
    }

    return body as T;
}

function parseEmailRegistrationStatus(value: unknown): EmailRegistrationStatus {
    if (typeof value !== 'object' || value === null) {
        return {
            exists: false,
            confirmed: false
        };
    }

    const record = value as Record<string, unknown>;
    return {
        exists: record.exists === true,
        confirmed: record.confirmed === true
    };
}

export function RemoteWorkspaceShell() {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const [view, setView] = useState<AppViewState>('landing');
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [projects, setProjects] = useState<WorkspaceProject[]>([]);
    const [profile, setProfile] = useState<UserProfileData>(DEFAULT_USER);
    const [collaborationOverview, setCollaborationOverview] = useState<WorkspaceShellDto['collaborationOverview']>();
    const [profileReturnView, setProfileReturnView] = useState<'dashboard' | 'sandbox'>('dashboard');
    const [sessionUser, setSessionUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [workspaceLoading, setWorkspaceLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [workspaceStatus, setWorkspaceStatus] = useState<string | null>(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [isNavigationHydrated, setIsNavigationHydrated] = useState(false);

    useEffect(() => {
        const savedSession = loadWorkspaceSession();
        const restoredNavigationState = loadWorkspaceBrowserState({
            view: savedSession.view === 'logging_out' ? 'landing' : savedSession.view,
            activeProjectId: savedSession.activeProjectId
        });

        setView(restoredNavigationState.view);
        setActiveProjectId(restoredNavigationState.activeProjectId);
        setIsNavigationHydrated(true);
    }, []);

    useWorkspaceBrowserHistory({
        state: {
            view,
            activeProjectId
        },
        isReady: isNavigationHydrated && !authLoading,
        onNavigate: (nextState) => {
            if (!authLoading) {
                if (!sessionUser && nextState.view !== 'landing' && nextState.view !== 'auth') {
                    setView('landing');
                    setActiveProjectId(null);
                    return;
                }

                if (sessionUser && (nextState.view === 'landing' || nextState.view === 'auth')) {
                    setView('dashboard');
                    setActiveProjectId(null);
                    return;
                }
            }

            setView(nextState.view);
            setActiveProjectId(nextState.activeProjectId);
        }
    });

    useEffect(() => {
        const bootstrapAuth = async () => {
            const { data, error } = await supabase.auth.getUser();

            if (error && error.message !== 'Auth session missing!') {
                setAuthError(error.message);
                setSessionUser(null);
            } else {
                setSessionUser(data.user ?? null);
            }

            setAuthLoading(false);
        };

        void bootstrapAuth();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSessionUser(session?.user ?? null);
            setAuthLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    useEffect(() => {
        if (!authLoading) {
            saveWorkspaceSession({
                view,
                activeProjectId
            });
        }
    }, [activeProjectId, authLoading, view]);

    useEffect(() => {
        const syncWorkspace = async () => {
            if (!sessionUser) {
                clearWorkspaceSession();
                setProjects([]);
                setProfile(DEFAULT_USER);
                setCollaborationOverview(undefined);
                setActiveProjectId(null);
                setWorkspaceLoading(false);
                setView((currentView) => (
                    currentView === 'landing' || currentView === 'auth' ? currentView : 'landing'
                ));
                return;
            }

            setWorkspaceLoading(true);
            setAuthError(null);

            try {
                const response = await fetch('/api/auth/bootstrap', {
                    method: 'POST'
                });
                const data = await parseApiResponse<WorkspaceResponse>(response);

                setProjects(data.workspace.projects);
                setProfile(data.workspace.profile);
                setCollaborationOverview(data.workspace.collaborationOverview);
                setView((currentView) => (
                    currentView === 'landing' || currentView === 'auth' || currentView === 'logging_out'
                        ? 'dashboard'
                        : currentView
                ));
            } catch (error) {
                setAuthError(error instanceof Error ? error.message : 'Unable to load workspace.');
            } finally {
                setWorkspaceLoading(false);
            }
        };

        void syncWorkspace();
    }, [authLoading, sessionUser]);

    const refreshWorkspace = async () => {
        const response = await fetch('/api/workspace', {
            cache: 'no-store'
        });
        const data = await parseApiResponse<WorkspaceResponse>(response);
        setProjects(data.workspace.projects);
        setProfile(data.workspace.profile);
        setCollaborationOverview(data.workspace.collaborationOverview);
    };

    const getEmailRegistrationStatus = async (email: string) => {
        const { data, error } = await supabase.rpc('get_email_registration_status', {
            candidate_email: email.trim().toLowerCase()
        });

        if (error) {
            throw error;
        }

        return parseEmailRegistrationStatus(data);
    };

    const buildAuthResponse = (ok: boolean, message?: string, action?: AuthActionHint) => ({
        ok,
        message,
        action
    });

    const handleCredentialAuth = async (mode: CredentialMode, email: string, password: string) => {
        setAuthError(null);
        setWorkspaceStatus(null);
        const normalizedEmail = email.trim().toLowerCase();

        if (mode === 'register') {
            const registrationStatus = await getEmailRegistrationStatus(normalizedEmail);

            if (registrationStatus.exists) {
                return registrationStatus.confirmed
                    ? buildAuthResponse(false, 'An account with this email already exists. Sign in instead.')
                    : buildAuthResponse(false, 'This email is already registered. Confirm your email or request a new confirmation link.', 'resend-confirmation');
            }

            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                    emailRedirectTo: getAuthBaseUrl()
                }
            });

            if (error) {
                return buildAuthResponse(
                    false,
                    error.message.includes('rate limit')
                        ? 'Too many confirmation emails were requested recently. Wait a while, then try again.'
                        : error.message
                );
            }

            if (!data.session) {
                return buildAuthResponse(true, 'Account created. Check your inbox to confirm your email before signing in.', 'resend-confirmation');
            }

            return buildAuthResponse(true);
        }

        const registrationStatus = await getEmailRegistrationStatus(normalizedEmail);

        if (registrationStatus.exists && !registrationStatus.confirmed) {
            return buildAuthResponse(false, 'Confirm your email before signing in.', 'resend-confirmation');
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password
        });

        if (error) {
            return buildAuthResponse(
                false,
                error.message.toLowerCase().includes('email not confirmed')
                    ? 'Confirm your email before signing in.'
                    : error.message,
                error.message.toLowerCase().includes('email not confirmed') ? 'resend-confirmation' : undefined
            );
        }

        return buildAuthResponse(true);
    };

    const handlePasswordResetRequest = async (email: string) => {
        setAuthError(null);
        const normalizedEmail = email.trim().toLowerCase();
        const registrationStatus = await getEmailRegistrationStatus(normalizedEmail);

        if (registrationStatus.exists && !registrationStatus.confirmed) {
            return buildAuthResponse(
                false,
                'Confirm your email before resetting the password.',
                'resend-confirmation'
            );
        }

        if (!registrationStatus.exists) {
            return buildAuthResponse(
                true,
                'If an account exists for this email, a password reset link is on its way.'
            );
        }

        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: getAuthBaseUrl()
        });

        if (error) {
            return buildAuthResponse(
                false,
                error.message.includes('rate limit')
                    ? 'Too many reset emails were requested recently. Wait a while, then try again.'
                    : error.message
            );
        }

        return buildAuthResponse(
            true,
            'If an account exists for this email, a password reset link is on its way.'
        );
    };

    const handleResendConfirmationRequest = async (email: string) => {
        setAuthError(null);
        const normalizedEmail = email.trim().toLowerCase();
        const registrationStatus = await getEmailRegistrationStatus(normalizedEmail);

        if (!registrationStatus.exists) {
            return buildAuthResponse(false, 'No account was found for this email.');
        }

        if (registrationStatus.confirmed) {
            return buildAuthResponse(true, 'This email is already confirmed. Sign in to continue.');
        }

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: normalizedEmail,
            options: {
                emailRedirectTo: getAuthBaseUrl()
            }
        });

        if (error) {
            return buildAuthResponse(
                false,
                error.message.includes('rate limit')
                    ? 'Too many confirmation emails were requested recently. Wait a while, then try again.'
                    : error.message
            );
        }

        return buildAuthResponse(true, 'A new confirmation email is on its way.');
    };

    const handleAdminAccess = async () => {
        setAuthError(null);
        setWorkspaceStatus(null);

        const response = await fetch('/api/auth/demo-admin', {
            method: 'POST'
        });

        await parseApiResponse(response);
        window.location.assign('/');
    };

    const handleCreateProject = async () => {
        setWorkspaceStatus(null);
        setAuthError(null);

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            const data = await parseApiResponse<{ project: WorkspaceProject }>(response);
            setProjects((current) => [data.project, ...current]);
            setActiveProjectId(data.project.id);
            setView('sandbox');
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : 'Unable to create project.');
        }
    };

    const handleUpdateProject = async (projectId: string, updates: Partial<WorkspaceProject>) => {
        setWorkspaceStatus(null);
        await parseApiResponse(
            await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            })
        );
        await refreshWorkspace();
    };

    const handleDeleteProject = async (projectId: string) => {
        setWorkspaceStatus(null);
        await parseApiResponse(
            await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE'
            })
        );

        setProjects((current) => current.filter((project) => project.id !== projectId));
        if (activeProjectId === projectId) {
            setActiveProjectId(null);
            setView('dashboard');
        }
    };

    const handleInviteMember = async (projectId: string, email: string, permission: PermissionLevel) => {
        setWorkspaceStatus(null);
        const result = await parseApiResponse<InviteMemberResponse>(
            await fetch(`/api/projects/${projectId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    permission
                })
            })
        );

        await refreshWorkspace();
        return result;
    };

    const handleUpdateMemberPermission = async (projectId: string, memberId: string, permission: PermissionLevel) => {
        setWorkspaceStatus(null);
        await parseApiResponse(
            await fetch(`/api/projects/${projectId}/members/${memberId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    permission
                })
            })
        );

        await refreshWorkspace();
    };

    const handleUpdateProfile = async (updates: Partial<UserProfileData>) => {
        setProfileSaving(true);
        setAuthError(null);
        setWorkspaceStatus(null);

        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            const data = await parseApiResponse<{ profile: UserProfileData }>(response);
            setProfile(data.profile);
        } finally {
            setProfileSaving(false);
        }
    };

    const handleExportWorkspace = async () => {
        setAuthError(null);
        const response = await fetch('/api/workspace/export', {
            cache: 'no-store'
        });
        const data = await parseApiResponse<{ snapshot: WorkspaceExportDto }>(response);
        const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileStamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

        link.href = downloadUrl;
        link.download = `innovation-sandbox-remote-workspace-${fileStamp}.json`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
        setWorkspaceStatus('Remote workspace backup exported as JSON.');
    };

    const handleImportWorkspace = async (file: File) => {
        setAuthError(null);
        const raw = await file.text();
        const snapshot = JSON.parse(raw);
        const response = await fetch('/api/workspace/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                snapshot
            })
        });
        const data = await parseApiResponse<{
            result: {
                importedProjects: number;
                importedMembers: number;
                importedInvites: number;
            };
        }>(response);

        await refreshWorkspace();
        setWorkspaceStatus(
            `Imported ${data.result.importedProjects} project${data.result.importedProjects === 1 ? '' : 's'}, `
            + `${data.result.importedMembers} member${data.result.importedMembers === 1 ? '' : 's'}, `
            + `and ${data.result.importedInvites} invite${data.result.importedInvites === 1 ? '' : 's'}.`
        );
    };

    const handleLogout = async () => {
        setView('logging_out');
        await supabase.auth.signOut();
        clearWorkspaceSession();
        setView('landing');
    };

    const handleOpenProfile = (source: 'dashboard' | 'sandbox') => {
        setProfileReturnView(source);
        setView('profile');
    };

    if (authLoading || (workspaceLoading && sessionUser && projects.length === 0 && view !== 'profile')) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground-muted)]">
                Loading workspace...
            </div>
        );
    }

    const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;

    switch (view) {
        case 'landing':
            return (
                <LandingPage
                    onNavigate={(target) => setView(target === 'sandbox' && !sessionUser ? 'auth' : target)}
                />
            );

        case 'auth':
            return (
                <AuthPage
                    authMode="supabase"
                    errorMessage={authError === 'Unauthenticated' ? null : authError}
                    onBack={() => setView('landing')}
                    onCredentialsSubmit={handleCredentialAuth}
                    onPasswordResetRequest={handlePasswordResetRequest}
                    onResendConfirmationRequest={handleResendConfirmationRequest}
                    onAdminAccess={handleAdminAccess}
                />
            );

        case 'dashboard':
            return (
                <Dashboard
                    runtimeMode="remote-supabase"
                    projects={projects}
                    profile={profile}
                    onOpenProject={(projectId) => {
                        setActiveProjectId(projectId);
                        setView('sandbox');
                    }}
                    onCreateProject={handleCreateProject}
                    onUpdateProject={handleUpdateProject}
                    onDeleteProject={handleDeleteProject}
                    onOpenProfile={() => handleOpenProfile('dashboard')}
                    onLogout={handleLogout}
                    onExportWorkspace={handleExportWorkspace}
                    onImportWorkspace={handleImportWorkspace}
                    onInviteMember={handleInviteMember}
                    onUpdateMemberPermission={handleUpdateMemberPermission}
                    workspaceStatus={workspaceStatus}
                    workspaceError={authError}
                    collaborationOverview={collaborationOverview}
                />
            );

        case 'sandbox':
            return activeProject ? (
                <SandboxApp
                    project={activeProject}
                    profile={profile}
                    onExit={() => {
                        void refreshWorkspace();
                        setActiveProjectId(null);
                        setView('dashboard');
                    }}
                    onUpdateProject={handleUpdateProject}
                    onOpenProfile={() => handleOpenProfile('sandbox')}
                    runtimeMode="remote-supabase"
                    onInviteMember={handleInviteMember}
                    onUpdateMemberPermission={handleUpdateMemberPermission}
                />
            ) : (
                <Dashboard
                    runtimeMode="remote-supabase"
                    projects={projects}
                    profile={profile}
                    onOpenProject={(projectId) => {
                        setActiveProjectId(projectId);
                        setView('sandbox');
                    }}
                    onCreateProject={handleCreateProject}
                    onUpdateProject={handleUpdateProject}
                    onDeleteProject={handleDeleteProject}
                    onOpenProfile={() => handleOpenProfile('dashboard')}
                    onLogout={handleLogout}
                    onExportWorkspace={handleExportWorkspace}
                    onImportWorkspace={handleImportWorkspace}
                    onInviteMember={handleInviteMember}
                    onUpdateMemberPermission={handleUpdateMemberPermission}
                    workspaceStatus={workspaceStatus}
                    workspaceError={authError}
                    collaborationOverview={collaborationOverview}
                />
            );

        case 'profile':
            return (
                <ProfilePage
                    profile={profile}
                    isSaving={profileSaving}
                    onUpdateProfile={handleUpdateProfile}
                    onBack={() => setView(profileReturnView)}
                />
            );

        case 'logging_out':
            return <SignOutPage onComplete={() => setView('landing')} />;

        default:
            return <LandingPage onNavigate={() => setView(sessionUser ? 'dashboard' : 'auth')} />;
    }
}

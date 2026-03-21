'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

import { AuthPage } from '@/components/auth/AuthPage';
import { LandingPage } from '@/components/auth/LandingPage';
import { SignOutPage } from '@/components/auth/SignOutPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { LearningCenterPage } from '@/components/guide/LearningCenterPage';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { SandboxApp } from '@/components/SandboxApp';
import { GUIDE_VIEWPORT_MIN_WIDTH } from '@/data/onboarding';
import { BrandedLoadingScreen } from '@/components/ui/BrandedLoadingScreen';
import { DEFAULT_USER } from '@/data/workspaceSeed';
import { WorkspaceExportDto, WorkspaceShellDto } from '@/lib/contracts/api';
import { loadWorkspaceBrowserState, useWorkspaceBrowserHistory } from '@/hooks/useWorkspaceBrowserHistory';
import {
    clearOnboardingGuideSession,
    getGuideStepForView,
    loadOnboardingGuideSession,
    saveOnboardingGuideSession
} from '@/lib/services/onboardingGuide';
import { clearWorkspaceSession, loadWorkspaceSession, saveWorkspaceSession } from '@/lib/services/mvpWorkspace';
import { fetchApiJson } from '@/lib/services/remoteApi';
import { getWorkspaceDocumentTitle } from '@/lib/documentTitle';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppViewState, GuideFlowVariant, OnboardingStepId, PermissionLevel, ProjectSurface, UserProfileData, WorkspaceProject } from '@/types';

type CredentialMode = 'signin' | 'register';
type AuthActionHint = 'resend-confirmation';

interface WorkspaceResponse {
    workspace: WorkspaceShellDto;
}

interface InviteMemberResponse {
    delivery: 'invite-created';
    invite: {
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

function mergeProfileUpdate(
    currentProfile: UserProfileData,
    requestedUpdates: Partial<UserProfileData>,
    nextProfile?: Partial<UserProfileData>
): UserProfileData {
    return {
        ...currentProfile,
        ...requestedUpdates,
        ...nextProfile,
        guidePreferences: {
            ...currentProfile.guidePreferences,
            ...requestedUpdates.guidePreferences,
            ...nextProfile?.guidePreferences
        }
    };
}

function getAuthBaseUrl() {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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
    type WorkspaceReturnState = {
        view: 'dashboard' | 'sandbox';
        activeProjectId: string | null;
        activeSurface: ProjectSurface;
    };

    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const [view, setView] = useState<AppViewState>('landing');
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeSurface, setActiveSurface] = useState<ProjectSurface>('hub');
    const [projects, setProjects] = useState<WorkspaceProject[]>([]);
    const [profile, setProfile] = useState<UserProfileData>(DEFAULT_USER);
    const [collaborationOverview, setCollaborationOverview] = useState<WorkspaceShellDto['collaborationOverview']>();
    const [profileReturnState, setProfileReturnState] = useState<WorkspaceReturnState>({
        view: 'dashboard',
        activeProjectId: null,
        activeSurface: 'hub'
    });
    const [learningCenterReturnState, setLearningCenterReturnState] = useState<WorkspaceReturnState>({
        view: 'dashboard',
        activeProjectId: null,
        activeSurface: 'hub'
    });
    const [sessionUser, setSessionUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [workspaceLoading, setWorkspaceLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [workspaceStatus, setWorkspaceStatus] = useState<string | null>(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [isNavigationHydrated, setIsNavigationHydrated] = useState(false);
    const [guideStep, setGuideStep] = useState<OnboardingStepId | null>(null);
    const [guideVariant, setGuideVariant] = useState<GuideFlowVariant | null>(null);
    const [isGuideViewportEligible, setIsGuideViewportEligible] = useState(
        () => (typeof window === 'undefined' ? true : window.innerWidth >= GUIDE_VIEWPORT_MIN_WIDTH)
    );

    const startGuide = (variant: GuideFlowVariant, step: OnboardingStepId) => {
        setGuideVariant(variant);
        setGuideStep(step);
        saveOnboardingGuideSession({ variant, step });
    };

    const handleGuideStepChange = (step: OnboardingStepId | null) => {
        setGuideStep(step);

        if (step && guideVariant) {
            saveOnboardingGuideSession({
                variant: guideVariant,
                step
            });
        }
    };

    useEffect(() => {
        const savedSession = loadWorkspaceSession();
        const restoredNavigationState = loadWorkspaceBrowserState({
            view: savedSession.view === 'logging_out' ? 'landing' : savedSession.view,
            activeProjectId: savedSession.activeProjectId,
            activeSurface: savedSession.activeSurface
        });
        let hydrationFrameId: number | null = null;

        setView(restoredNavigationState.view);
        setActiveProjectId(restoredNavigationState.activeProjectId);
        setActiveSurface(restoredNavigationState.activeSurface || 'hub');

        // Let the restored route state paint before auth/workspace effects can
        // persist or reinterpret the default landing state.
        hydrationFrameId = window.requestAnimationFrame(() => {
            setIsNavigationHydrated(true);
        });

        return () => {
            if (hydrationFrameId) {
                window.cancelAnimationFrame(hydrationFrameId);
            }
        };
    }, []);

    useWorkspaceBrowserHistory({
        state: {
            view,
            activeProjectId,
            activeSurface
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
            setActiveSurface(nextState.activeSurface || 'hub');
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
        if (!authLoading && isNavigationHydrated) {
            saveWorkspaceSession({
                view,
                activeProjectId,
                activeSurface
            });
        }
    }, [activeProjectId, activeSurface, authLoading, isNavigationHydrated, view]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        document.title = getWorkspaceDocumentTitle(activeProjectId, projects);
    }, [activeProjectId, projects]);

    useEffect(() => {
        if (!isNavigationHydrated || authLoading) {
            return;
        }

        const syncWorkspace = async () => {
            if (!sessionUser) {
                clearWorkspaceSession();
                clearOnboardingGuideSession();
                setProjects([]);
                setProfile(DEFAULT_USER);
                setCollaborationOverview(undefined);
                setActiveProjectId(null);
                setActiveSurface('hub');
                setWorkspaceLoading(false);
                setView((currentView) => (
                    currentView === 'landing' || currentView === 'auth' ? currentView : 'landing'
                ));
                return;
            }

            setWorkspaceLoading(true);
            setAuthError(null);

            try {
                const data = await fetchApiJson<WorkspaceResponse>('/api/auth/bootstrap', {
                    method: 'POST'
                });

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
    }, [authLoading, isNavigationHydrated, sessionUser]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const updateGuideViewportEligibility = () => {
            const nextEligibility = window.innerWidth >= GUIDE_VIEWPORT_MIN_WIDTH;
            setIsGuideViewportEligible(nextEligibility);

            if (!nextEligibility) {
                setGuideStep(null);
                setGuideVariant(null);
            }
        };

        window.addEventListener('resize', updateGuideViewportEligibility);

        return () => window.removeEventListener('resize', updateGuideViewportEligibility);
    }, []);

    useEffect(() => {
        if (authLoading || workspaceLoading || guideStep || guideVariant) {
            return;
        }

        if (profile.guidePreferences?.onboardingSeenAt) {
            clearOnboardingGuideSession();
            return;
        }

        const persistedGuide = loadOnboardingGuideSession();
        if (!persistedGuide) {
            return;
        }

        const restoredStep = getGuideStepForView(persistedGuide.step, view);
        if (!restoredStep) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            setGuideVariant(persistedGuide.variant);
            setGuideStep(restoredStep);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [authLoading, guideStep, guideVariant, profile.guidePreferences?.onboardingSeenAt, view, workspaceLoading]);

    useEffect(() => {
        if (
            authLoading
            || workspaceLoading
            || !isGuideViewportEligible
            || guideStep
            || guideVariant
            || profile.guidePreferences?.onboardingSeenAt
            || projects.length > 0
        ) {
            return;
        }

        if (view === 'dashboard') {
            const frameId = window.requestAnimationFrame(() => {
                setGuideVariant('new-user');
                setGuideStep('dashboard-summary');
                saveOnboardingGuideSession({
                    variant: 'new-user',
                    step: 'dashboard-summary'
                });
            });

            return () => window.cancelAnimationFrame(frameId);
        }
    }, [authLoading, guideStep, guideVariant, isGuideViewportEligible, profile.guidePreferences?.onboardingSeenAt, projects.length, view, workspaceLoading]);

    const refreshWorkspace = async () => {
        const data = await fetchApiJson<WorkspaceResponse>('/api/workspace', {
            cache: 'no-store'
        });
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

        await fetchApiJson<Record<string, never>>('/api/auth/demo-admin', {
            method: 'POST'
        });
        window.location.assign('/');
    };

    const handleCreateProject = async () => {
        setWorkspaceStatus(null);
        setAuthError(null);

        try {
            const data = await fetchApiJson<{ project: WorkspaceProject }>('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            setProjects((current) => [data.project, ...current]);
            return data.project;
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : 'Unable to create project.');
            return null;
        }
    };

    const handleOpenProject = (projectId: string) => {
        if (guideStep === 'dashboard-open') {
            handleGuideStepChange('hub');
        }

        setActiveSurface('hub');
        setActiveProjectId(projectId);
        setView('sandbox');
    };

    const handleUpdateProject = async (projectId: string, updates: Partial<WorkspaceProject>) => {
        setWorkspaceStatus(null);
        await fetchApiJson<Record<string, never>>(`/api/projects/${projectId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        await refreshWorkspace();
    };

    const handleDeleteProject = async (projectId: string) => {
        setWorkspaceStatus(null);
        await fetchApiJson<Record<string, never>>(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });

        setProjects((current) => current.filter((project) => project.id !== projectId));
        if (activeProjectId === projectId) {
            setActiveProjectId(null);
            setView('dashboard');
        }
    };

    const handleInviteMember = async (projectId: string, email: string, permission: PermissionLevel) => {
        setWorkspaceStatus(null);
        const result = await fetchApiJson<InviteMemberResponse>(`/api/projects/${projectId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                permission
            })
        });

        await refreshWorkspace();
        return result;
    };

    const handleSendInviteEmail = async (projectId: string, inviteId: string) => {
        setWorkspaceStatus(null);
        await fetchApiJson<Record<string, never>>(`/api/projects/${projectId}/invites/${inviteId}/send`, {
            method: 'POST'
        });
    };

    const handleRevokeInvite = async (projectId: string, inviteId: string) => {
        setWorkspaceStatus(null);
        await fetchApiJson<Record<string, never>>(`/api/projects/${projectId}/invites/${inviteId}`, {
            method: 'DELETE'
        });
        await refreshWorkspace();
    };

    const handleUpdateMemberPermission = async (projectId: string, memberId: string, permission: PermissionLevel) => {
        setWorkspaceStatus(null);
        await fetchApiJson<Record<string, never>>(`/api/projects/${projectId}/members/${memberId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                permission
            })
        });

        await refreshWorkspace();
    };

    const handleRemoveMember = async (projectId: string, memberId: string) => {
        setWorkspaceStatus(null);
        await fetchApiJson<Record<string, never>>(`/api/projects/${projectId}/members/${memberId}`, {
            method: 'DELETE'
        });

        await refreshWorkspace();
    };

    const handleUpdateProfile = async (updates: Partial<UserProfileData>) => {
        setProfileSaving(true);
        setAuthError(null);
        setWorkspaceStatus(null);

        try {
            setProfile((currentProfile) => mergeProfileUpdate(currentProfile, updates));
            const data = await fetchApiJson<{ profile: UserProfileData }>('/api/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            setProfile((currentProfile) => mergeProfileUpdate(currentProfile, updates, data.profile));
        } finally {
            setProfileSaving(false);
        }
    };

    const handleDismissGuide = async () => {
        const onboardingSeenAt = profile.guidePreferences?.onboardingSeenAt || new Date().toISOString();
        clearOnboardingGuideSession();
        setProfile((currentProfile) => ({
            ...currentProfile,
            guidePreferences: {
                ...currentProfile.guidePreferences,
                onboardingSeenAt
            }
        }));
        setGuideStep(null);
        setGuideVariant(null);
        await handleUpdateProfile({
            guidePreferences: {
                ...profile.guidePreferences,
                onboardingSeenAt
            }
        });
    };

    const handleExportWorkspace = async () => {
        setAuthError(null);
        const data = await fetchApiJson<{ snapshot: WorkspaceExportDto }>('/api/workspace/export', {
            cache: 'no-store'
        });
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
        const data = await fetchApiJson<{
            result: {
                importedProjects: number;
                importedMembers: number;
                importedInvites: number;
            };
        }>('/api/workspace/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                snapshot
            })
        });

        await refreshWorkspace();
        setWorkspaceStatus(
            `Imported ${data.result.importedProjects} project${data.result.importedProjects === 1 ? '' : 's'}, `
            + `${data.result.importedMembers} member${data.result.importedMembers === 1 ? '' : 's'}, `
            + `and ${data.result.importedInvites} invite${data.result.importedInvites === 1 ? '' : 's'}.`
        );
    };

    const handleLogout = async () => {
        clearOnboardingGuideSession();
        setView('logging_out');
        await supabase.auth.signOut();
        clearWorkspaceSession();
        setView('landing');
    };

    const handleOpenProfile = (source: 'dashboard' | 'sandbox') => {
        setProfileReturnState({
            view: source,
            activeProjectId: source === 'sandbox' ? activeProjectId : null,
            activeSurface: source === 'sandbox' ? activeSurface : 'hub'
        });
        setView('profile');
    };

    const handleOpenLearningCenter = (source: 'dashboard' | 'sandbox') => {
        setLearningCenterReturnState({
            view: source,
            activeProjectId: source === 'sandbox' ? activeProjectId : null,
            activeSurface: source === 'sandbox' ? activeSurface : 'hub'
        });
        setView('learning-center');
    };

    const handleReplayOnboarding = () => {
        if (!isGuideViewportEligible) {
            return;
        }

        startGuide(projects.length === 0 ? 'new-user' : 'existing-user', 'dashboard-summary');
        setActiveProjectId(null);
        setActiveSurface('hub');
        setView('dashboard');
    };

    if (authLoading || (workspaceLoading && sessionUser && projects.length === 0 && view !== 'profile')) {
        return (
            <BrandedLoadingScreen
                fullscreen
                label="Loading workspace"
                detail="Connecting your account, projects, and guide preferences."
            />
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
                    currentUserId={profile.id}
                    onOpenProject={handleOpenProject}
                    onCreateProject={handleCreateProject}
                    onUpdateProject={handleUpdateProject}
                    onDeleteProject={handleDeleteProject}
                    onOpenProfile={() => handleOpenProfile('dashboard')}
                    onOpenLearningCenter={() => handleOpenLearningCenter('dashboard')}
                    onLogout={handleLogout}
                    onExportWorkspace={handleExportWorkspace}
                    onImportWorkspace={handleImportWorkspace}
                    onInviteMember={handleInviteMember}
                    onSendInviteEmail={handleSendInviteEmail}
                    onRevokeInvite={handleRevokeInvite}
                    onUpdateMemberPermission={handleUpdateMemberPermission}
                    onRemoveMember={handleRemoveMember}
                    workspaceStatus={workspaceStatus}
                    workspaceError={authError}
                    collaborationOverview={collaborationOverview}
                    guideStep={guideStep}
                    guideVariant={guideVariant}
                    onGuideStepChange={handleGuideStepChange}
                    onDismissGuide={() => void handleDismissGuide()}
                />
            );

        case 'sandbox':
            return activeProject ? (
                <SandboxApp
                    project={activeProject}
                    profile={profile}
                    currentSurface={activeSurface}
                    onSurfaceChange={setActiveSurface}
                    onExit={() => {
                        void refreshWorkspace();
                        setActiveProjectId(null);
                        setActiveSurface('hub');
                        setView('dashboard');
                    }}
                    onUpdateProject={handleUpdateProject}
                    onSyncProjectSummaryStage={(projectId, stage) => {
                        setProjects((current) => current.map((item) => (
                            item.id === projectId
                                ? { ...item, currentStage: stage }
                                : item
                        )));
                    }}
                    onOpenProfile={() => handleOpenProfile('sandbox')}
                    onOpenLearningCenter={() => handleOpenLearningCenter('sandbox')}
                    onLogout={handleLogout}
                    runtimeMode="remote-supabase"
                    onInviteMember={handleInviteMember}
                    onSendInviteEmail={handleSendInviteEmail}
                    onRevokeInvite={handleRevokeInvite}
                    onUpdateMemberPermission={handleUpdateMemberPermission}
                    onRemoveMember={handleRemoveMember}
                    guideStep={guideStep}
                    guideVariant={guideVariant}
                    onGuideStepChange={handleGuideStepChange}
                    onDismissGuide={() => void handleDismissGuide()}
                />
            ) : (
                <Dashboard
                    runtimeMode="remote-supabase"
                    projects={projects}
                    profile={profile}
                    currentUserId={profile.id}
                    onOpenProject={handleOpenProject}
                    onCreateProject={handleCreateProject}
                    onUpdateProject={handleUpdateProject}
                    onDeleteProject={handleDeleteProject}
                    onOpenProfile={() => handleOpenProfile('dashboard')}
                    onOpenLearningCenter={() => handleOpenLearningCenter('dashboard')}
                    onLogout={handleLogout}
                    onExportWorkspace={handleExportWorkspace}
                    onImportWorkspace={handleImportWorkspace}
                    onInviteMember={handleInviteMember}
                    onSendInviteEmail={handleSendInviteEmail}
                    onRevokeInvite={handleRevokeInvite}
                    onUpdateMemberPermission={handleUpdateMemberPermission}
                    onRemoveMember={handleRemoveMember}
                    workspaceStatus={workspaceStatus}
                    workspaceError={authError}
                    collaborationOverview={collaborationOverview}
                    guideStep={guideStep}
                    guideVariant={guideVariant}
                    onGuideStepChange={handleGuideStepChange}
                    onDismissGuide={() => void handleDismissGuide()}
                />
            );

        case 'profile':
            return (
                <ProfilePage
                    profile={profile}
                    isSaving={profileSaving}
                    onUpdateProfile={handleUpdateProfile}
                    onBack={() => {
                        setActiveProjectId(profileReturnState.activeProjectId);
                        setActiveSurface(profileReturnState.activeSurface);
                        setView(profileReturnState.view);
                    }}
                />
            );

        case 'learning-center':
            return (
                <LearningCenterPage
                    profile={profile}
                    onBack={() => {
                        setActiveProjectId(learningCenterReturnState.activeProjectId);
                        setActiveSurface(learningCenterReturnState.activeSurface);
                        setView(learningCenterReturnState.view);
                    }}
                    onReplayOnboarding={handleReplayOnboarding}
                />
            );

        case 'logging_out':
            return <SignOutPage onComplete={() => setView('landing')} />;

        default:
            return <LandingPage onNavigate={() => setView(sessionUser ? 'dashboard' : 'auth')} />;
    }
}

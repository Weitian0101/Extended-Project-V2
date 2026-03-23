'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { LandingPage } from '@/components/auth/LandingPage';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { LearningCenterPage } from '@/components/guide/LearningCenterPage';
import { SandboxApp } from '@/components/SandboxApp';
import { SignOutPage } from '@/components/auth/SignOutPage';
import { GUIDE_VIEWPORT_MIN_WIDTH } from '@/data/onboarding';
import { DEFAULT_PROJECTS, DEFAULT_TEAM } from '@/data/workspaceSeed';
import { AppViewState, GuideFlowVariant, OnboardingStepId, ProjectSurface, UserProfileData, WorkspaceProject } from '@/types';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { DEFAULT_USER } from '@/data/workspaceSeed';
import { RemoteWorkspaceShell } from '@/components/app/RemoteWorkspaceShell';
import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { loadWorkspaceBrowserState, useWorkspaceBrowserHistory } from '@/hooks/useWorkspaceBrowserHistory';
import { getWorkspaceDocumentTitle } from '@/lib/documentTitle';
import {
  clearOnboardingGuideSession,
  getGuideStepForView,
  loadOnboardingGuideSession,
  saveOnboardingGuideSession
} from '@/lib/services/onboardingGuide';
import {
  clearWorkspaceSession,
  exportWorkspaceSnapshot,
  importWorkspaceSnapshot,
  loadWorkspaceSession,
  loadWorkspaceShell,
  removeProjectDocument,
  saveWorkspaceSession,
  saveWorkspaceShell
} from '@/lib/services/mvpWorkspace';

export default function Home() {
  return isRemoteBackendEnabled() ? <RemoteWorkspaceShell /> : <HomeShell />;
}

function mergeProfileUpdate(
  currentProfile: UserProfileData,
  updates: Partial<UserProfileData>
): UserProfileData {
  return {
    ...currentProfile,
    ...updates,
    guidePreferences: {
      ...currentProfile.guidePreferences,
      ...updates.guidePreferences
    }
  };
}

function HomeShell() {
  type WorkspaceReturnState = {
    view: 'dashboard' | 'sandbox';
    activeProjectId: string | null;
    activeSurface: ProjectSurface;
  };

  const [view, setView] = useState<AppViewState>('landing');
  const [authViewMode, setAuthViewMode] = useState<'signin' | 'register'>('signin');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSurface, setActiveSurface] = useState<ProjectSurface>('hub');
  const [projects, setProjects] = useState<WorkspaceProject[]>(DEFAULT_PROJECTS);
  const [profile, setProfile] = useState<UserProfileData>(DEFAULT_USER);
  const [collaborationOverview, setCollaborationOverview] = useState(loadWorkspaceShell().collaborationOverview);
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
  const [workspaceStatus, setWorkspaceStatus] = useState<string | null>(null);
  const [isWorkspaceHydrated, setIsWorkspaceHydrated] = useState(false);
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
    document.body.setAttribute('data-app-view', view);

    return () => {
      document.body.removeAttribute('data-app-view');
    };
  }, [view]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.title = getWorkspaceDocumentTitle(activeProjectId, projects);
  }, [activeProjectId, projects]);

  // --- Persistence ---
  useEffect(() => {
    const savedSession = loadWorkspaceSession();
    const savedWorkspace = loadWorkspaceShell();
    const restoredNavigationState = loadWorkspaceBrowserState({
      view: savedSession.view === 'logging_out' ? 'landing' : savedSession.view,
      activeProjectId: savedSession.activeProjectId,
      activeSurface: savedSession.activeSurface
    });
    let hydrationFrameId: number | null = null;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(restoredNavigationState.view);
    setActiveProjectId(restoredNavigationState.activeProjectId);
    setActiveSurface(restoredNavigationState.activeSurface || 'hub');
    setProjects(savedWorkspace.projects);
    setProfile(savedWorkspace.profile);
    setCollaborationOverview(savedWorkspace.collaborationOverview);

    // Wait one paint so the restored navigation state is committed before
    // browser history sync starts mutating the URL.
    hydrationFrameId = window.requestAnimationFrame(() => {
      setIsWorkspaceHydrated(true);
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
    isReady: isWorkspaceHydrated,
    onNavigate: (nextState) => {
      setView(nextState.view);
      setActiveProjectId(nextState.activeProjectId);
      setActiveSurface(nextState.activeSurface || 'hub');
    }
  });

  useEffect(() => {
    if (!isWorkspaceHydrated) return;

    saveWorkspaceSession({
      view,
      activeProjectId,
      activeSurface
    });
  }, [activeProjectId, activeSurface, isWorkspaceHydrated, view]);

  useEffect(() => {
    if (!isWorkspaceHydrated) return;

    saveWorkspaceShell({
      projects,
      profile
    });
  }, [isWorkspaceHydrated, profile, projects]);

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
    if (!isWorkspaceHydrated || guideStep || guideVariant) {
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
  }, [guideStep, guideVariant, isWorkspaceHydrated, profile.guidePreferences?.onboardingSeenAt, view]);

  useEffect(() => {
    if (
      !isWorkspaceHydrated
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
  }, [guideStep, guideVariant, isGuideViewportEligible, isWorkspaceHydrated, profile.guidePreferences?.onboardingSeenAt, projects.length, view]);

  // --- Navigation Handlers ---

  const handleAuthComplete = () => {
    setView('dashboard');
  };

  const handleOpenProject = (projectId: string) => {
    if (guideStep === 'dashboard-open') {
      handleGuideStepChange('hub');
    }
    setActiveSurface('hub');
    setActiveProjectId(projectId);
    setView('sandbox');
  };

  const handleCreateProject = () => {
    const createdProject: WorkspaceProject = {
      id: uuidv4(),
      name: `New Project ${projects.length + 1}`,
      accent: 'from-violet-500 to-fuchsia-300',
      ownerId: 'user',
      updated: 'Just now',
      summary: 'A new sandbox project ready for team setup, context capture, and stage work.',
      members: DEFAULT_TEAM.slice(0, 1)
    };

    setProjects([createdProject, ...projects]);
    return createdProject;
  };

  const handleUpdateProject = (projectId: string, updates: Partial<WorkspaceProject>) => {
    setProjects(currentProjects =>
      currentProjects.map(project => project.id === projectId ? { ...project, ...updates } : project)
    );
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(currentProjects => currentProjects.filter(project => project.id !== projectId));
    removeProjectDocument(projectId);
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setView('dashboard');
    }
  };

  const handleUpdateProfile = (updates: Partial<UserProfileData>) => {
    setProfile(currentProfile => mergeProfileUpdate(currentProfile, updates));
  };

  const handleDismissGuide = () => {
    const onboardingSeenAt = profile.guidePreferences?.onboardingSeenAt || new Date().toISOString();
    clearOnboardingGuideSession();
    setProfile(currentProfile => ({
      ...currentProfile,
      guidePreferences: {
        ...currentProfile.guidePreferences,
        onboardingSeenAt
      }
    }));
    setGuideStep(null);
    setGuideVariant(null);
    handleUpdateProfile({
      guidePreferences: {
        ...profile.guidePreferences,
        onboardingSeenAt
      }
    });
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

  const handleExitSandbox = () => {
    const savedWorkspace = loadWorkspaceShell();
    setProjects(savedWorkspace.projects);
    setProfile(savedWorkspace.profile);
    setCollaborationOverview(savedWorkspace.collaborationOverview);
    setActiveProjectId(null);
    setActiveSurface('hub');
    setView('dashboard');
  };

  const handleLogout = () => {
    clearOnboardingGuideSession();
    clearWorkspaceSession();
    setView('logging_out');
  };

  const handleOpenProfile = (source: 'dashboard' | 'sandbox') => {
    setProfileReturnState({
      view: source,
      activeProjectId: source === 'sandbox' ? activeProjectId : null,
      activeSurface: source === 'sandbox' ? activeSurface : 'hub'
    });
    setView('profile');
  };

  const handleExportWorkspace = () => {
    const snapshot = exportWorkspaceSnapshot({ projects, profile });
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileStamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

    link.href = downloadUrl;
    link.download = `innovation-sandbox-workspace-${fileStamp}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
    setWorkspaceStatus('Workspace backup exported as JSON.');
  };

  const handleImportWorkspace = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const importedWorkspace = importWorkspaceSnapshot(parsed);

      setProjects(importedWorkspace.projects);
      setProfile(importedWorkspace.profile);
      setCollaborationOverview(importedWorkspace.collaborationOverview);
      setActiveProjectId(null);
      setView('dashboard');
      setWorkspaceStatus(`Imported ${importedWorkspace.projects.length} project${importedWorkspace.projects.length === 1 ? '' : 's'} from backup.`);
    } catch (error) {
      console.error('Failed to import workspace backup', error);
      setWorkspaceStatus(error instanceof Error ? error.message : 'Failed to import backup file.');
    }
  };

  // --- View Rendering ---
  const activeProject = projects.find(project => project.id === activeProjectId) ?? null;

  switch (view) {
    case 'landing':
      return (
        <LandingPage
          onNavigate={(target, options) => {
            if (target === 'auth') {
              setAuthViewMode(options?.authMode ?? 'signin');
            }
            setView(target);
          }}
        />
      );

    case 'auth':
      return <AuthPage initialMode={authViewMode} onBack={() => setView('landing')} onComplete={handleAuthComplete} />;

    case 'dashboard':
      return (
        <Dashboard
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
          workspaceStatus={workspaceStatus}
          collaborationOverview={collaborationOverview}
          guideStep={guideStep}
          guideVariant={guideVariant}
          onGuideStepChange={handleGuideStepChange}
          onDismissGuide={handleDismissGuide}
        />
      );

    case 'sandbox':
      return activeProject ? (
        <SandboxApp
          project={activeProject}
          profile={profile}
          currentSurface={activeSurface}
          onSurfaceChange={setActiveSurface}
          onExit={handleExitSandbox}
          onUpdateProject={handleUpdateProject}
          onSyncProjectSummaryStage={(projectId, stage) => handleUpdateProject(projectId, { currentStage: stage })}
          onOpenProfile={() => handleOpenProfile('sandbox')}
          onOpenLearningCenter={() => handleOpenLearningCenter('sandbox')}
          onLogout={handleLogout}
          runtimeMode="local-mvp"
          guideStep={guideStep}
          guideVariant={guideVariant}
          onGuideStepChange={handleGuideStepChange}
          onDismissGuide={handleDismissGuide}
        />
      ) : (
        <Dashboard
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
          workspaceStatus={workspaceStatus}
          collaborationOverview={collaborationOverview}
          guideStep={guideStep}
          guideVariant={guideVariant}
          onGuideStepChange={handleGuideStepChange}
          onDismissGuide={handleDismissGuide}
        />
      );

    case 'profile':
      return (
        <ProfilePage
          profile={profile}
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
          onUpdateProfile={handleUpdateProfile}
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
      return (
        <LandingPage
          onNavigate={(target, options) => {
            if (target === 'auth') {
              setAuthViewMode(options?.authMode ?? 'signin');
            }
            setView(target);
          }}
        />
      );
  }
}

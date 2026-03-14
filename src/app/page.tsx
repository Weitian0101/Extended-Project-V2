'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { LandingPage } from '@/components/auth/LandingPage';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { SandboxApp } from '@/components/SandboxApp';
import { SignOutPage } from '@/components/auth/SignOutPage';
import { AppThemeProvider } from '@/components/ui/AppThemeProvider';
import { DEFAULT_PROJECTS } from '@/data/workspaceSeed';
import { UserProfileData, WorkspaceProject } from '@/types';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { DEFAULT_USER } from '@/data/workspaceSeed';

type ViewState = 'landing' | 'auth' | 'dashboard' | 'sandbox' | 'profile' | 'logging_out';
const PROJECTS_STORAGE_KEY = 'app_projects';
const PROFILE_STORAGE_KEY = 'app_profile';

export default function Home() {
  return (
    <AppThemeProvider>
      <HomeShell />
    </AppThemeProvider>
  );
}

function HomeShell() {
  const [view, setView] = useState<ViewState>('landing');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<WorkspaceProject[]>(DEFAULT_PROJECTS);
  const [profile, setProfile] = useState<UserProfileData>(DEFAULT_USER);
  const [profileReturnView, setProfileReturnView] = useState<'dashboard' | 'sandbox'>('dashboard');

  useEffect(() => {
    document.body.setAttribute('data-app-view', view);

    return () => {
      document.body.removeAttribute('data-app-view');
    };
  }, [view]);

  // --- Persistence ---
  useEffect(() => {
    // Load state on mount
    const savedView = localStorage.getItem('app_view') as ViewState;
    const savedProject = localStorage.getItem('app_project_id');

    // If we were logging out, reset to landing
    if (savedView === 'logging_out') {
      setView('landing');
      return;
    }

    if (savedView) setView(savedView);
    if (savedProject) setActiveProjectId(savedProject);

    const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }

    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  useEffect(() => {
    // Save state on change
    if (view === 'logging_out') {
      localStorage.removeItem('app_view');
      localStorage.removeItem('app_project_id');
    } else {
      localStorage.setItem('app_view', view);
      if (activeProjectId) {
        localStorage.setItem('app_project_id', activeProjectId);
      } else {
        localStorage.removeItem('app_project_id');
      }
    }
  }, [view, activeProjectId]);

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // --- Navigation Handlers ---

  const handleAuthComplete = () => {
    setView('dashboard');
  };

  const handleOpenProject = (projectId: string) => {
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
      members: DEFAULT_PROJECTS[0].members
    };

    setProjects([createdProject, ...projects]);
  };

  const handleUpdateProject = (projectId: string, updates: Partial<WorkspaceProject>) => {
    setProjects(currentProjects =>
      currentProjects.map(project => project.id === projectId ? { ...project, ...updates } : project)
    );
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(currentProjects => currentProjects.filter(project => project.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setView('dashboard');
    }
  };

  const handleUpdateProfile = (updates: Partial<UserProfileData>) => {
    setProfile(currentProfile => ({ ...currentProfile, ...updates }));
  };

  const handleExitSandbox = () => {
    setActiveProjectId(null);
    setView('dashboard');
  };

  const handleLogout = () => {
    // Start logout sequence
    setView('logging_out');
    // Persistence useEffect will handle clearing storage
  };

  const handleOpenProfile = (source: 'dashboard' | 'sandbox') => {
    setProfileReturnView(source);
    setView('profile');
  };

  // --- View Rendering ---
  const activeProject = projects.find(project => project.id === activeProjectId) ?? null;

  switch (view) {
    case 'landing':
      return <LandingPage onNavigate={(target) => setView(target)} />;

    case 'auth':
      return <AuthPage onBack={() => setView('landing')} onComplete={handleAuthComplete} />;

    case 'dashboard':
      return (
        <Dashboard
          projects={projects}
          profile={profile}
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onOpenProfile={() => handleOpenProfile('dashboard')}
          onLogout={handleLogout}
        />
      );

    case 'sandbox':
      return activeProject ? (
        <SandboxApp
          project={activeProject}
          profile={profile}
          onExit={handleExitSandbox}
          onUpdateProject={handleUpdateProject}
          onOpenProfile={() => handleOpenProfile('sandbox')}
        />
      ) : (
        <Dashboard
          projects={projects}
          profile={profile}
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onOpenProfile={() => handleOpenProfile('dashboard')}
          onLogout={handleLogout}
        />
      );

    case 'profile':
      return (
        <ProfilePage
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBack={() => setView(profileReturnView)}
        />
      );

    case 'logging_out':
      return <SignOutPage onComplete={() => setView('landing')} />;

    default:
      return <LandingPage onNavigate={(target) => setView(target)} />;
  }
}

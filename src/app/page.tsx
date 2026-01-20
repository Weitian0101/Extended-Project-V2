'use client';

import React, { useState, useEffect } from 'react';
import { LandingPage } from '@/components/auth/LandingPage';
import { AuthPage } from '@/components/auth/AuthPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { SandboxApp } from '@/components/SandboxApp';
import { SignOutPage } from '@/components/auth/SignOutPage';

type ViewState = 'landing' | 'auth' | 'dashboard' | 'sandbox' | 'logging_out';

export default function Home() {
  const [view, setView] = useState<ViewState>('landing');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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

  // --- Navigation Handlers ---

  const handleAuthComplete = () => {
    setView('dashboard');
  };

  const handleOpenProject = (projectId: string) => {
    console.log(`Opening project: ${projectId}`);
    setActiveProjectId(projectId);
    setView('sandbox');
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

  // --- View Rendering ---

  switch (view) {
    case 'landing':
      return <LandingPage onNavigate={(target) => setView(target)} />;

    case 'auth':
      return <AuthPage onBack={() => setView('landing')} onComplete={handleAuthComplete} />;

    case 'dashboard':
      return <Dashboard onOpenProject={handleOpenProject} onLogout={handleLogout} />;

    case 'sandbox':
      return <SandboxApp projectId={activeProjectId || 'default'} onExit={handleExitSandbox} />;

    case 'logging_out':
      return <SignOutPage onComplete={() => setView('landing')} />;

    default:
      return <LandingPage onNavigate={(target) => setView(target)} />;
  }
}

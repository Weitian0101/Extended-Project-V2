'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProjectOverview } from '@/components/stages/ProjectOverview';
import { ExploreView } from '@/components/stages/ExploreView';
import { useProjectData } from '@/hooks/useProjectData';
import { StageId } from '@/types';
import { Menu, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface SandboxAppProps {
    projectId: string; // Future proofing for multi-project
    onExit: () => void;
}

export function SandboxApp({ projectId, onExit }: SandboxAppProps) {
    const { project, updateProject, isLoaded } = useProjectData();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!isLoaded) {
        return <div className="flex items-center justify-center h-screen">Loading Project...</div>;
    }

    const handleSetStage = (stage: StageId) => {
        updateProject({ currentStage: stage });
        setSidebarOpen(false); // Close on selection (mobile)
    };

    const handleUpdateContext = (contextUpdates: any) => {
        updateProject({
            context: { ...project.context, ...contextUpdates }
        });
    };

    const renderStage = () => {
        switch (project.currentStage) {
            case 'overview':
                return <ProjectOverview project={project} onUpdateContext={handleUpdateContext} />;
            case 'explore':
                return <ExploreView />;
            case 'imagine':
                return <div className="p-12 text-gray-400 italic">Imagine Stage - Coming Soon</div>;
            case 'implement':
                return <div className="p-12 text-gray-400 italic">Implement Stage - Coming Soon</div>;
            case 'tell-story':
                return <div className="p-12 text-gray-400 italic">Tell Story Stage - Coming Soon</div>;
            default:
                return <ProjectOverview project={project} onUpdateContext={handleUpdateContext} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 flex-col lg:flex-row">

            {/* Mobile Header */}
            <div className="lg:hidden h-16 bg-white border-b flex items-center justify-between px-4 shrink-0 z-30 relative">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="relative w-24 h-8">
                        <Image src="/images/logo.png" alt="Logo" fill style={{ objectFit: 'contain' }} />
                    </div>
                </div>
                <button onClick={onExit} className="text-xs font-semibold text-gray-500">Exit</button>
            </div>

            <Sidebar
                currentStage={project.currentStage}
                onSetStage={handleSetStage}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onBackToDashboard={onExit}
            />

            <main className="flex-1 overflow-hidden relative shadow-none lg:shadow-xl lg:rounded-l-3xl bg-white lg:my-2 lg:mr-2 border-t lg:border border-gray-100 flex flex-col">
                {renderStage()}
            </main>
        </div>
    );
}

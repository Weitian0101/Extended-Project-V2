import React, { useState } from 'react';
import { METHOD_LIBRARY } from '@/data/methodLibrary';
import { useProjectData } from '@/hooks/useProjectData';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { MethodSplitView } from '@/components/tools/MethodSplitView';
import { MethodCard, ToolRun } from '@/types';
import { ArrowRight, BookOpen, X, Play } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function ExploreView() {
    const { project, updateProject } = useProjectData();
    const [viewState, setViewState] = useState<'entry' | 'tools' | 'workspace'>('entry');
    const [showGuide, setShowGuide] = useState(false);
    const [activeMethod, setActiveMethod] = useState<MethodCard | null>(null);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);

    // Filter tools (Only Break the Ice exists now)
    const methods = METHOD_LIBRARY.filter(m => m.stage === 'explore');

    const handleStartTool = (method: MethodCard) => {
        const newRun: ToolRun = {
            id: uuidv4(),
            methodCardId: method.id,
            methodCardTitle: method.title,
            stage: 'explore',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            aiResponses: []
        };
        const updatedRuns = [...project.toolRuns, newRun];
        updateProject({ toolRuns: updatedRuns });

        setActiveMethod(method);
        setActiveRunId(newRun.id);
        setViewState('workspace');
    };

    const handleSaveRun = (updates: Partial<ToolRun>) => {
        if (!activeRunId) return;
        const updatedRuns = project.toolRuns.map(r =>
            r.id === activeRunId ? { ...r, ...updates, updatedAt: Date.now() } : r
        );
        updateProject({ toolRuns: updatedRuns });
    };

    // --- Sub-Components ---

    if (viewState === 'workspace' && activeMethod && activeRunId) {
        const run = project.toolRuns.find(r => r.id === activeRunId);
        return (
            <MethodSplitView
                card={activeMethod}
                context={project.context}
                existingRun={run}
                onSave={handleSaveRun}
                onBack={() => setViewState('tools')}
            />
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden relative">

            {/* Context Header */}
            <div className="h-16 bg-white border-b flex items-center px-4 lg:px-8 justify-between shrink-0">
                <h2 className="text-lg lg:text-xl font-bold text-green-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Explore Stage
                </h2>
                {viewState === 'entry' && (
                    <Button size="sm" onClick={() => setViewState('tools')}>
                        Skip to Tools <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">

                {/* STATE 1: ENTRY (Book View) */}
                {viewState === 'entry' && (
                    <div className="max-w-6xl mx-auto flex flex-col items-center">
                        <div
                            className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-8 items-center cursor-pointer group"
                            onClick={() => setViewState('tools')}
                        >
                            {/* Force specific dimensions and standard img tag as fallback/test if Next Image behaves oddly */}
                            <div className="relative w-full max-w-[300px] lg:max-w-none lg:w-auto lg:h-[70vh] aspect-[2/3] shadow-2xl rounded-lg overflow-hidden border border-gray-200 transform group-hover:-rotate-3 transition-transform duration-500 bg-white">
                                <Image
                                    src="/images/explore/fengmian1.png"
                                    alt="Cover 1"
                                    fill
                                    className="object-cover"
                                    unoptimized // Try unoptimized to bypass Next.js processing issues
                                />
                            </div>
                            <div className="relative w-full max-w-[300px] lg:max-w-none lg:w-auto lg:h-[70vh] aspect-[2/3] shadow-2xl rounded-lg overflow-hidden border border-gray-200 transform group-hover:rotate-3 transition-transform duration-500 bg-white">
                                <Image
                                    src="/images/explore/fengmian2.png"
                                    alt="Cover 2"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        </div>
                        <p className="text-gray-500 italic mb-8 animate-pulse text-center">Click the books to open tools...</p>
                    </div>
                )}

                {/* STATE 2: TOOLS LIST */}
                {viewState === 'tools' && (
                    <div className="max-w-5xl mx-auto">

                        {/* Prominent Guide Banner */}
                        <div
                            onClick={() => setShowGuide(true)}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-6 mb-8 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex flex-col lg:flex-row items-center justify-between group gap-4 text-center lg:text-left"
                        >
                            <div className="flex flex-col lg:flex-row items-center gap-4 text-white">
                                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                                    <BookOpen className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Open Facilitator Guide</h3>
                                    <p className="text-green-100 font-medium">Read the methodology before starting.</p>
                                </div>
                            </div>
                            <div className="bg-white text-green-700 px-6 py-2 rounded-full font-bold shadow-sm group-hover:scale-105 transition-transform w-full lg:w-auto text-center">
                                View Guide
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                            {methods.map(method => (
                                <div
                                    key={method.id}
                                    onClick={() => handleStartTool(method)}
                                    className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:border-green-400 transition-all duration-300"
                                >
                                    <div className="h-48 relative bg-gray-100">
                                        <Image src={method.image} alt={method.title} fill style={{ objectFit: 'contain' }} className="p-4 group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{method.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">{method.purpose}</p>
                                        <div className="mt-4 flex items-center text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play className="w-4 h-4 mr-2" /> Start Method
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* GUIDE OVERLAY */}
            {showGuide && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8" onClick={() => setShowGuide(false)}>
                    <div className="relative max-w-7xl w-full h-full flex flex-col lg:flex-row gap-4 items-center justify-center" onClick={e => e.stopPropagation()}>
                        <Button
                            variant="secondary"
                            className="absolute top-0 right-0 lg:top-4 lg:right-4 z-50"
                            onClick={() => setShowGuide(false)}
                        >
                            <X className="w-6 h-6" />
                        </Button>
                        <div className="relative w-full lg:w-[45%] h-[40%] lg:h-[90%] bg-white rounded shadow-2xl overflow-hidden">
                            <Image src="/images/explore/Guide1.png" alt="Guide 1" fill style={{ objectFit: 'contain' }} />
                        </div>
                        <div className="relative w-full lg:w-[45%] h-[40%] lg:h-[90%] bg-white rounded shadow-2xl overflow-hidden">
                            <Image src="/images/explore/Guide2.png" alt="Guide 2" fill style={{ objectFit: 'contain' }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState } from 'react';
import { METHOD_LIBRARY } from '@/data/methodLibrary';
import { useProjectData } from '@/hooks/useProjectData';
import { ToolCard } from '@/components/tools/ToolCard';
import { SessionWorkspace } from '@/components/tools/SessionWorkspace';
import { StageId, MethodCard, ToolRun } from '@/types';
import { Button } from '@/components/ui/Button';
import { Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface StageToolBoardProps {
    stage: StageId;
    colorTheme: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
    headerTitle: string;
    headerDescription: string;
}

export function StageToolBoard({ stage, colorTheme, headerTitle, headerDescription }: StageToolBoardProps) {
    const { project, updateProject } = useProjectData();
    const [activeCard, setActiveCard] = useState<MethodCard | null>(null);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);

    const methods = METHOD_LIBRARY.filter(m => m.stage === stage);
    const runs = project.toolRuns
        .filter(r => r.stage === stage)
        .sort((a, b) => b.updatedAt - a.updatedAt);

    const handleStartTool = (card: MethodCard) => {
        setActiveCard(card);
        setActiveRunId(null);
    };

    const handleOpenRun = (run: ToolRun) => {
        const card = METHOD_LIBRARY.find(m => m.id === run.methodCardId);
        if (card) {
            setActiveCard(card);
            setActiveRunId(run.id);
        }
    };

    const handleSaveRun = (updates: Partial<ToolRun>) => {
        const now = Date.now();
        let updatedRuns = [...project.toolRuns];

        if (activeRunId) {
            updatedRuns = updatedRuns.map(r =>
                r.id === activeRunId
                    ? { ...r, ...updates, updatedAt: now }
                    : r
            );
        } else {
            // Initial create if not exists
            if (!activeCard) return;
            const newRun: ToolRun = {
                id: uuidv4(),
                methodCardId: activeCard.id,
                methodCardTitle: activeCard.title,
                stage: stage,
                createdAt: now,
                updatedAt: now,
                currentStepIndex: 0,
                data: {},
                ...updates
            };
            updatedRuns.push(newRun);
            setActiveRunId(newRun.id);
        }
        updateProject({ toolRuns: updatedRuns });
    };

    const handleBack = () => {
        setActiveCard(null);
        setActiveRunId(null);
    };

    if (activeCard) {
        const currentRun = activeRunId ? project.toolRuns.find(r => r.id === activeRunId) : undefined;
        return (
            <SessionWorkspace
                card={activeCard}
                existingRun={currentRun}
                onSave={handleSaveRun}
                onBack={handleBack}
            />
        );
    }

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">{headerTitle}</h2>
                <p className="text-gray-500">{headerDescription}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Tool Library */}
                <div className="lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Available Tools</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {methods.map(method => (
                            <ToolCard
                                key={method.id}
                                card={method}
                                onClick={() => handleStartTool(method)}
                                colorTheme={colorTheme}
                            />
                        ))}
                    </div>
                </div>

                {/* Right: History */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 h-full">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Work History
                        </h3>

                        <div className="space-y-3">
                            {runs.length === 0 && (
                                <div className="text-sm text-gray-400 italic">No tools used in this stage yet.</div>
                            )}
                            {runs.map(run => (
                                <div
                                    key={run.id}
                                    onClick={() => handleOpenRun(run)}
                                    className="bg-white p-3 rounded border border-gray-200 shadow-sm cursor-pointer hover:border-blue-400 transition-colors"
                                >
                                    <div className="font-medium text-gray-800">{run.methodCardTitle}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Last active: {new Date(run.updatedAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { MethodCard, ToolFieldMap, ToolFieldValue, ToolRun } from '@/types';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Sparkles, Plus, X } from 'lucide-react';
import { aiGateway } from '@/lib/services/aiGateway';

interface SessionWorkspaceProps {
    card: MethodCard;
    existingRun?: ToolRun;
    onSave: (runData: Partial<ToolRun>) => void;
    onBack: () => void;
}

export function SessionWorkspace({ card, existingRun, onSave, onBack }: SessionWorkspaceProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [runData, setRunData] = useState<ToolFieldMap>({});
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [draftIdea, setDraftIdea] = useState('');

    useEffect(() => {
        if (existingRun) {
            setRunData(existingRun.data || {});
            setCurrentStepIndex(existingRun.currentStepIndex || 0);
        }
    }, [existingRun]);

    const steps = card.steps || [];
    const currentStep = steps[currentStepIndex];
    const totalSteps = steps.length;

    // --- State Helpers ---
    const getStepData = (stepId: string): ToolFieldValue => runData[stepId] ?? null;

    const updateStepData = (stepId: string, val: ToolFieldValue) => {
        const newData = { ...runData, [stepId]: val };
        setRunData(newData);
        // Auto-save on change
        onSave({
            data: newData,
            currentStepIndex: currentStepIndex
        });
    };

    // --- Navigation ---
    const handleNext = () => {
        if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex(prev => prev + 1);
            onSave({ currentStepIndex: currentStepIndex + 1 });
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            onSave({ currentStepIndex: currentStepIndex - 1 });
        }
    };

    const addIdea = () => {
        const trimmedIdea = draftIdea.trim();
        if (!trimmedIdea || currentStep.type !== 'diverge') {
            return;
        }

        const currentItems = Array.isArray(getStepData(currentStep.id))
            ? (getStepData(currentStep.id) as string[])
            : [];

        updateStepData(currentStep.id, [...currentItems, trimmedIdea]);
        setDraftIdea('');
    };

    // --- AI Action ---
    const handleAiAction = async () => {
        setIsAiLoading(true);
        try {
            const response = await aiGateway.stepAssist({
                methodId: card.id,
                methodTitle: card.title,
                stage: card.stage,
                project: {
                    name: card.title,
                    background: card.purpose,
                    objectives: currentStep.facilitatorText || '',
                    assumptions: ''
                },
                stepId: currentStep.id,
                stepTitle: currentStep.title,
                stepType: currentStep.type,
                facilitatorText: currentStep.facilitatorText,
                currentValue: getStepData(currentStep.id)
            });

            updateStepData(currentStep.id, response.nextValue);
        } catch (error) {
            console.error('Failed to run local AI step assist', error);
        } finally {
            setIsAiLoading(false);
        }
    };

    // --- Renderers ---
    const renderContent = () => {
        const value = getStepData(currentStep.id);
        const textValue = typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : '';

        if (currentStep.type === 'diverge') {
            const items: string[] = Array.isArray(value) ? value : [];
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {items.map((item, idx) => (
                            <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm flex justify-between group">
                                <span className="text-gray-800 font-medium font-handwriting text-lg">{item}</span>
                                <button
                                    onClick={() => updateStepData(currentStep.id, items.filter((_, i) => i !== idx))}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 border p-2 rounded"
                            placeholder={currentStep.placeholder}
                            value={draftIdea}
                            onChange={(e) => setDraftIdea(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addIdea();
                                }
                            }}
                        />
                        <Button variant="secondary" size="sm" onClick={addIdea}>
                            <Plus className="w-4 h-4 mr-2" /> Add
                        </Button>
                    </div>
                </div>
            );
        }

        // Default Input
        return (
            <textarea
                className="w-full h-64 p-4 text-lg border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:outline-none transition-all resize-none font-medium text-gray-700 leading-relaxed"
                placeholder={currentStep.placeholder}
                value={textValue}
                onChange={(e) => updateStepData(currentStep.id, e.target.value)}
            />
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{card.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-400 font-medium">Step {currentStepIndex + 1} of {totalSteps}</span>
                    </div>
                </div>
                <Button variant="ghost" onClick={onBack}>Save & Exit</Button>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto py-12 px-6">

                    {/* Facilitator Card */}
                    <div className="mb-8 bg-blue-600 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-blue-100 font-semibold uppercase tracking-wider text-sm mb-2">
                                {currentStep.title}
                            </h3>
                            <p className="text-xl md:text-2xl font-medium leading-relaxed">
                                {currentStep.facilitatorText}
                            </p>
                        </div>
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-500 rounded-full opacity-50 blur-3xl"></div>
                    </div>

                    {/* Interaction Zone */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px] relative">
                        {renderContent()}

                        {/* AI FAB */}
                        {currentStep.aiCapability !== 'none' && (
                            <div className="absolute bottom-8 right-8">
                                <Button
                                    onClick={handleAiAction}
                                    disabled={isAiLoading}
                                    className="rounded-full shadow-xl bg-gradient-to-r from-purple-600 to-indigo-600 border-none px-6 py-6 h-auto"
                                >
                                    {isAiLoading ? (
                                        <Sparkles className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5" />
                                            <span className="font-semibold">
                                                {currentStep.aiCapability === 'generate' && 'Inspire Me'}
                                                {currentStep.aiCapability === 'critique' && 'Critique'}
                                                {currentStep.aiCapability === 'elaborate' && 'Expand'}
                                                {currentStep.aiCapability === 'refine' && 'Refine'}
                                            </span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Footer Navigation */}
            <div className="bg-white border-t p-6 flex justify-between items-center max-w-5xl mx-auto w-full">
                <Button
                    variant="secondary"
                    onClick={handlePrev}
                    disabled={currentStepIndex === 0}
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>

                <Button
                    variant="primary"
                    onClick={handleNext}
                    className="px-8"
                    disabled={currentStepIndex === totalSteps - 1} // Or change to "Finish"
                >
                    {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next Step'} <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}

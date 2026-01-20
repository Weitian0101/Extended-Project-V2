import React, { useState, useEffect } from 'react';
import { MethodCard, ToolRun } from '@/types';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Save, Lightbulb } from 'lucide-react';

interface ToolWorkspaceProps {
    card: MethodCard;
    existingRun?: ToolRun;
    onSave: (answers: Record<string, any>) => void;
    onBack: () => void;
}

export function ToolWorkspace({ card, existingRun, onSave, onBack }: ToolWorkspaceProps) {
    const [answers, setAnswers] = useState<Record<string, any>>({});

    useEffect(() => {
        if (existingRun) {
            setAnswers(existingRun.answers || {});
        }
    }, [existingRun]);

    const handleChange = (id: string, value: any) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleToggleCheckbox = (id: string, option: string) => {
        const current = (answers[id] as string[]) || [];
        if (current.includes(option)) {
            handleChange(id, current.filter(item => item !== option));
        } else {
            handleChange(id, [...current, option]);
        }
    };

    const handleSave = () => {
        onSave(answers);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{card.title}</h2>
                        <p className="text-sm text-gray-500">{card.purpose}</p>
                    </div>
                </div>
                <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save
                </Button>
            </div>

            {/* Hint / Facilitation Reminder */}
            {card.hint && (
                <div className="bg-yellow-50 border-b border-yellow-100 px-6 py-3 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-yellow-800 italic">
                        <span className="font-semibold not-italic">Hint: </span>
                        {card.hint}
                    </p>
                </div>
            )}

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                <div className="space-y-8">
                    {card.template.map((step) => (
                        <div key={step.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <label className="block text-lg font-medium text-gray-800 mb-3">
                                {step.question}
                            </label>

                            {step.type === 'text' && (
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder={step.placeholder}
                                    value={answers[step.id] || ''}
                                    onChange={(e) => handleChange(step.id, e.target.value)}
                                />
                            )}

                            {step.type === 'textarea' && (
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-md h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder={step.placeholder}
                                    value={answers[step.id] || ''}
                                    onChange={(e) => handleChange(step.id, e.target.value)}
                                />
                            )}

                            {step.type === 'select' && step.options && (
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                    value={answers[step.id] || ''}
                                    onChange={(e) => handleChange(step.id, e.target.value)}
                                >
                                    <option value="">-- Select an option --</option>
                                    {step.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}

                            {step.type === 'checkbox' && step.options && (
                                <div className="space-y-2">
                                    {step.options.map(opt => {
                                        const isChecked = (answers[step.id] as string[])?.includes(opt);
                                        return (
                                            <label key={opt} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    checked={isChecked || false}
                                                    onChange={() => handleToggleCheckbox(step.id, opt)}
                                                />
                                                <span className="text-gray-700">{opt}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {step.type === 'instruction' && (
                                <div className="text-gray-600 bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                                    {step.placeholder}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { MethodCard, ToolRun, ProjectContext } from '@/types';
import { Button } from '@/components/ui/Button';
import { Bot, Sparkles, ChevronLeft, Send, X, Zap, ArrowDownCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MethodSplitViewProps {
    card: MethodCard;
    context: ProjectContext;
    existingRun?: ToolRun;
    onSave: (run: Partial<ToolRun>) => void;
    onBack: () => void;
}

export function MethodSplitView({ card, context, existingRun, onSave, onBack }: MethodSplitViewProps) {
    const [responses, setResponses] = useState(existingRun?.aiResponses || []);
    const [isLoading, setIsLoading] = useState(false);

    // AI Chat / Facilitator State
    const [isFacilitatorOpen, setIsFacilitatorOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');

    // Mobile Panel State
    const [isMobileAiPanelOpen, setIsMobileAiPanelOpen] = useState(false);

    const handlePromptClick = (promptTemplate: string) => {
        setIsLoading(true);
        // Mock AI Call
        setTimeout(() => {
            const newResponse = {
                prompt: promptTemplate,
                response: `[AI generated response based on '${context.name}' context]\n\nHere are some ideas:\n1. Idea one related to ${context.objectives}\n2. Idea two...\n3. Idea three...`,
                timestamp: Date.now()
            };
            const updated = [...responses, newResponse];
            setResponses(updated);
            onSave({ aiResponses: updated });
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-white relative overflow-hidden">

            {/* === LEFT COLUMN: Reference Image === */}
            {/* On mobile: takes full height by default. On desktop: 50% width. */}
            <div className="w-full lg:w-1/2 h-full bg-gray-100 border-r border-gray-200 flex flex-col overflow-hidden relative shrink-0">
                <div className="absolute top-4 left-4 z-10">
                    <Button variant="secondary" size="sm" onClick={onBack} className="bg-white/90 backdrop-blur shadow-sm border border-gray-200">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                </div>

                <div className="flex-1 relative w-full h-full">
                    <Image
                        src={card.image}
                        alt="Method Reference"
                        fill
                        style={{ objectFit: 'contain' }}
                        className="p-2 lg:p-8"
                        unoptimized
                    />
                </div>

                <div className="bg-white p-2 lg:p-4 border-t text-[10px] lg:text-xs text-center text-gray-400 z-10">
                    Reference Card: {card.title}
                </div>
            </div>

            {/* === RIGHT COLUMN: AI Interaction === */}
            {/* On Desktop: Always visible. On Mobile: Hidden behind drawer or toggle. */}
            <div className={cn(
                "bg-gray-50 flex flex-col transition-transform duration-300 ease-in-out bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]",
                "lg:w-1/2 lg:h-full lg:translate-y-0 lg:static lg:bg-gray-50 lg:shadow-none", // Desktop Styles
                // Mobile Styles: Absolute, sliding drawer from bottom
                "absolute bottom-0 left-0 right-0 h-[80%] z-40 rounded-t-3xl",
                isMobileAiPanelOpen ? "translate-y-0" : "translate-y-[110%]" // Slide logic
            )}>

                {/* Mobile Handle / Close Button */}
                <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <span className="font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" /> AI Actions
                    </span>
                    <button onClick={() => setIsMobileAiPanelOpen(false)} className="p-2 bg-gray-100 rounded-full">
                        <ArrowDownCircle className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Header (Desktop Only Title) */}
                <div className="hidden lg:block bg-white border-b px-8 py-6 shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{card.title}</h2>
                    <p className="text-gray-500 text-sm">{card.purpose}</p>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">

                    {/* Prompt Buttons */}
                    <div className="grid grid-cols-1 gap-3">
                        {card.aiPrompts.map(prompt => (
                            <button
                                key={prompt.id}
                                onClick={() => handlePromptClick(prompt.promptTemplate)}
                                disabled={isLoading}
                                className="text-left px-4 py-3 lg:px-5 lg:py-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex items-center justify-between"
                            >
                                <span className="font-medium text-gray-700 text-sm lg:text-base group-hover:text-blue-700">{prompt.label}</span>
                                <Sparkles className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                            </button>
                        ))}
                    </div>

                    {/* Output Stream */}
                    <div className="space-y-6 pt-4 border-t border-gray-200 pb-20 lg:pb-0">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Session Log</h3>

                        {responses.length === 0 && (
                            <div className="text-center py-8 text-gray-400 italic text-sm">
                                Select a prompt above to start the session.
                            </div>
                        )}

                        {responses.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 lg:p-6 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                <div className="text-xs text-blue-600 font-semibold mb-2 flex items-center gap-2">
                                    <Bot className="w-3 h-3" />
                                    {item.prompt}
                                </div>
                                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
                                    {item.response}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-blue-500 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === MOBILE CONTROLS === */}
            {/* 1. Toggle AI Panel Button (Bottom Left) */}
            <div className="lg:hidden absolute bottom-6 left-6 z-30">
                <button
                    onClick={() => setIsMobileAiPanelOpen(true)}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-transform active:scale-95 flex items-center justify-center"
                >
                    <Zap className="w-6 h-6" />
                </button>
            </div>


            {/* === PERSISTENT FACILITATOR (Bottom Right) === */}
            <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8 z-50">
                {!isFacilitatorOpen && (
                    <button
                        onClick={() => setIsFacilitatorOpen(true)}
                        className="bg-gray-900 text-white p-3 lg:p-4 rounded-full shadow-2xl hover:bg-gray-800 transition-transform hover:scale-105 flex items-center gap-2"
                    >
                        <Bot className="w-5 h-5 lg:w-6 lg:h-6" />
                        <span className="font-bold pr-2 hidden lg:inline">Facilitator</span>
                    </button>
                )}

                {isFacilitatorOpen && (
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 lg:w-80 flex flex-col overflow-hidden animate-in zoom-in-50 duration-200 origin-bottom-right absolute bottom-16 right-0 lg:static">
                        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                            <span className="font-bold flex items-center gap-2 text-sm"><Bot className="w-4 h-4" /> AI Facilitator</span>
                            <button onClick={() => setIsFacilitatorOpen(false)}><X className="w-4 h-4" /></button>
                        </div>
                        <div className="h-64 p-4 bg-gray-50 overflow-y-auto text-sm text-gray-600">
                            Hello! I know about <strong>{context.name}</strong>. How can I help you run this method?
                        </div>
                        <div className="p-3 border-t bg-white flex gap-2">
                            <input
                                className="flex-1 text-sm outline-none"
                                placeholder="Ask for help..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                            />
                            <button className="text-blue-600"><Send className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

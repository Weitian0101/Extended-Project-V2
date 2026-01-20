import React, { useState } from 'react';
import { ProjectData } from '@/types';
import { Button } from '@/components/ui/Button';
import { Bot, Send, X, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectOverviewProps {
    project: ProjectData;
    onUpdateContext: (context: Partial<ProjectData['context']>) => void;
}

export function ProjectOverview({ project, onUpdateContext }: ProjectOverviewProps) {
    const { context } = project;
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');

    const handleChange = (field: keyof typeof context, value: string) => {
        onUpdateContext({ [field]: value });
    };

    return (
        <div className="relative h-full bg-slate-50 overflow-hidden flex flex-col">

            {/* Background Ambience */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-[100px] opacity-60 z-0 pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10 max-w-5xl mx-auto w-full h-full flex flex-col p-4 lg:p-12 overflow-y-auto">

                <header className="mb-6 lg:mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-4">
                        <Layers className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">Project Context</h1>
                    <p className="text-base lg:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Establish the foundation. The AI facilitator uses this context to guide you through every subsequent stage.
                    </p>
                </header>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 lg:p-10 space-y-8 lg:space-y-10">

                    {/* Project Name */}
                    <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-blue-500 transition-colors">
                            Project Name
                        </label>
                        <input
                            className="w-full text-2xl lg:text-3xl font-bold bg-transparent border-b-2 border-slate-200 focus:border-blue-600 outline-none pb-2 transition-all placeholder:text-slate-300 text-slate-800"
                            value={context.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Untitled Innovation Project"
                        />
                    </div>

                    {/* Why */}
                    <div className="group">
                        <div className="flex items-center gap-2 mb-3">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">The Challenge</label>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Why does this matter?</span>
                        </div>
                        <textarea
                            className="w-full h-32 p-6 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all text-base lg:text-lg leading-relaxed text-slate-700 placeholder:text-slate-400"
                            value={context.background}
                            onChange={(e) => handleChange('background', e.target.value)}
                            placeholder="Describe the core problem or opportunity you are tackling..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Who */}
                        <div className="group">
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Target Audience</label>
                            </div>
                            <textarea
                                className="w-full h-40 p-5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all text-base leading-relaxed text-slate-700 placeholder:text-slate-400"
                                value={context.objectives}
                                onChange={(e) => handleChange('objectives', e.target.value)}
                                placeholder="Who are the stakeholders? Who benefits?"
                            />
                        </div>

                        {/* Constraints */}
                        <div className="group">
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Unknowns & Constraints</label>
                            </div>
                            <textarea
                                className="w-full h-40 p-5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all text-base leading-relaxed text-slate-700 placeholder:text-slate-400"
                                value={context.assumptions}
                                onChange={(e) => handleChange('assumptions', e.target.value)}
                                placeholder="What are the budget, technical, or time limits?"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="text-center mt-12 mb-20 lg:mb-8 text-slate-400 text-sm flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Context Memory Active</span>
                </div>
            </div>

            {/* Persistent AI Assistant (Floating) */}
            <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8 z-50">
                {!isChatOpen && (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 hover:shadow-blue-500/20 flex items-center gap-3 group"
                    >
                        <div className="relative">
                            <Bot className="w-6 h-6" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                        </div>
                        <span className="font-bold pr-1 hidden lg:inline">Facilitator</span>
                    </button>
                )}

                {isChatOpen && (
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 lg:w-96 flex flex-col overflow-hidden animate-in zoom-in-50 duration-200 origin-bottom-right absolute bottom-16 right-0 lg:static">
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                            <span className="font-bold flex items-center gap-2 text-sm"><Bot className="w-4 h-4 text-blue-400" /> Context Coach</span>
                            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="h-64 p-4 bg-slate-50 overflow-y-auto text-sm text-slate-600 leading-relaxed">
                            <div className="bg-blue-100 p-3 rounded-lg rounded-tl-none inline-block max-w-[90%] text-slate-800 mb-2">
                                Hello! I'm here to help you define the project. A clear context helps me generate better ideas later. Need help articulating the challenge?
                            </div>
                        </div>
                        <div className="p-3 border-t bg-white flex gap-2">
                            <input
                                className="flex-1 text-sm outline-none placeholder:text-slate-400"
                                placeholder="Ask for help..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                            />
                            <button className="text-blue-600 hover:text-blue-700 bg-blue-50 p-2 rounded-lg"><Send className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

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
        <div className="relative h-full overflow-hidden flex flex-col">

            {/* Background Ambience */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-sky-100 to-cyan-100 rounded-full blur-[100px] opacity-60 z-0 pointer-events-none"></div>

            {/* Content Container */}
            <div className="scrollbar-none relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col overflow-y-auto p-4 lg:p-8">

                <header className="mb-4 text-center lg:mb-6">
                    <div className="surface-panel mb-3 inline-flex items-center justify-center rounded-2xl p-3">
                        <Layers className="h-7 w-7 text-blue-600" />
                    </div>
                    <h1 className="mb-2 text-3xl font-display font-semibold tracking-tight text-[var(--foreground)] lg:text-4xl">Project Context</h1>
                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--foreground-soft)] lg:text-lg">
                        Establish the foundation. The AI facilitator uses this context to guide you through every subsequent stage.
                    </p>
                </header>

                <div className="surface-panel-strong space-y-6 rounded-[32px] p-5 lg:space-y-8 lg:p-8">

                    {/* Project Name */}
                    <div className="group">
                        <label className="block text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-[0.24em] mb-3 ml-1 group-focus-within:text-blue-500 transition-colors">
                            Project Name
                        </label>
                        <input
                            className="w-full text-2xl lg:text-3xl font-display font-semibold bg-transparent border-b-2 border-[var(--panel-border)] focus:border-blue-600 outline-none pb-2 transition-all placeholder:text-[var(--foreground-muted)] text-[var(--foreground)]"
                            value={context.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Untitled Innovation Project"
                        />
                    </div>

                    {/* Why */}
                    <div className="group">
                        <div className="flex items-center gap-2 mb-3">
                            <label className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">The Challenge</label>
                            <span className="text-xs text-[var(--foreground-muted)] bg-[var(--panel)] px-2 py-0.5 rounded-full">Why does this matter?</span>
                        </div>
                        <textarea
                            className="h-28 w-full resize-none rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-base leading-relaxed text-[var(--foreground-soft)] outline-none transition-all placeholder:text-[var(--foreground-muted)] hover:bg-[var(--panel-strong)] focus:bg-[var(--panel-strong)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 lg:text-lg"
                            value={context.background}
                            onChange={(e) => handleChange('background', e.target.value)}
                            placeholder="Describe the core problem or opportunity you are tackling..."
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Who */}
                        <div className="group">
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">Target Audience</label>
                            </div>
                            <textarea
                                className="h-32 w-full resize-none rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-base leading-relaxed text-[var(--foreground-soft)] outline-none transition-all placeholder:text-[var(--foreground-muted)] hover:bg-[var(--panel-strong)] focus:bg-[var(--panel-strong)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                value={context.objectives}
                                onChange={(e) => handleChange('objectives', e.target.value)}
                                placeholder="Who are the stakeholders? Who benefits?"
                            />
                        </div>

                        {/* Constraints */}
                        <div className="group">
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">Unknowns & Constraints</label>
                            </div>
                            <textarea
                                className="h-32 w-full resize-none rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-base leading-relaxed text-[var(--foreground-soft)] outline-none transition-all placeholder:text-[var(--foreground-muted)] hover:bg-[var(--panel-strong)] focus:bg-[var(--panel-strong)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                value={context.assumptions}
                                onChange={(e) => handleChange('assumptions', e.target.value)}
                                placeholder="What are the budget, technical, or time limits?"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="mt-6 mb-16 flex items-center justify-center gap-2 text-center text-sm text-[var(--foreground-muted)] lg:mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Context Memory Active</span>
                </div>
            </div>

            {/* Persistent AI Assistant (Floating) */}
            <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8 z-50">
                {!isChatOpen && (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="border border-sky-500/20 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white p-4 rounded-full shadow-[0_18px_42px_rgba(37,99,235,0.24)] transition-all hover:scale-105 hover:shadow-[0_24px_54px_rgba(37,99,235,0.3)] flex items-center gap-3 group"
                    >
                        <div className="relative">
                            <Bot className="w-6 h-6" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-sky-600"></div>
                        </div>
                        <span className="font-bold pr-1 hidden lg:inline">Facilitator</span>
                    </button>
                )}

                {isChatOpen && (
                    <div className="surface-panel-strong w-80 lg:w-96 flex flex-col overflow-hidden animate-in zoom-in-50 duration-200 origin-bottom-right absolute bottom-16 right-0 lg:static rounded-2xl">
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                            <span className="font-bold flex items-center gap-2 text-sm"><Bot className="w-4 h-4 text-blue-400" /> Context Coach</span>
                            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="h-64 p-4 bg-[var(--panel)] overflow-y-auto text-sm text-[var(--foreground-soft)] leading-relaxed">
                            <div className="bg-blue-100/80 p-3 rounded-lg rounded-tl-none inline-block max-w-[90%] text-slate-800 mb-2">
                                Hello! I'm here to help you define the project. A clear context helps me generate better ideas later. Need help articulating the challenge?
                            </div>
                        </div>
                        <div className="p-3 border-t border-[var(--panel-border)] bg-[var(--panel-strong)] flex gap-2">
                            <input
                                className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)]"
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

'use client';

import React from 'react';
import { Compass, Lightbulb, Hammer, CheckCircle, Rocket, FileText, BookOpen, Layers, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StageId } from '@/types';
import Image from 'next/image';

interface SidebarProps {
    currentStage: StageId;
    onSetStage: (stage: StageId) => void;
    isOpen?: boolean; // Mobile state
    onClose?: () => void; // Mobile close handler
    onBackToDashboard?: () => void;
}

export function Sidebar({ currentStage, onSetStage, isOpen = true, onClose, onBackToDashboard }: SidebarProps) {
    const navItems = [
        { id: 'overview', label: 'Project Context', icon: Layers, description: 'Set the stage' },
        { id: 'explore', label: 'Explore', icon: Compass, description: 'Broaden horizons' },
        { id: 'imagine', label: 'Imagine', icon: Lightbulb, description: 'Generate ideas' },
        { id: 'implement', label: 'Implement', icon: Hammer, description: 'Make it real' },
        { id: 'tell-story', label: 'Tell Story', icon: BookOpen, description: 'Share the journey' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <aside className={cn(
                "h-screen flex flex-col bg-slate-900 text-slate-300 shadow-2xl overflow-hidden shrink-0 transition-transform duration-300 z-50",
                "fixed top-0 left-0 w-80 lg:relative lg:translate-x-0 lg:w-72",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>

                {/* Background Ambience */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 z-0 pointer-events-none"></div>
                <div className="absolute top-[-10%] right-[-50%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] z-0 pointer-events-none"></div>

                {/* Header with Logo */}
                <div className="relative z-10 p-8 pb-6 flex flex-col items-center border-b border-white/5">
                    <div className="absolute top-4 right-4 lg:hidden">
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="relative w-52 h-24 mb-4">
                        <Image
                            src="/images/logo.png"
                            alt="Company Logo"
                            fill
                            style={{ objectFit: 'contain' }}
                            className="drop-shadow-lg"
                        />
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">Innovation Toolkit</div>
                </div>

                {/* Navigation */}
                <nav className="relative z-10 flex-1 px-4 space-y-3 mt-6 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentStage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onSetStage(item.id as StageId);
                                    if (onClose) onClose();
                                }}
                                className={cn(
                                    "w-full group relative flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 ease-out border border-transparent",
                                    isActive
                                        ? "bg-white/5 border-white/10 text-white shadow-lg shadow-black/20"
                                        : "hover:bg-white/5 hover:text-white hover:border-white/5 text-slate-400"
                                )}
                            >
                                {/* Active Indicator Line */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                                )}

                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isActive ? "bg-blue-500/20 text-blue-400" : "bg-slate-800/50 text-slate-500 group-hover:text-slate-300"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                <div className="text-left">
                                    <div className={cn("text-sm font-semibold leading-none mb-1 transition-colors", isActive ? "text-white" : "text-slate-300")}>
                                        {item.label}
                                    </div>
                                    <div className={cn("text-[10px] transition-colors", isActive ? "text-blue-300/80" : "text-slate-600 group-hover:text-slate-500")}>
                                        {item.description}
                                    </div>
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="relative z-10 p-6 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse">
                            AI
                        </div>
                        <div>
                            <div className="text-xs text-white font-medium">Assistant Active</div>
                            <div className="text-[10px] text-slate-500">Context Loaded</div>
                        </div>
                    </div>

                    {onBackToDashboard && (
                        <button
                            onClick={onBackToDashboard}
                            className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}

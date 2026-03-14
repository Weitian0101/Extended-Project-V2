'use client';

import React from 'react';
import Image from 'next/image';
import { BookOpen, ChevronLeft, ChevronRight, Compass, Hammer, Layers, Lightbulb, X } from 'lucide-react';

import { BrandLockup } from '@/components/ui/BrandLockup';
import { useAppTheme } from '@/components/ui/AppThemeProvider';
import { cn } from '@/lib/utils';
import { StageId } from '@/types';

interface SidebarProps {
    currentStage: StageId;
    onSetStage: (stage: StageId) => void;
    onGoDashboard?: () => void;
    isOpen?: boolean;
    isCollapsed?: boolean;
    onClose?: () => void;
    onToggleCollapse?: () => void;
}

const STAGE_ACCENTS: Record<StageId, {
    indicator: string;
    activeIcon: string;
    activeText: string;
    softGlow: string;
}> = {
    overview: {
        indicator: 'bg-slate-400 shadow-[0_0_18px_rgba(148,163,184,0.3)]',
        activeIcon: 'bg-slate-500/12 text-slate-600 border-slate-300/60',
        activeText: 'text-slate-700',
        softGlow: 'bg-slate-300/30'
    },
    explore: {
        indicator: 'bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.3)]',
        activeIcon: 'bg-emerald-500/12 text-emerald-700 border-emerald-200/80',
        activeText: 'text-emerald-700',
        softGlow: 'bg-emerald-300/26'
    },
    imagine: {
        indicator: 'bg-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.3)]',
        activeIcon: 'bg-rose-500/12 text-rose-700 border-rose-200/80',
        activeText: 'text-rose-700',
        softGlow: 'bg-rose-300/26'
    },
    implement: {
        indicator: 'bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.3)]',
        activeIcon: 'bg-amber-500/12 text-amber-700 border-amber-200/80',
        activeText: 'text-amber-700',
        softGlow: 'bg-amber-300/26'
    },
    'tell-story': {
        indicator: 'bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.3)]',
        activeIcon: 'bg-sky-500/12 text-sky-700 border-sky-200/80',
        activeText: 'text-sky-700',
        softGlow: 'bg-sky-300/26'
    }
};

const NAV_ITEMS = [
    { id: 'overview', label: 'Project Context', icon: Layers, description: 'Set the stage' },
    { id: 'explore', label: 'Explore', icon: Compass, description: 'Broaden horizons' },
    { id: 'imagine', label: 'Imagine', icon: Lightbulb, description: 'Generate ideas' },
    { id: 'implement', label: 'Implement', icon: Hammer, description: 'Make it real' },
    { id: 'tell-story', label: 'Tell Story', icon: BookOpen, description: 'Share the journey' }
] as const;

export function Sidebar({
    currentStage,
    onSetStage,
    onGoDashboard,
    isOpen = true,
    isCollapsed = false,
    onClose,
    onToggleCollapse
}: SidebarProps) {
    const { theme } = useAppTheme();
    const activeAccent = STAGE_ACCENTS[currentStage];
    const isDark = theme === 'dark';

    return (
        <>
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-black/35 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                )}
                onClick={onClose}
            />

            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 flex h-screen w-80 shrink-0 flex-col overflow-hidden border-r shadow-[14px_0_36px_rgba(15,23,42,0.07)] transition-[transform,width] duration-300 lg:relative lg:translate-x-0',
                    isDark ? 'border-white/10 shadow-[14px_0_36px_rgba(2,6,23,0.3)]' : 'border-slate-300/70',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                    isCollapsed ? 'lg:w-[6.5rem]' : 'lg:w-80'
                )}
            >
                <div className={cn(
                    'absolute inset-0',
                    isDark
                        ? 'bg-[linear-gradient(180deg,#07101d,#0b1628_34%,#0d192d_100%)]'
                        : 'bg-[linear-gradient(180deg,#fbfdff,#f3f7fc_38%,#edf3fa_100%)]'
                )} />
                <div className={cn('absolute right-[-24%] top-[-12%] h-[320px] w-[320px] rounded-full blur-[90px] opacity-40', activeAccent.softGlow)} />
                <div className={cn(
                    'absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,rgba(148,163,184,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.5)_1px,transparent_1px)] bg-[size:28px_28px]',
                    isDark ? '' : 'opacity-[0.04]'
                )} />

                <div className={cn('relative z-10 border-b p-7 pb-5', isDark ? 'border-white/10' : 'border-slate-300/70', isCollapsed && 'lg:px-4 lg:py-5')}>
                    <div className="absolute right-4 top-4 lg:hidden">
                        <button onClick={onClose} className={cn('p-2 transition-colors', isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900')}>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="absolute right-4 top-4 z-20 hidden lg:block">
                        <button
                            type="button"
                            onClick={onToggleCollapse}
                            className={cn(
                                'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5',
                                isDark
                                    ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:text-white'
                                    : 'border-slate-200/80 bg-white text-slate-500 hover:text-slate-900'
                            )}
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </button>
                    </div>

                    <div className={cn(
                        'rounded-[28px] border p-4 backdrop-blur-xl',
                        isDark ? 'border-white/10 bg-white/[0.05]' : 'border-slate-300/70 bg-white/88',
                        isCollapsed && 'lg:flex lg:items-center lg:justify-center lg:px-3'
                    )}>
                        {isCollapsed ? (
                            <button
                                type="button"
                                onClick={onGoDashboard}
                                className={cn(
                                    'flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] border transition-all duration-200 hover:-translate-y-0.5',
                                    isDark
                                        ? 'border-white/10 bg-white/[0.06] text-white'
                                        : 'border-slate-300/70 bg-white text-slate-900'
                                )}
                                title="Back to dashboard"
                                aria-label="Back to dashboard"
                            >
                                <div className="relative h-9 w-9">
                                    <Image
                                        src="/images/logo.png"
                                        alt="Academy of Design Thinking"
                                        fill
                                        sizes="36px"
                                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                                        className={isDark ? '' : 'mix-blend-multiply'}
                                    />
                                </div>
                            </button>
                        ) : (
                            <>
                                <BrandLockup compact onClick={onGoDashboard} />
                                <div className={cn('mt-4 text-[10px] uppercase tracking-[0.24em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                                    Innovation Toolkit
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <nav className={cn('relative z-10 mt-6 flex-1 space-y-3 overflow-y-auto px-4', isCollapsed && 'lg:px-3')}>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentStage === item.id;
                        const accent = STAGE_ACCENTS[item.id as StageId];

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onSetStage(item.id as StageId);
                                    if (onClose) onClose();
                                }}
                                title={isCollapsed ? item.label : undefined}
                                aria-label={item.label}
                                className={cn(
                                    'group relative flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-300 ease-out',
                                    isActive
                                        ? isDark
                                            ? 'border-white/10 bg-white/[0.06] shadow-[0_16px_32px_rgba(2,6,23,0.2)]'
                                            : 'border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]'
                                        : isDark
                                            ? 'border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.04] hover:text-white'
                                            : 'border-transparent text-slate-500 hover:border-slate-200/80 hover:bg-white/80 hover:text-slate-900',
                                    isCollapsed && 'lg:justify-center lg:px-3'
                                )}
                            >
                                {isActive && (
                                    <div className={cn('absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full', accent.indicator)} />
                                )}

                                <div
                                    className={cn(
                                        'rounded-xl border p-2.5 transition-colors',
                                        isActive
                                            ? accent.activeIcon
                                            : isDark
                                                ? 'border-white/5 bg-slate-900/40 text-slate-500 group-hover:text-slate-200'
                                                : 'border-slate-200/80 bg-white text-slate-400 group-hover:text-slate-700'
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>

                                {!isCollapsed && (
                                    <div className="text-left">
                                        <div className={cn('mb-1 text-sm font-semibold leading-none font-display', isActive ? accent.activeText : isDark ? 'text-slate-100' : 'text-slate-800')}>
                                            {item.label}
                                        </div>
                                        <div className={cn('text-[10px] uppercase tracking-[0.16em]', isActive ? accent.activeText : isDark ? 'text-slate-500' : 'text-slate-400')}>
                                            {item.description}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className={cn('relative z-10 border-t px-6 py-5', isDark ? 'border-white/10 bg-black/10' : 'border-slate-300/70 bg-white/55', isCollapsed && 'lg:px-4')}>
                    <div className={cn('flex items-center gap-3', isCollapsed && 'lg:justify-center')}>
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg', activeAccent.indicator)}>
                            AI
                        </div>
                        {!isCollapsed && (
                            <div>
                                <div className={cn('text-xs font-medium', isDark ? 'text-white' : 'text-slate-900')}>AI facilitator</div>
                                <div className={cn('text-[10px] uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>Context aware</div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

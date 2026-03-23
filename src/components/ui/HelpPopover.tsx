'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { CircleHelp, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

interface HelpPopoverProps {
    title: string;
    description: string;
    enabled?: boolean;
    align?: 'left' | 'right';
    className?: string;
    panelClassName?: string;
}

export function HelpPopover({
    title,
    description,
    enabled = true,
    align = 'left',
    className,
    panelClassName
}: HelpPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [panelPosition, setPanelPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const popoverRef = useRef<HTMLSpanElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const panelId = useId();

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const updatePosition = () => {
            const buttonRect = buttonRef.current?.getBoundingClientRect();
            const panelRect = panelRef.current?.getBoundingClientRect();

            if (!buttonRect) {
                return;
            }

            const panelWidth = panelRect?.width ?? 320;
            const panelHeight = panelRect?.height ?? 180;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const spacing = 12;

            const preferredLeft = align === 'right'
                ? buttonRect.right - panelWidth
                : buttonRect.left;
            const left = Math.min(
                Math.max(spacing, preferredLeft),
                Math.max(spacing, viewportWidth - panelWidth - spacing)
            );

            const openAbove = buttonRect.bottom + spacing + panelHeight > viewportHeight - spacing
                && buttonRect.top - spacing - panelHeight > spacing;
            const rawTop = openAbove
                ? buttonRect.top - panelHeight - spacing
                : buttonRect.bottom + spacing;
            const top = Math.min(
                Math.max(spacing, rawTop),
                Math.max(spacing, viewportHeight - panelHeight - spacing)
            );

            setPanelPosition({ top, left });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [align, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!popoverRef.current?.contains(target) && !panelRef.current?.contains(target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    if (!enabled) {
        return null;
    }

    return (
        <span ref={popoverRef} className={cn('relative inline-flex shrink-0', className)}>
            <button
                ref={buttonRef}
                type="button"
                aria-label={`Explain ${title}`}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setIsOpen((current) => !current)}
                className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full border bg-[var(--panel)] transition-all',
                    isOpen
                        ? 'border-sky-300/70 bg-sky-500/12 text-sky-600 shadow-[0_12px_24px_rgba(14,165,233,0.14)] dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-300'
                        : 'border-[var(--panel-border)] text-[var(--foreground-muted)] hover:border-sky-300/60 hover:text-[var(--foreground)]'
                )}
            >
                <CircleHelp className="h-3.5 w-3.5" />
            </button>
            {typeof document !== 'undefined' && createPortal(
                <div
                    ref={panelRef}
                    id={panelId}
                    role="dialog"
                    aria-label={title}
                    className={cn(
                        'fixed z-[180] w-80 rounded-[22px] border border-sky-200/60 bg-[var(--panel-strong)]/97 p-4 text-left shadow-[0_26px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-all dark:border-sky-400/18',
                        isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                        panelClassName
                    )}
                    style={{
                        top: `${panelPosition.top}px`,
                        left: `${panelPosition.left}px`
                    }}
                >
                    <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_72%)]" />
                    <div className="relative">
                        <div className="flex items-start gap-3">
                            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-300/35 bg-sky-500/12 text-sky-600 dark:border-sky-400/18 dark:bg-sky-400/12 dark:text-sky-200">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-sky-700 dark:text-sky-200">Quick help</div>
                                <div className="mt-1 text-base font-display font-semibold text-[var(--foreground)]">{title}</div>
                            </div>
                        </div>
                        <div className="mt-3 rounded-[18px] border border-white/30 bg-white/45 px-4 py-3 text-sm leading-relaxed text-[var(--foreground-soft)] dark:border-white/10 dark:bg-white/5">
                            {description}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </span>
    );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';

type GuidePlacement = 'top' | 'right' | 'bottom' | 'left';

interface GuideAction {
    label: string;
    onClick: () => void;
}

interface SpotlightGuideProps {
    open: boolean;
    title: string;
    description: string;
    purpose: string;
    currentStep: number;
    totalSteps: number;
    targetRef?: React.RefObject<HTMLElement | null>;
    placement?: GuidePlacement;
    primaryAction?: GuideAction;
    secondaryAction?: GuideAction;
    onBack?: () => void;
    onSkip?: () => void;
}

interface RectState {
    top: number;
    left: number;
    width: number;
    height: number;
}

function resolvePlacement(rect: RectState, preferredPlacement: GuidePlacement) {
    const viewportPadding = 16;
    const spacing = 18;
    const availableTop = rect.top - viewportPadding;
    const availableBottom = window.innerHeight - rect.top - rect.height - viewportPadding;
    const availableLeft = rect.left - viewportPadding;
    const availableRight = window.innerWidth - rect.left - rect.width - viewportPadding;

    if (preferredPlacement === 'bottom' && availableBottom < 290 && availableTop > availableBottom) {
        return 'top';
    }

    if (preferredPlacement === 'top' && availableTop < 240 && availableBottom > availableTop) {
        return 'bottom';
    }

    if (preferredPlacement === 'right' && availableRight < 340 && availableLeft > availableRight + spacing) {
        return 'left';
    }

    if (preferredPlacement === 'left' && availableLeft < 340 && availableRight > availableLeft + spacing) {
        return 'right';
    }

    return preferredPlacement;
}

function getPlacementStyle(rect: RectState | null, placement: GuidePlacement) {
    const cardWidth = Math.min(344, Math.max(window.innerWidth - 32, 280));
    const cardHeightAllowance = 252;
    const padding = 18;
    const viewportPadding = 16;

    if (!rect) {
        return {
            top: Math.max((window.innerHeight - cardHeightAllowance) / 2, 24),
            left: Math.max((window.innerWidth - cardWidth) / 2, 16),
            width: cardWidth
        };
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const resolvedPlacement = resolvePlacement(rect, placement);

    let top = rect.top + rect.height + padding;
    let left = centerX - cardWidth / 2;

    if (resolvedPlacement === 'top') {
        top = rect.top - cardHeightAllowance - padding;
        left = centerX - cardWidth / 2;
    }

    if (resolvedPlacement === 'right') {
        top = centerY - cardHeightAllowance / 2;
        left = rect.left + rect.width + padding;
    }

    if (resolvedPlacement === 'left') {
        top = centerY - cardHeightAllowance / 2;
        left = rect.left - cardWidth - padding;
    }

    const clampedTop = Math.min(Math.max(top, viewportPadding), window.innerHeight - cardHeightAllowance - viewportPadding);
    const clampedLeft = Math.min(Math.max(left, viewportPadding), window.innerWidth - cardWidth - viewportPadding);

    return {
        top: clampedTop,
        left: clampedLeft,
        width: cardWidth
    };
}

export function SpotlightGuide({
    open,
    title,
    description,
    purpose,
    currentStep,
    totalSteps,
    targetRef,
    placement = 'bottom',
    primaryAction,
    secondaryAction,
    onBack,
    onSkip
}: SpotlightGuideProps) {
    const [rect, setRect] = useState<RectState | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const updateRect = () => {
            const target = targetRef?.current;
            if (!target) {
                setRect(null);
                return;
            }

            const nextRect = target.getBoundingClientRect();
            setRect({
                top: nextRect.top,
                left: nextRect.left,
                width: nextRect.width,
                height: nextRect.height
            });
        };

        targetRef?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
        updateRect();
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [open, targetRef]);

    const cardStyle = useMemo(() => {
        if (!open || typeof window === 'undefined') {
            return undefined;
        }

        return getPlacementStyle(rect, placement);
    }, [open, placement, rect]);

    if (!open) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed inset-0 z-[80]">
            <div className="absolute inset-0 bg-slate-950/7" />

            {rect && (
                <div
                    className="absolute rounded-[28px] border border-sky-300 bg-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_0_10px_rgba(14,165,233,0.08),0_18px_42px_rgba(14,165,233,0.16)] transition-all duration-200"
                    style={{
                        top: rect.top - 6,
                        left: rect.left - 6,
                        width: rect.width + 12,
                        height: rect.height + 12
                    }}
                />
            )}

            <div
                className="pointer-events-auto absolute rounded-[28px] border border-[var(--panel-border)] bg-[color:var(--panel-strong)]/97 p-4 shadow-[0_20px_44px_rgba(15,23,42,0.18)] backdrop-blur-md transition-all duration-200"
                style={cardStyle}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex rounded-full border border-sky-200/80 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                        Step {currentStep} / {totalSteps}
                    </div>
                    {onSkip && (
                        <button
                            type="button"
                            onClick={onSkip}
                            className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                        >
                            Skip
                        </button>
                    )}
                </div>

                <h3 className="mt-3 text-xl font-display font-semibold text-[var(--foreground)]">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--foreground-soft)]">{description}</p>
                <div className="mt-3 rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">What you can do here</div>
                    <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">{purpose}</div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        {onBack && (
                            <Button size="sm" variant="ghost" onClick={onBack}>
                                Back
                            </Button>
                        )}
                        {secondaryAction && (
                            <Button size="sm" variant="secondary" onClick={secondaryAction.onClick}>
                                {secondaryAction.label}
                            </Button>
                        )}
                    </div>
                    {primaryAction && (
                        <Button size="sm" onClick={primaryAction.onClick}>
                            {primaryAction.label}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/Button';

type GuidePlacement = 'top' | 'right' | 'bottom' | 'left';

interface GuideAction {
    label: string;
    onClick: () => void;
    disabled?: boolean;
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

interface GuideCardSize {
    width: number;
    height: number;
}

interface ViewportMetrics {
    width: number;
    height: number;
    offsetTop: number;
    offsetLeft: number;
}

function clamp(value: number, min: number, max: number) {
    if (max < min) {
        return min;
    }

    return Math.min(Math.max(value, min), max);
}

function getViewportMetrics(): ViewportMetrics {
    if (typeof window === 'undefined') {
        return {
            width: 1280,
            height: 720,
            offsetTop: 0,
            offsetLeft: 0
        };
    }

    const visualViewport = window.visualViewport;
    if (!visualViewport) {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            offsetTop: 0,
            offsetLeft: 0
        };
    }

    return {
        width: visualViewport.width,
        height: visualViewport.height,
        offsetTop: visualViewport.offsetTop,
        offsetLeft: visualViewport.offsetLeft
    };
}

function resolvePlacement(
    rect: RectState,
    preferredPlacement: GuidePlacement,
    cardWidth: number,
    cardHeight: number,
    viewport: ViewportMetrics
) {
    const viewportPadding = 16;
    const spacing = 18;
    const availableTop = rect.top - viewport.offsetTop - viewportPadding;
    const availableBottom = viewport.offsetTop + viewport.height - rect.top - rect.height - viewportPadding;
    const availableLeft = rect.left - viewport.offsetLeft - viewportPadding;
    const availableRight = viewport.offsetLeft + viewport.width - rect.left - rect.width - viewportPadding;

    const requiredSpace: Record<GuidePlacement, number> = {
        top: cardHeight + spacing,
        bottom: cardHeight + spacing,
        left: cardWidth + spacing,
        right: cardWidth + spacing
    };
    const availableSpace: Record<GuidePlacement, number> = {
        top: availableTop,
        bottom: availableBottom,
        left: availableLeft,
        right: availableRight
    };

    if (availableSpace[preferredPlacement] >= requiredSpace[preferredPlacement]) {
        return preferredPlacement;
    }

    const rankedPlacements: GuidePlacement[] = ['bottom', 'top', 'right', 'left'];
    const sortedPlacements = rankedPlacements.sort((left, right) => {
        const leftOverflow = availableSpace[left] - requiredSpace[left];
        const rightOverflow = availableSpace[right] - requiredSpace[right];

        if (left === preferredPlacement) {
            return -1;
        }

        if (right === preferredPlacement) {
            return 1;
        }

        return rightOverflow - leftOverflow;
    });

    return sortedPlacements[0];
}

function getPlacementStyle(rect: RectState | null, placement: GuidePlacement, cardSize: GuideCardSize) {
    const viewport = getViewportMetrics();
    const viewportPadding = 16;
    const padding = 18;
    const maxWidth = Math.max(Math.min(viewport.width - 24, 360), 220);
    const minWidth = Math.min(280, maxWidth);
    const cardWidth = clamp(cardSize.width || maxWidth, minWidth, maxWidth);
    const maxHeight = Math.max(Math.min(viewport.height - viewportPadding * 2, 520), 180);
    const cardHeight = Math.min(cardSize.height || 308, maxHeight);
    const minTop = viewport.offsetTop + viewportPadding;
    const maxTop = viewport.offsetTop + viewport.height - cardHeight - viewportPadding;
    const minLeft = viewport.offsetLeft + viewportPadding;
    const maxLeft = viewport.offsetLeft + viewport.width - cardWidth - viewportPadding;
    const isCompactViewport = viewport.width < 960 || viewport.height < 780;

    if (!rect) {
        return {
            top: clamp(viewport.offsetTop + (viewport.height - cardHeight) / 2, minTop, maxTop),
            left: clamp(viewport.offsetLeft + (viewport.width - cardWidth) / 2, minLeft, maxLeft),
            width: cardWidth,
            maxHeight
        };
    }

    if (isCompactViewport) {
        return {
            top: clamp(viewport.offsetTop + viewport.height - cardHeight - viewportPadding, minTop, maxTop),
            left: clamp(viewport.offsetLeft + (viewport.width - cardWidth) / 2, minLeft, maxLeft),
            width: cardWidth,
            maxHeight
        };
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const resolvedPlacement = resolvePlacement(rect, placement, cardWidth, cardHeight, viewport);

    let top = rect.top + rect.height + padding;
    let left = centerX - cardWidth / 2;

    if (resolvedPlacement === 'top') {
        top = rect.top - cardHeight - padding;
        left = centerX - cardWidth / 2;
    }

    if (resolvedPlacement === 'right') {
        top = centerY - cardHeight / 2;
        left = rect.left + rect.width + padding;
    }

    if (resolvedPlacement === 'left') {
        top = centerY - cardHeight / 2;
        left = rect.left - cardWidth - padding;
    }

    const clampedTop = clamp(top, minTop, maxTop);
    const clampedLeft = clamp(left, minLeft, maxLeft);

    return {
        top: clampedTop,
        left: clampedLeft,
        width: cardWidth,
        maxHeight
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
    const [cardSize, setCardSize] = useState<GuideCardSize>({
        width: 0,
        height: 308
    });
    const guideCardRef = useRef<HTMLDivElement | null>(null);

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

        const targetElement = targetRef?.current;
        let resizeObserver: ResizeObserver | null = null;
        const settleTimeoutId = window.setTimeout(updateRect, 240);

        targetElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
        window.requestAnimationFrame(updateRect);
        window.requestAnimationFrame(() => window.requestAnimationFrame(updateRect));
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);
        window.visualViewport?.addEventListener('resize', updateRect);
        window.visualViewport?.addEventListener('scroll', updateRect);

        if (targetElement && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => updateRect());
            resizeObserver.observe(targetElement);
        }

        return () => {
            window.clearTimeout(settleTimeoutId);
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
            window.visualViewport?.removeEventListener('resize', updateRect);
            window.visualViewport?.removeEventListener('scroll', updateRect);
        };
    }, [open, targetRef]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const guideCard = guideCardRef.current;
        if (!guideCard) {
            return;
        }

        const updateCardSize = () => {
            const nextRect = guideCard.getBoundingClientRect();
            setCardSize({
                width: nextRect.width,
                height: nextRect.height
            });
        };

        updateCardSize();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateCardSize);
            return () => window.removeEventListener('resize', updateCardSize);
        }

        const resizeObserver = new ResizeObserver(() => updateCardSize());
        resizeObserver.observe(guideCard);
        window.addEventListener('resize', updateCardSize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateCardSize);
        };
    }, [currentStep, description, open, primaryAction?.label, purpose, secondaryAction?.label, title, totalSteps]);

    const cardStyle = useMemo(() => {
        if (!open || typeof window === 'undefined') {
            return undefined;
        }

        return getPlacementStyle(rect, placement, cardSize);
    }, [cardSize, open, placement, rect]);

    const highlightStyle = useMemo(() => {
        if (!open || !rect || typeof window === 'undefined') {
            return undefined;
        }

        const viewport = getViewportMetrics();
        const rawTop = rect.top - 6;
        const rawLeft = rect.left - 6;
        const rawBottom = rect.top + rect.height + 6;
        const rawRight = rect.left + rect.width + 6;
        const minTop = viewport.offsetTop + 4;
        const minLeft = viewport.offsetLeft + 4;
        const maxBottom = viewport.offsetTop + viewport.height - 4;
        const maxRight = viewport.offsetLeft + viewport.width - 4;
        const top = clamp(rawTop, minTop, maxBottom - 24);
        const left = clamp(rawLeft, minLeft, maxRight - 24);
        const bottom = clamp(rawBottom, top + 24, maxBottom);
        const right = clamp(rawRight, left + 24, maxRight);

        return {
            top,
            left,
            width: right - left,
            height: bottom - top
        };
    }, [open, rect]);

    if (!open) {
        return null;
    }

    const guideOverlay = (
        <div className="modal-backdrop-enter pointer-events-none fixed inset-0 z-[160]">
            <div className="absolute inset-0 bg-slate-950/7" />

            {highlightStyle && (
                <div
                    className="absolute rounded-[28px] border border-sky-300 bg-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_0_10px_rgba(14,165,233,0.08),0_18px_42px_rgba(14,165,233,0.16)] transition-all duration-200"
                    style={highlightStyle}
                />
            )}

            <div
                ref={guideCardRef}
                className="modal-panel-enter pointer-events-auto absolute rounded-[28px] border border-[var(--panel-border)] bg-[color:var(--panel-strong)]/97 p-4 shadow-[0_20px_44px_rgba(15,23,42,0.18)] backdrop-blur-md transition-all duration-200"
                style={{
                    ...cardStyle,
                    overflowY: 'auto'
                }}
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
                        <Button size="sm" onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
                            {primaryAction.label}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') {
        return guideOverlay;
    }

    return createPortal(guideOverlay, document.body);
}

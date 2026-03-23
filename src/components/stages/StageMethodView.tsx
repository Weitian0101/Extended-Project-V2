import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, Play, ScanSearch, ScrollText, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { SpotlightGuide } from '@/components/guide/SpotlightGuide';
import { Button } from '@/components/ui/Button';
import { MethodSplitView } from '@/components/tools/MethodSplitView';
import { useProjectData } from '@/hooks/useProjectData';
import { getGuideProgress } from '@/data/onboarding';
import { GuideFlowVariant, MethodCard, MethodCardLayout, OnboardingStepId, ProjectHubData, StageId, ToolRun } from '@/types';
import { METHOD_LIBRARY } from '@/data/methodLibrary';
import { STAGE_GUIDE_GROUPS } from '@/data/stageGuides';
import { clearStageMethodSession, loadStageMethodSession, saveStageMethodSession } from '@/lib/services/stageMethodSession';
import { cn } from '@/lib/utils';

type BrowsableStage = Extract<StageId, 'explore' | 'imagine' | 'implement' | 'tell-story'>;

interface StageMethodViewProps {
    projectId: string;
    projectName: string;
    hub: ProjectHubData;
    isHubLoading?: boolean;
    onCreateHubRecord: <TResource extends 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, payload: Record<string, unknown>) => Promise<unknown>;
    onUpdateHubRecord: <TResource extends 'cards' | 'artifacts' | 'decisions' | 'threads' | 'tasks'>(resource: TResource, id: string, payload: Record<string, unknown>) => Promise<unknown>;
    onDeleteHubRecord: (resource: 'cards' | 'artifacts' | 'decisions' | 'threads' | 'tasks', id: string) => Promise<unknown>;
    methodCardLayout?: MethodCardLayout;
    stage: BrowsableStage;
    stageTitle: string;
    entryHeadline: string;
    entrySummary: string;
    guideEyebrow?: string;
    guideTitle: string;
    guideDescription: string;
    methodsDescription: string;
    previewButtonLabel?: string;
    guideActionLabel?: string;
    guideImages: [string, string];
    entryImages?: [string, string];
    guideStep?: OnboardingStepId | null;
    guideVariant?: GuideFlowVariant | null;
    onGuideStepChange?: (step: OnboardingStepId | null) => void;
    onDismissGuide?: () => void;
}

const createToolRunRecord = (method: MethodCard, stage: BrowsableStage): ToolRun => {
    const createdAt = Date.now();

    return {
        id: uuidv4(),
        methodCardId: method.id,
        methodCardTitle: method.title,
        stage,
        createdAt,
        updatedAt: createdAt,
        aiResponses: []
    };
};

const STAGE_THEMES: Record<BrowsableStage, {
    label: string;
    accentText: string;
    accentDot: string;
    badge: string;
    panelGlow: string;
    orb: string;
    mesh: string;
    banner: string;
    bannerText: string;
    buttonText: string;
    border: string;
    hoverBorder: string;
    hoverText: string;
    softBg: string;
}> = {
    explore: {
        label: 'Discovery Layer',
        accentText: 'text-emerald-700',
        accentDot: 'bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.42)]',
        badge: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
        panelGlow: 'shadow-[0_28px_70px_rgba(16,185,129,0.12)]',
        orb: 'bg-emerald-400/22',
        mesh: 'from-emerald-500/18 via-cyan-400/8 to-transparent',
        banner: 'from-emerald-500 via-green-500 to-lime-400',
        bannerText: 'text-emerald-50',
        buttonText: 'text-emerald-700',
        border: 'border-emerald-100/80',
        hoverBorder: 'hover:border-emerald-300',
        hoverText: 'text-emerald-600',
        softBg: 'bg-emerald-50/70'
    },
    imagine: {
        label: 'Creative Layer',
        accentText: 'text-rose-700',
        accentDot: 'bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.42)]',
        badge: 'border-rose-100 bg-rose-50/80 text-rose-700',
        panelGlow: 'shadow-[0_28px_70px_rgba(244,63,94,0.12)]',
        orb: 'bg-rose-400/22',
        mesh: 'from-rose-500/18 via-orange-400/10 to-transparent',
        banner: 'from-rose-500 via-red-500 to-orange-400',
        bannerText: 'text-rose-50',
        buttonText: 'text-rose-700',
        border: 'border-rose-100/80',
        hoverBorder: 'hover:border-rose-300',
        hoverText: 'text-rose-600',
        softBg: 'bg-rose-50/70'
    },
    implement: {
        label: 'Execution Layer',
        accentText: 'text-amber-700',
        accentDot: 'bg-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.42)]',
        badge: 'border-amber-100 bg-amber-50/80 text-amber-700',
        panelGlow: 'shadow-[0_28px_70px_rgba(245,158,11,0.12)]',
        orb: 'bg-amber-400/22',
        mesh: 'from-amber-500/18 via-orange-400/10 to-transparent',
        banner: 'from-amber-500 via-orange-500 to-yellow-300',
        bannerText: 'text-amber-50',
        buttonText: 'text-amber-700',
        border: 'border-amber-100/80',
        hoverBorder: 'hover:border-amber-300',
        hoverText: 'text-amber-600',
        softBg: 'bg-amber-50/70'
    },
    'tell-story': {
        label: 'Narrative Layer',
        accentText: 'text-sky-700',
        accentDot: 'bg-sky-500 shadow-[0_0_16px_rgba(14,165,233,0.42)]',
        badge: 'border-sky-100 bg-sky-50/80 text-sky-700',
        panelGlow: 'shadow-[0_28px_70px_rgba(14,165,233,0.12)]',
        orb: 'bg-sky-400/22',
        mesh: 'from-sky-500/18 via-cyan-400/10 to-transparent',
        banner: 'from-sky-500 via-blue-500 to-cyan-300',
        bannerText: 'text-sky-50',
        buttonText: 'text-sky-700',
        border: 'border-sky-100/80',
        hoverBorder: 'hover:border-sky-300',
        hoverText: 'text-sky-600',
        softBg: 'bg-sky-50/70'
    }
};

export function StageMethodView({
    projectId,
    projectName,
    hub,
    isHubLoading = false,
    onCreateHubRecord,
    onUpdateHubRecord,
    onDeleteHubRecord,
    methodCardLayout = 'classic',
    stage,
    stageTitle,
    entryHeadline,
    entrySummary,
    guideEyebrow = 'Facilitator Guide',
    guideTitle,
    guideDescription,
    methodsDescription,
    previewButtonLabel = 'Preview Guide',
    guideActionLabel = 'View Guide',
    guideImages,
    entryImages,
    guideStep,
    guideVariant,
    onGuideStepChange,
    onDismissGuide
}: StageMethodViewProps) {
    const { project, updateProject } = useProjectData(projectId, projectName);
    const methods = useMemo(() => METHOD_LIBRARY.filter(method => method.stage === stage), [stage]);
    const methodsById = useMemo(() => new Map(methods.map(method => [method.id, method])), [methods]);
    const restoredSession = useMemo(() => loadStageMethodSession(projectId, stage), [projectId, stage]);
    const [viewState, setViewState] = useState<'entry' | 'tools' | 'workspace'>(() => restoredSession?.viewState ?? 'entry');
    const [showGuide, setShowGuide] = useState(false);
    const [activeMethod, setActiveMethod] = useState<MethodCard | null>(() => (
        restoredSession?.activeMethodId ? methodsById.get(restoredSession.activeMethodId) ?? null : null
    ));
    const [activeRunId, setActiveRunId] = useState<string | null>(() => restoredSession?.activeRunId ?? null);
    const [activeCategory, setActiveCategory] = useState<string>(() => restoredSession?.activeCategory ?? 'all');
    const [isOpening, setIsOpening] = useState(false);
    const openTimerRef = useRef<number | null>(null);
    const entryContentRef = useRef<HTMLDivElement | null>(null);
    const firstMethodCardRef = useRef<HTMLDivElement | null>(null);
    const guideSections = STAGE_GUIDE_GROUPS[stage].map(section => ({
        ...section,
        methods: section.methodIds
            .map(methodId => methodsById.get(methodId))
            .filter((method): method is MethodCard => Boolean(method))
    })).filter(section => section.methods.length > 0);
    const sectionIndexMap = new Map(guideSections.map((section, index) => [section.title, index + 1]));
    const orderedMethodIds = guideSections.flatMap(section => section.methods.map(method => method.id));
    const methodIndexMap = new Map(orderedMethodIds.map((id, index) => [id, index + 1]));
    const theme = STAGE_THEMES[stage];
    const introImages = entryImages || guideImages;
    const stageName = stageTitle.replace(' Stage', '');
    const isExploreGuide = stage === 'explore' && Boolean(guideVariant);
    const exploreHomeGuide = isExploreGuide && guideVariant ? getGuideProgress(guideVariant, 'explore-home') : null;
    const exploreCardGuide = isExploreGuide && guideVariant ? getGuideProgress(guideVariant, 'explore-card') : null;

    useEffect(() => {
        return () => {
            if (openTimerRef.current) {
                window.clearTimeout(openTimerRef.current);
            }
        };
    }, []);

    const resolvedActiveCategory = activeCategory === 'all' || guideSections.some(section => section.title === activeCategory)
        ? activeCategory
        : 'all';
    const resolvedActiveMethod = activeMethod ? methodsById.get(activeMethod.id) ?? null : null;
    const resolvedActiveRun = activeRunId
        ? project.toolRuns.find(toolRun => toolRun.id === activeRunId && toolRun.stage === stage) ?? null
        : null;
    const effectiveViewState = viewState === 'workspace' && (!resolvedActiveMethod || !resolvedActiveRun)
        ? 'tools'
        : viewState;

    useEffect(() => {
        if (effectiveViewState === 'entry' && resolvedActiveCategory === 'all') {
            clearStageMethodSession(projectId, stage);
            return;
        }

        saveStageMethodSession(projectId, stage, {
            viewState: effectiveViewState,
            activeMethodId: effectiveViewState === 'workspace' ? resolvedActiveMethod?.id ?? null : null,
            activeRunId: effectiveViewState === 'workspace' ? resolvedActiveRun?.id ?? null : null,
            activeCategory: resolvedActiveCategory
        });
    }, [effectiveViewState, projectId, resolvedActiveCategory, resolvedActiveMethod, resolvedActiveRun, stage]);

    const handleEnterAtlas = (nextGuideStep?: OnboardingStepId) => {
        if (isOpening) return;
        setIsOpening(true);

        openTimerRef.current = window.setTimeout(() => {
            setActiveMethod(null);
            setActiveRunId(null);
            setViewState('tools');
            if (nextGuideStep) {
                onGuideStepChange?.(nextGuideStep);
            }
            setIsOpening(false);
        }, 240);
    };

    const handleReturnToAtlas = () => {
        setActiveMethod(null);
        setActiveRunId(null);
        setViewState('tools');
    };

    const handleReturnToStageHome = () => {
        setActiveMethod(null);
        setActiveRunId(null);
        setActiveCategory('all');
        setViewState('entry');
    };

    const handleStartTool = (method: MethodCard) => {
        const existingRun = [...project.toolRuns]
            .filter((run) => run.methodCardId === method.id && run.stage === stage)
            .sort((left, right) => right.updatedAt - left.updatedAt)[0];
        const nextRun = existingRun || createToolRunRecord(method, stage);

        if (!existingRun) {
            updateProject({ toolRuns: [...project.toolRuns, nextRun] });
        }
        if (stage === 'explore' && guideStep === 'explore-card') {
            onGuideStepChange?.('card-pages');
        }
        setActiveMethod(method);
        setActiveRunId(nextRun.id);
        setViewState('workspace');
    };

    const handleSaveRun = (updates: Partial<ToolRun>) => {
        if (!activeRunId) return;

        updateProject({
            toolRuns: project.toolRuns.map(run =>
                run.id === activeRunId ? { ...run, ...updates, updatedAt: Date.now() } : run
            )
        });
    };

    const visibleSections = resolvedActiveCategory === 'all'
        ? guideSections
        : guideSections.filter(section => section.title === resolvedActiveCategory);

    if (effectiveViewState === 'workspace' && resolvedActiveMethod && resolvedActiveRun) {
        return (
            <MethodSplitView
                key={`${resolvedActiveMethod.id}-${resolvedActiveRun.id}`}
                card={resolvedActiveMethod}
                context={project.context}
                existingRun={resolvedActiveRun}
                hub={hub}
                isHubLoading={isHubLoading}
                onCreateHubRecord={onCreateHubRecord}
                onUpdateHubRecord={onUpdateHubRecord}
                onDeleteHubRecord={onDeleteHubRecord}
                onSave={handleSaveRun}
                onBack={handleReturnToAtlas}
                layout={methodCardLayout}
                guideStep={guideStep}
                guideVariant={guideVariant}
                onGuideStepChange={onGuideStepChange}
                onDismissGuide={onDismissGuide}
            />
        );
    }

    return (
        <div className="relative flex h-full flex-col overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className={cn('absolute -top-16 right-[-6rem] h-[24rem] w-[24rem] rounded-full blur-[110px]', theme.orb)} />
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', theme.mesh)} />
                <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,rgba(15,23,42,0.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.55)_1px,transparent_1px)] bg-[size:30px_30px]" />
            </div>

            <div className="surface-panel-strong relative z-10 flex h-20 shrink-0 items-center justify-between border-b px-4 lg:px-8">
                <div className="flex items-center gap-4">
                    <div className={cn('h-3 w-3 rounded-full', theme.accentDot)} />
                    <div>
                        <div className={cn('text-[11px] font-semibold uppercase tracking-[0.24em]', theme.accentText)}>{theme.label}</div>
                        <h2 className="text-lg font-display font-semibold text-[var(--foreground)] lg:text-2xl">{stageTitle}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {effectiveViewState === 'tools' && (
                        <Button size="sm" variant="secondary" onClick={handleReturnToStageHome}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to {stageName}
                        </Button>
                    )}
                    {effectiveViewState === 'entry' && (
                        <Button size="sm" onClick={() => handleEnterAtlas()}>
                            Open Atlas <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="scrollbar-none relative z-10 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
                {effectiveViewState === 'entry' && (
                    <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:gap-12">
                        <button
                            type="button"
                            onClick={() => handleEnterAtlas()}
                            className="group order-1 block w-full text-left outline-none focus-visible:rounded-[28px] focus-visible:ring-2 focus-visible:ring-slate-300/80 lg:order-2"
                            aria-label={`Open ${stageName} atlas`}
                        >
                            <div
                                className={cn(
                                    'relative mx-auto mt-8 min-h-[22rem] w-full max-w-[48rem] transition-all duration-300 lg:mt-0 lg:min-h-[40rem]',
                                    isOpening ? 'translate-y-2 scale-[1.01] opacity-0' : 'opacity-100'
                                )}
                            >
                                <div className="absolute right-[1%] top-[7%] z-10 h-[78%] w-[42%] overflow-hidden rounded-[22px] bg-white opacity-92 shadow-[0_20px_48px_rgba(15,23,42,0.12)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] rotate-[6deg] scale-[0.94] group-hover:right-[8%] group-hover:top-[1%] group-hover:z-30 group-hover:h-[98%] group-hover:w-[72%] group-hover:rotate-0 group-hover:scale-[1.02] group-hover:opacity-100 group-hover:shadow-[0_38px_92px_rgba(15,23,42,0.24)] group-focus-visible:right-[8%] group-focus-visible:top-[1%] group-focus-visible:z-30 group-focus-visible:h-[98%] group-focus-visible:w-[72%] group-focus-visible:rotate-0 group-focus-visible:scale-[1.02] group-focus-visible:opacity-100 group-focus-visible:shadow-[0_38px_92px_rgba(15,23,42,0.24)]">
                                    <Image
                                        src={introImages[1]}
                                        alt={`${stageTitle} intro 2`}
                                        fill
                                        sizes="(min-width: 1024px) 24vw, 48vw"
                                        className="object-contain p-3 lg:p-4"
                                        unoptimized
                                    />
                                </div>
                                <div className="absolute left-[2%] top-[1%] z-20 h-[96%] w-[62%] overflow-hidden rounded-[26px] bg-white shadow-[0_30px_74px_rgba(15,23,42,0.18)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] rotate-[-1.5deg] group-hover:left-[4%] group-hover:top-[14%] group-hover:z-10 group-hover:h-[78%] group-hover:w-[42%] group-hover:rotate-[-8deg] group-hover:scale-[0.9] group-hover:opacity-95 group-hover:shadow-[0_22px_46px_rgba(15,23,42,0.14)] group-focus-visible:left-[4%] group-focus-visible:top-[14%] group-focus-visible:z-10 group-focus-visible:h-[78%] group-focus-visible:w-[42%] group-focus-visible:rotate-[-8deg] group-focus-visible:scale-[0.9] group-focus-visible:opacity-95 group-focus-visible:shadow-[0_22px_46px_rgba(15,23,42,0.14)]">
                                    <Image
                                        src={introImages[0]}
                                        alt={`${stageTitle} intro 1`}
                                        fill
                                        sizes="(min-width: 1024px) 34vw, 72vw"
                                        priority
                                        className="object-contain p-4 lg:p-5"
                                        unoptimized
                                    />
                                </div>
                            </div>
                            <div className="relative mt-5 flex min-h-10 items-center justify-center text-sm font-medium text-[var(--foreground-soft)]">
                                <div className="flex items-center gap-3 transition-all duration-300 group-hover:-translate-y-2 group-hover:opacity-0 group-focus-visible:-translate-y-2 group-focus-visible:opacity-0">
                                    <span>Hover to bring the guide page forward.</span>
                                </div>
                                <div className={cn('pointer-events-none absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 translate-y-3 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100', theme.badge)}>
                                    Enter Atlas <ArrowRight className="h-4 w-4" />
                                </div>
                            </div>
                        </button>

                        <div ref={entryContentRef} className="order-2 flex flex-col justify-center lg:order-1">
                            <div className={cn('inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]', theme.badge)}>
                                {theme.label}
                            </div>
                            <h3 className="mt-5 max-w-lg text-4xl font-display font-semibold leading-[0.94] text-[var(--foreground)] lg:text-[3.35rem]">
                                {entryHeadline}
                            </h3>
                            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--foreground-soft)] lg:text-base">
                                {entrySummary}
                            </p>

                            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-soft)]">
                                <div className={cn('inline-flex items-center rounded-full border px-4 py-2 font-semibold', theme.badge)}>
                                    {methods.length} methods
                                </div>
                                <span>AI reference pages included</span>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <Button
                                    size="lg"
                                    onClick={() => handleEnterAtlas(guideStep === 'explore-home' ? 'explore-card' : undefined)}
                                >
                                    Open {stageName} Atlas <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button size="lg" variant="secondary" onClick={() => setShowGuide(true)}>
                                    {previewButtonLabel} <BookOpen className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {effectiveViewState === 'tools' && (
                    <div className="mx-auto max-w-6xl">
                        <div className={cn('surface-panel-strong mb-8 rounded-[32px] px-6 py-6 lg:px-8 lg:py-8', theme.panelGlow)}>
                            <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
                                <div>
                                    <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]', theme.badge)}>
                                        <ScanSearch className="h-3.5 w-3.5" />
                                        Method Atlas
                                    </div>
                                    <h3 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)]">
                                        {stageName} Methods
                                    </h3>
                                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)] lg:text-base">
                                        {methodsDescription}
                                    </p>
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <div className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold', theme.badge)}>
                                            {methods.length} methods loaded
                                        </div>
                                        <Button variant="secondary" onClick={() => setShowGuide(true)}>
                                            {guideActionLabel} <ScrollText className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveCategory('all')}
                                            className={cn(
                                                'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5',
                                                resolvedActiveCategory === 'all' ? theme.badge : 'border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)]'
                                            )}
                                        >
                                            All Sections
                                        </button>
                                        {guideSections.map(section => (
                                            <button
                                                key={section.title}
                                                type="button"
                                                onClick={() => setActiveCategory(section.title)}
                                                className={cn(
                                                    'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5',
                                                    resolvedActiveCategory === section.title ? theme.badge : 'border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)]'
                                                )}
                                        >
                                            {`${String(sectionIndexMap.get(section.title) || 0).padStart(2, '0')} ${section.title}`}
                                        </button>
                                    ))}
                                </div>
                                </div>

                                <div
                                    onClick={() => setShowGuide(true)}
                                    className={cn(
                                        'surface-panel relative overflow-hidden cursor-pointer rounded-[28px] border border-[var(--panel-border)] p-6 shadow-[0_22px_48px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-1 lg:p-7 dark:shadow-[0_28px_58px_rgba(2,6,23,0.28)]',
                                    )}
                                >
                                    <div className="flex h-full flex-col justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={cn('rounded-2xl border p-3', theme.border, theme.softBg)}>
                                                <BookOpen className={cn('h-7 w-7', theme.accentText)} />
                                            </div>
                                            <div>
                                                <div className={cn('text-[11px] font-semibold uppercase tracking-[0.24em]', theme.accentText)}>{guideEyebrow}</div>
                                                <h3 className="mt-2 text-2xl font-display font-semibold text-[var(--foreground)]">{guideTitle}</h3>
                                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)] lg:text-base">
                                                    {guideDescription}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn('inline-flex w-fit rounded-full border px-5 py-2 text-sm font-semibold', theme.border, theme.softBg, theme.accentText)}>
                                            {guideActionLabel}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10 pb-12">
                            {visibleSections.map(section => (
                                <section key={section.title}>
                                    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                                        <div>
                                            <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', theme.accentText)}>
                                                Guide Section
                                            </div>
                                            <h4 className="mt-2 text-2xl font-display font-semibold text-[var(--foreground)]">
                                                {`${String(sectionIndexMap.get(section.title) || 0).padStart(2, '0')} ${section.title}`}
                                            </h4>
                                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--foreground-soft)]">
                                                {section.description}
                                            </p>
                                        </div>
                                        <div className={cn('inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold', theme.badge)}>
                                            {section.methods.length} methods
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                        {section.methods.map(method => (
                                            <div
                                                key={method.id}
                                                ref={section.methods[0] === method && resolvedActiveCategory === 'all' ? firstMethodCardRef : null}
                                                onClick={() => handleStartTool(method)}
                                                className={cn(
                                                    'surface-panel group relative cursor-pointer overflow-hidden rounded-[28px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_60px_rgba(15,23,42,0.14)]',
                                                    theme.border,
                                                    theme.hoverBorder
                                                )}
                                            >
                                                <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100', theme.banner)} />
                                                <div className={cn('relative h-72 border-b', theme.softBg, theme.border)}>
                                                    <Image
                                                        src={method.image}
                                                        alt={method.title}
                                                        fill
                                                        sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 28vw, (min-width: 768px) 42vw, 100vw"
                                                        style={{ objectFit: 'contain' }}
                                                        className="p-4 transition-transform duration-300 group-hover:scale-[1.04]"
                                                        unoptimized
                                                    />
                                                </div>
                                                <div className="p-5">
                                                    <div className={cn('flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]', theme.accentText)}>
                                                        <span>{String(methodIndexMap.get(method.id) || 0).padStart(2, '0')}</span>
                                                        <span>{section.title}</span>
                                                    </div>
                                                    <h3 className="mt-3 text-xl font-display font-semibold leading-tight text-[var(--foreground)]">{method.title}</h3>
                                                    <p className="mt-3 min-h-[3.5rem] line-clamp-2 text-sm leading-relaxed text-[var(--foreground-soft)]">{method.purpose}</p>
                                                    <div className={cn('mt-4 flex items-center font-semibold opacity-0 transition-opacity group-hover:opacity-100', theme.hoverText)}>
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Start Method
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showGuide && (
                <div
                    className="modal-backdrop-enter absolute inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-md lg:p-8"
                    onClick={() => setShowGuide(false)}
                >
                    <div
                        className={cn('modal-panel-enter surface-panel-strong relative w-full max-w-7xl rounded-[32px] p-4 lg:p-6', theme.border)}
                        onClick={event => event.stopPropagation()}
                    >
                        <Button
                            variant="secondary"
                            className="absolute right-4 top-4 z-50"
                            onClick={() => setShowGuide(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {guideImages.map((image, index) => (
                                <div key={image} className={cn('relative min-h-[22rem] overflow-hidden rounded-[24px] border bg-slate-950/95 lg:min-h-[42rem]', theme.border)}>
                                    <Image
                                        src={image}
                                        alt={`${stageTitle} guide ${index + 1}`}
                                        fill
                                        sizes="(min-width: 1024px) 45vw, 100vw"
                                        style={{ objectFit: 'contain' }}
                                        className="p-4"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <SpotlightGuide
                open={isExploreGuide && guideStep === 'explore-home' && viewState === 'entry'}
                targetRef={entryContentRef}
                currentStep={exploreHomeGuide?.currentStep || 5}
                totalSteps={exploreHomeGuide?.totalSteps || 8}
                placement="bottom"
                title="Explore is the Beyond Post-its discovery deck"
                description="Beyond Post-its is Academy of Design Thinking's card-based method system for moving past loose sticky-note sessions into structured facilitation. Explore is the part of the deck that helps you frame the challenge, research people and context, and turn findings into insight."
                purpose="Start here when you need to understand the problem properly before ideating. The atlas gives you a browsable set of method cards you can open one by one."
                primaryAction={{
                    label: 'Open Explore Atlas',
                    onClick: () => handleEnterAtlas('explore-card')
                }}
                onBack={() => onGuideStepChange?.('overview')}
                onSkip={onDismissGuide}
            />
            <SpotlightGuide
                open={isExploreGuide && guideStep === 'explore-card' && effectiveViewState === 'tools'}
                targetRef={firstMethodCardRef}
                currentStep={exploreCardGuide?.currentStep || 6}
                totalSteps={exploreCardGuide?.totalSteps || 8}
                placement="right"
                title="Open a method card to start using the deck"
                description="Each card is a self-contained method. The front shows the method itself, and the AI page gives you prompt ideas for running it with more confidence."
                purpose="Choose a card to move from browsing the atlas into the actual method workspace. That is where you can switch between the front and AI prompt pages and work with the facilitator."
                primaryAction={methods[0] ? {
                    label: `Open "${methods[0].title}"`,
                    onClick: () => handleStartTool(methods[0])
                } : undefined}
                onBack={() => onGuideStepChange?.('explore-home')}
                onSkip={onDismissGuide}
            />
        </div>
    );
}



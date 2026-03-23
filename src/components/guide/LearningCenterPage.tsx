'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Check, CheckCircle2, CircleHelp, ExternalLink, GraduationCap, PlayCircle, Video } from 'lucide-react';

import { LEARNING_CATEGORIES } from '@/data/learningCenter';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { UserProfileData } from '@/types';

interface LearningCenterPageProps {
    profile: UserProfileData;
    onBack: () => void;
    onReplayOnboarding: () => void;
    onUpdateProfile: (updates: Partial<UserProfileData>) => void | Promise<void>;
    isSaving?: boolean;
}

export function LearningCenterPage({
    profile,
    onBack,
    onReplayOnboarding,
    onUpdateProfile
}: LearningCenterPageProps) {
    const firstName = profile.name.trim().split(/\s+/)[0] || 'there';
    const [activeCategoryId, setActiveCategoryId] = useState(LEARNING_CATEGORIES[0]?.id || '');
    const [activeLessonId, setActiveLessonId] = useState(LEARNING_CATEGORIES[0]?.lessons[0]?.id || '');
    const [tutorialMode, setTutorialMode] = useState<'text' | 'video'>('text');
    const helpTooltipsEnabled = profile.guidePreferences?.helpTooltipsEnabled !== false;
    const [helpMarkersEnabled, setHelpMarkersEnabled] = useState(helpTooltipsEnabled);

    const activeCategory = useMemo(
        () => LEARNING_CATEGORIES.find((category) => category.id === activeCategoryId) || LEARNING_CATEGORIES[0],
        [activeCategoryId]
    );
    const activeLesson = useMemo(
        () => activeCategory?.lessons.find((lesson) => lesson.id === activeLessonId) || activeCategory?.lessons[0],
        [activeCategory, activeLessonId]
    );

    React.useEffect(() => {
        setHelpMarkersEnabled(helpTooltipsEnabled);
    }, [helpTooltipsEnabled]);

    const handleHelpToggle = (nextValue: boolean) => {
        if (helpMarkersEnabled === nextValue) {
            return;
        }

        setHelpMarkersEnabled(nextValue);
        void Promise.resolve(onUpdateProfile({
            guidePreferences: {
                ...profile.guidePreferences,
                helpTooltipsEnabled: nextValue
            }
        }));
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_80%_16%,rgba(244,114,182,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,var(--body-top),var(--body-bottom))]" />

            <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button variant="secondary" onClick={onBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button onClick={onReplayOnboarding}>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Replay onboarding
                        </Button>
                    </div>

                    <section className="surface-panel-strong relative overflow-hidden rounded-[36px] p-7 lg:p-9">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_72%)]" />
                        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    Learning Center
                                </div>
                                <h1 className="mt-5 text-4xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">
                                    Learn the product by job, not by wall of text.
                                </h1>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--foreground-soft)]">
                                    Welcome back, {firstName}. Pick a part of the product, then open a short lesson inside it. Every lesson supports a text walkthrough now and keeps a space ready for a future video tutorial.
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <a
                                        href="https://www.academyofdesignthinking.com/beyond-post-its"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--panel-strong)]"
                                    >
                                        Read about Beyond Post-its
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-[26px] border border-[var(--panel-border)] bg-[var(--panel)] p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">How it works</div>
                                    <div className="mt-3 text-xl font-display font-semibold text-[var(--foreground)]">Choose a category</div>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                        Start broad, then open the exact lesson you need. This keeps the page readable instead of showing every tutorial at once.
                                    </p>
                                </div>
                                <div className="rounded-[26px] border border-[var(--panel-border)] bg-[var(--panel)] p-5">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">Tutorial modes</div>
                                    <div className="mt-3 text-xl font-display font-semibold text-[var(--foreground)]">Text now, video ready</div>
                                    <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                        Every lesson already has a written guide. Video slots are built in so links can be added later without redesigning the page.
                                    </p>
                                </div>
                                <div className="rounded-[26px] border border-[var(--panel-border)] bg-[var(--panel)] p-5 sm:col-span-2">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600">
                                                <CircleHelp className="h-4 w-4" />
                                                Question-mark help
                                            </div>
                                            <div className="mt-3 text-xl font-display font-semibold text-[var(--foreground)]">
                                                {helpMarkersEnabled ? 'Help markers are on' : 'Help markers are off'}
                                            </div>
                                            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                                Turn the small question-mark explanations on or off here too. The change also affects Hub and method cards.
                                            </p>
                                        </div>
                                        <AnimatedHelpCheckbox checked={helpMarkersEnabled} onChange={handleHelpToggle} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-4">
                        {LEARNING_CATEGORIES.map((category) => {
                            const isActive = category.id === activeCategoryId;

                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveCategoryId(category.id);
                                        setActiveLessonId(category.lessons[0]?.id || '');
                                        setTutorialMode('text');
                                    }}
                                    className={cn(
                                        'group relative overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-300',
                                        isActive
                                            ? 'border-slate-900 bg-slate-900 text-white shadow-[0_24px_52px_rgba(15,23,42,0.18)] dark:border-white dark:bg-white dark:text-slate-900'
                                            : 'border-[var(--panel-border)] bg-[var(--panel)] hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.1)]'
                                    )}
                                >
                                    <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90', category.accentClassName)} />
                                    <div className="relative">
                                        <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', isActive ? 'text-white/72 dark:text-slate-500' : 'text-[var(--foreground-muted)]')}>
                                            {category.label}
                                        </div>
                                        <div className="mt-3 text-2xl font-display font-semibold">{category.title}</div>
                                        <p className={cn('mt-3 text-sm leading-relaxed', isActive ? 'text-white/84 dark:text-slate-600' : 'text-[var(--foreground-soft)]')}>
                                            {category.summary}
                                        </p>
                                        <div className={cn('mt-5 text-xs font-semibold uppercase tracking-[0.18em]', isActive ? 'text-white/70 dark:text-slate-500' : 'text-[var(--foreground-muted)]')}>
                                            {category.lessons.length} lesson{category.lessons.length === 1 ? '' : 's'}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </section>

                    {activeCategory && (
                        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                            <div className="surface-panel-strong rounded-[32px] p-6">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Selected category</div>
                                <h2 className="mt-3 text-3xl font-display font-semibold text-[var(--foreground)]">{activeCategory.title}</h2>
                                <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)]">{activeCategory.summary}</p>

                                <div className="mt-6 space-y-3">
                                    {activeCategory.lessons.map((lesson) => {
                                        const isActive = lesson.id === activeLesson?.id;

                                        return (
                                            <button
                                                key={lesson.id}
                                                type="button"
                                                onClick={() => {
                                                    setActiveLessonId(lesson.id);
                                                    setTutorialMode('text');
                                                }}
                                                className={cn(
                                                    'w-full rounded-[24px] border px-4 py-4 text-left transition-all',
                                                    isActive
                                                        ? 'border-sky-500/30 bg-sky-500 text-white shadow-[0_20px_42px_rgba(14,165,233,0.2)]'
                                                        : 'border-[var(--panel-border)] bg-[var(--panel)] hover:-translate-y-0.5'
                                                )}
                                            >
                                                <div className={cn('text-[11px] font-semibold uppercase tracking-[0.22em]', isActive ? 'text-white/75' : 'text-[var(--foreground-muted)]')}>
                                                    Lesson
                                                </div>
                                                <div className="mt-2 text-lg font-display font-semibold">{lesson.title}</div>
                                                <p className={cn('mt-2 text-sm leading-relaxed', isActive ? 'text-white/84' : 'text-[var(--foreground-soft)]')}>
                                                    {lesson.summary}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {activeLesson && (
                                <div className="surface-panel-strong overflow-hidden rounded-[32px] p-6 lg:p-7">
                                    <div className="flex flex-col gap-5 border-b border-[var(--panel-border)] pb-6 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="max-w-3xl">
                                            <h3 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)]">{activeLesson.title}</h3>
                                            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)]">{activeLesson.summary}</p>
                                        </div>

                                        <div className="rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] p-3">
                                            <div className="inline-flex w-full rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setTutorialMode('text')}
                                                    className={cn(
                                                        'inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                                                        tutorialMode === 'text'
                                                            ? 'bg-sky-500 text-white shadow-[0_12px_24px_rgba(14,165,233,0.18)]'
                                                            : 'text-[var(--foreground-soft)] hover:text-[var(--foreground)]'
                                                    )}
                                                >
                                                    <BookOpen className="h-4 w-4" />
                                                    Written guide
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTutorialMode('video')}
                                                    className={cn(
                                                        'inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                                                        tutorialMode === 'video'
                                                            ? 'bg-rose-500 text-white shadow-[0_12px_24px_rgba(244,63,94,0.18)]'
                                                            : 'text-[var(--foreground-soft)] hover:text-[var(--foreground)]'
                                                    )}
                                                >
                                                    <Video className="h-4 w-4" />
                                                    Video slot
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        {tutorialMode === 'text' ? (
                                            <div className="grid gap-5">
                                                {activeLesson.textSections.map((section, index) => (
                                                    <div
                                                        key={section.id}
                                                        className="rounded-[30px] border border-[var(--panel-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.44),rgba(255,255,255,0.18))] p-7 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
                                                    >
                                                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold tracking-[0.04em] text-sky-700 dark:border-sky-400/18 dark:bg-sky-400/10 dark:text-sky-200">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Step {index + 1}
                                                        </div>
                                                        <h4 className="mt-5 text-[1.8rem] font-display font-semibold text-[var(--foreground)]">{section.title}</h4>
                                                        <p className="mt-4 text-[1.02rem] leading-relaxed text-[var(--foreground-soft)]">{section.body}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-[28px] border border-dashed border-[var(--panel-border)] bg-[var(--panel)] p-6 lg:p-7">
                                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--foreground-muted)]">
                                                    <Video className="h-3.5 w-3.5 text-rose-500" />
                                                    Video tutorial
                                                </div>
                                                <h4 className="mt-4 text-2xl font-display font-semibold text-[var(--foreground)]">
                                                    {activeLesson.videoUrl ? activeLesson.videoLabel || 'Open tutorial video' : 'Video link reserved'}
                                                </h4>
                                                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)]">
                                                    {activeLesson.videoUrl
                                                        ? 'Open the video tutorial in a new tab for a guided walkthrough.'
                                                        : 'This lesson is ready for a future recording. Until then, the written guide above stays as the main tutorial.'}
                                                </p>
                                                {activeLesson.videoUrl ? (
                                                    <a
                                                        href={activeLesson.videoUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--panel)]"
                                                    >
                                                        Open video
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                ) : (
                                                    <div className="mt-6 rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-4 text-sm text-[var(--foreground-soft)]">
                                                        Placeholder ready: add a video URL here when the recording is available.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

function AnimatedHelpCheckbox({
    checked,
    onChange
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-3 rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => void onChange(event.target.checked)}
                className="sr-only"
            />
            <span
                className={cn(
                    'relative inline-flex h-8 w-14 items-center rounded-full border transition-all duration-300',
                    checked
                        ? 'border-amber-400/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.95),rgba(249,115,22,0.82))] shadow-[0_10px_24px_rgba(245,158,11,0.22)]'
                        : 'border-[var(--panel-border)] bg-[var(--panel)]'
                )}
            >
                <span
                    className={cn(
                        'absolute left-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-amber-600 shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition-all duration-300 dark:bg-slate-900',
                        checked ? 'translate-x-6' : 'translate-x-0'
                    )}
                >
                    <Check className={cn('h-3.5 w-3.5 transition-all duration-200', checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0')} />
                </span>
            </span>
            <span>Show question-mark help</span>
        </label>
    );
}

'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, ExternalLink, GraduationCap, PlayCircle, Sparkles } from 'lucide-react';

import { QUICK_START_FLOW, LEARNING_SNAPSHOTS } from '@/data/learningCenter';
import { Button } from '@/components/ui/Button';
import { UserProfileData } from '@/types';

interface LearningCenterPageProps {
    profile: UserProfileData;
    onBack: () => void;
    onReplayOnboarding: () => void;
}

export function LearningCenterPage({
    profile,
    onBack,
    onReplayOnboarding
}: LearningCenterPageProps) {
    const firstName = profile.name.trim().split(/\s+/)[0] || 'there';

    return (
        <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_28%),linear-gradient(180deg,var(--body-top),var(--body-bottom))]" />

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

                    <section className="surface-panel-strong relative overflow-hidden rounded-[34px] p-7 lg:p-9">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_70%)]" />
                        <div className="relative grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    Learning Center
                                </div>
                                <h1 className="mt-5 text-4xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">
                                    Welcome back, {firstName}.
                                </h1>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--foreground-soft)]">
                                    This page is the fast refresher for how to use the platform in practice: where to start,
                                    what each area helps you do, and how Explore connects to the Beyond Post-its card deck.
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

                            <div className="grid gap-3 sm:grid-cols-2">
                                {QUICK_START_FLOW.slice(0, 4).map((item) => (
                                    <div key={item.id} className="rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
                                            {item.step}
                                        </div>
                                        <div className="mt-3 text-lg font-display font-semibold text-[var(--foreground)]">{item.title}</div>
                                        <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-5">
                        {QUICK_START_FLOW.map((item) => (
                            <article key={item.id} className="surface-panel rounded-[28px] p-5">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">{item.step}</div>
                                <h2 className="mt-3 text-xl font-display font-semibold text-[var(--foreground)]">{item.title}</h2>
                                <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)]">{item.description}</p>
                            </article>
                        ))}
                    </section>

                    <section className="surface-panel-strong rounded-[34px] p-6 lg:p-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Screenshot references
                                </div>
                                <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)]">Where things live</h2>
                                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--foreground-soft)] lg:text-base">
                                    Use these screenshots when you need a quick reminder of where something lives or what a stage looks like.
                                    They are designed for returning users who want to re-orient without replaying the full guide.
                                </p>
                            </div>
                            <Button variant="secondary" onClick={onReplayOnboarding}>
                                Replay the guided flow
                            </Button>
                        </div>

                        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {LEARNING_SNAPSHOTS.map((snapshot) => (
                                <article key={snapshot.id} className="surface-panel overflow-hidden rounded-[28px]">
                                    <div className="relative h-64 border-b border-[var(--panel-border)] bg-[var(--panel)]">
                                        <Image
                                            src={snapshot.image}
                                            alt={snapshot.title}
                                            fill
                                            sizes="(min-width: 1280px) 28vw, (min-width: 768px) 42vw, 100vw"
                                            className="object-contain p-4"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-xl font-display font-semibold text-[var(--foreground)]">{snapshot.title}</h3>
                                        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)]">{snapshot.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

'use client';

import React from 'react';
import Image from 'next/image';
import {
    ArrowRight,
    BookOpenText,
    CheckCircle2,
    Compass,
    Hammer,
    Layers3,
    Lightbulb,
    MessageSquareQuote,
    Play,
    Waypoints
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { ParticleField } from '@/components/ui/ParticleField';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface LandingPageProps {
    onNavigate: (view: 'auth' | 'sandbox') => void;
}

const STAGE_CARDS = [
    { title: 'Explore', description: 'Investigate context, users, assumptions, and opportunity areas.', color: 'text-emerald-600', border: 'border-emerald-200/80', glow: 'bg-emerald-400/18', icon: Compass },
    { title: 'Imagine', description: 'Generate concepts, test directions, and open up new creative territory.', color: 'text-rose-600', border: 'border-rose-200/80', glow: 'bg-rose-400/18', icon: Lightbulb },
    { title: 'Implement', description: 'Turn ideas into experiments, business models, pilots, and scalable systems.', color: 'text-amber-600', border: 'border-amber-200/80', glow: 'bg-amber-400/18', icon: Hammer },
    { title: 'Tell Story', description: 'Craft the narrative, evidence, and presentation that gets innovation adopted.', color: 'text-sky-600', border: 'border-sky-200/80', glow: 'bg-sky-400/18', icon: MessageSquareQuote }
];

const PARTNER_LOGOS = [
    { src: "/images/Partner/worldreader.avif", alt: "Worldreader", width: 160, height: 60 },
    { src: "/images/Partner/unfccc_undp.avif", alt: "UNFCCC UNDP", width: 220, height: 70 },
    { src: "/images/Partner/LBS.avif", alt: "London Business School", width: 140, height: 80 },
    { src: "/images/Partner/LoughboroughUniversity.avif", alt: "Loughborough University", width: 200, height: 70 },
    { src: "/images/Partner/EU-Commission.avif", alt: "EU Commission", width: 140, height: 70 },
    { src: "/images/Partner/LSE.avif", alt: "LSE", width: 140, height: 70 },
    { src: "/images/Partner/Arla.avif", alt: "Arla", width: 180, height: 74 },
    { src: "/images/Partner/JustEat.avif", alt: "Just Eat", width: 176, height: 72 },
    { src: "/images/Partner/JohnLewisPartnership.avif", alt: "John Lewis Partnership", width: 220, height: 70 },
    { src: "/images/Partner/AssociatedBritishFoods.avif", alt: "Associated British Foods", width: 200, height: 70 },
    { src: "/images/Partner/AmericanExpress.avif", alt: "American Express", width: 210, height: 70 },
    { src: "/images/Partner/LloydsBank.avif", alt: "Lloyds Bank", width: 200, height: 74 },
    { src: "/images/Partner/spar-atlantico.avif", alt: "SPAR Atlantico", width: 160, height: 70 }
];

export function LandingPage({ onNavigate }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-transparent text-[var(--foreground)]">
            <nav className="sticky top-0 z-50 px-4 py-4 lg:px-8">
                <div className="surface-panel-strong mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-3 lg:px-5">
                    <BrandLockup compact className="min-w-0" />
                    <div className="hidden items-center gap-6 lg:flex">
                        <a href="#sandbox-demo" className="text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]">Sandbox Demo</a>
                        <a href="#beyond-post-its" className="text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]">Beyond Post-its</a>
                        <a href="#workflow" className="text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]">Workflow</a>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-3">
                        <ThemeToggle compact />
                        <Button variant="outline" className="hidden lg:inline-flex" onClick={() => onNavigate('auth')}>
                            Sign In
                        </Button>
                        <Button onClick={() => onNavigate('auth')}>
                            Get Started <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="relative overflow-hidden px-4 pb-20 lg:px-8">
                <section className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-7xl items-center justify-center overflow-hidden pt-6 lg:pt-10">
                    <ParticleField variant="hero" className="pointer-events-none absolute inset-0 opacity-95" />
                    <div className="absolute inset-x-[18%] top-[18%] h-44 rounded-full bg-sky-300/18 blur-[120px]" />
                    <div className="absolute inset-x-[28%] bottom-[18%] h-36 rounded-full bg-amber-300/12 blur-[120px]" />

                    <div className="relative z-10 mx-auto max-w-4xl text-center">
                        <div className="eyebrow">Innovation Sandbox</div>
                        <h1 className="mt-6 text-5xl font-display font-semibold leading-[0.98] text-[var(--foreground)] lg:text-7xl">
                            Beyond Post-its, staged for real project work.
                        </h1>
                        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--foreground-soft)] lg:text-xl">
                            A guided sandbox for Explore, Imagine, Implement, and Tell Story with AI facilitation built in.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Button size="lg" onClick={() => onNavigate('auth')}>
                                Enter Sandbox <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <a
                                href="#beyond-post-its"
                                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-6 text-base font-medium text-[var(--foreground)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5"
                            >
                                Why it exists
                            </a>
                        </div>
                    </div>
                </section>

                <section id="sandbox-demo" className="mx-auto mt-8 max-w-7xl">
                    <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
                        <div className="surface-panel-strong rounded-[34px] p-6 lg:p-8">
                            <div className="eyebrow">Product Walkthrough</div>
                            <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">
                                Show the product in motion and let people understand the workflow quickly.
                            </h2>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--foreground-soft)] lg:text-lg">
                                Use this space for a concise walkthrough, product video, or guided capture of the core experience.
                            </p>
                            <div className="mt-6 space-y-3">
                                {[
                                    'Show how a project moves from context into Explore, Imagine, Implement, and Tell Story.',
                                    'Highlight the workspace, method library, and team collaboration flow.',
                                    'Keep onboarding short by showing the product directly instead of over-explaining it.'
                                ].map(item => (
                                    <div key={item} className="flex items-start gap-3 rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                                        <span className="text-sm leading-relaxed text-[var(--foreground-soft)]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="surface-panel-strong rounded-[34px] p-4 lg:p-6">
                            <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
                                <div className="surface-contrast relative overflow-hidden rounded-[28px] p-5">
                                    <div className="relative flex h-full flex-col justify-between">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-[0.24em] text-white/60">Feature Walkthrough</div>
                                            <div className="mt-2 text-2xl font-display font-semibold text-white">Product video / narrated overview</div>
                                            <div className="mt-3 max-w-md text-sm leading-relaxed text-white/76">
                                                Use a concise demo to show the book entry interaction, the method browser, the AI prompt board, and the context-aware workspace.
                                            </div>
                                        </div>
                                        <div className="mt-10 rounded-[24px] border border-white/10 bg-white/6 p-5">
                                            <div className="flex items-center gap-3 text-white">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950">
                                                    <Play className="ml-0.5 h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold">Watch overview</div>
                                                    <div className="text-xs text-white/60">Suggested duration: 45 to 90 seconds</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div className="surface-panel rounded-[24px] p-4">
                                        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Capture Slot</div>
                                        <div className="mt-2 text-base font-display font-semibold text-[var(--foreground)]">Stage navigation</div>
                                        <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">Show the colored stage system, profile area, and theme switching.</div>
                                    </div>
                                    <div className="surface-panel rounded-[24px] p-4">
                                        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Capture Slot</div>
                                        <div className="mt-2 text-base font-display font-semibold text-[var(--foreground)]">Method detail</div>
                                        <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">Highlight the reference deck, AI prompts, and stage-specific visual language.</div>
                                    </div>
                                    <div className="surface-panel rounded-[24px] p-4">
                                        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Capture Slot</div>
                                        <div className="mt-2 text-base font-display font-semibold text-[var(--foreground)]">Context memory</div>
                                        <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">Show how project context stays connected to later facilitation runs.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="beyond-post-its" className="mx-auto mt-20 max-w-7xl">
                    <div className="surface-panel-strong rounded-[36px] px-6 py-8 lg:px-10 lg:py-10">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="eyebrow">What Is Beyond Post-its?</div>
                                <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">
                                    A reusable digital operating layer for the Academy&apos;s design thinking card deck.
                                </h2>
                            </div>
                            <a
                                href="https://www.academyofdesignthinking.com/beyond-post-its"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-5 text-sm font-medium text-[var(--foreground)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5"
                            >
                                Official Source <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </div>

                        <div className="mt-6 grid gap-5 lg:grid-cols-3">
                            <div className="surface-panel rounded-[28px] p-5">
                                <BookOpenText className="h-6 w-6 text-sky-500" />
                                <h3 className="mt-4 text-xl font-display font-semibold text-[var(--foreground)]">Digital version of the card pack</h3>
                                <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                    Beyond Post-its extends the Academy of Design Thinking&apos;s physical design thinking cards into a digital format that can be revisited repeatedly.
                                </p>
                            </div>
                            <div className="surface-panel rounded-[28px] p-5">
                                <Layers3 className="h-6 w-6 text-rose-500" />
                                <h3 className="mt-4 text-xl font-display font-semibold text-[var(--foreground)]">Built for repeated facilitation</h3>
                                <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                    The deck is intended for workshops, meetings, and group activities, so facilitators can use the same method system again and again without losing consistency.
                                </p>
                            </div>
                            <div className="surface-panel rounded-[28px] p-5">
                                <Waypoints className="h-6 w-6 text-amber-500" />
                                <h3 className="mt-4 text-xl font-display font-semibold text-[var(--foreground)]">Mapped to the design thinking flow</h3>
                                <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                    This sandbox turns that deck into a structured workflow across Explore, Imagine, Implement, and Tell Story, with references and AI prompts attached to each method.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="workflow" className="mx-auto mt-20 max-w-7xl">
                    <div className="mb-10 max-w-3xl">
                        <div className="eyebrow">Workflow Architecture</div>
                        <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">
                            One visual system, four stages, and clearer movement from facilitation to action.
                        </h2>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-4">
                        {STAGE_CARDS.map(stage => {
                            const Icon = stage.icon;

                            return (
                                <div key={stage.title} className={`surface-panel relative overflow-hidden rounded-[30px] border ${stage.border} p-6`}>
                                    <div className={`absolute right-[-1.2rem] top-[-1.2rem] h-24 w-24 rounded-full blur-3xl ${stage.glow}`} />
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-white/78 ${stage.border}`}>
                                        <Icon className={`h-5 w-5 ${stage.color}`} />
                                    </div>
                                    <h3 className="mt-5 text-2xl font-display font-semibold text-[var(--foreground)]">{stage.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)]">{stage.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="mx-auto mt-20 max-w-7xl overflow-hidden rounded-[36px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-10 backdrop-blur-2xl lg:px-8">
                    <div className="text-center">
                        <div className="eyebrow">Trusted Context</div>
                        <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)]">Used with global innovators and institutional partners</h2>
                    </div>
                    <div className="relative mt-10 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--panel)] to-transparent" />
                        <div className="absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--panel)] to-transparent" />
                        <div className="marquee-track flex min-w-max items-center gap-12">
                            {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, index) => (
                                <div
                                    key={`${logo.alt}-${index}`}
                                    className="relative flex h-20 w-[12rem] shrink-0 items-center justify-center rounded-[24px] border border-[var(--panel-border)] bg-white/85 px-5 py-4 opacity-80 shadow-[0_18px_32px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100"
                                >
                                    <Image
                                        src={logo.src}
                                        alt={logo.alt}
                                        width={logo.width}
                                        height={logo.height}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="px-4 pb-8 pt-12 lg:px-8">
                <div className="surface-panel-strong mx-auto flex max-w-7xl flex-col gap-8 rounded-[34px] px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                    <div className="max-w-xl">
                        <BrandLockup compact />
                        <p className="mt-5 text-sm leading-relaxed text-[var(--foreground-soft)]">
                            A lighter interface for Beyond Post-its, AI-supported facilitation, and project-based innovation work.
                        </p>
                    </div>
                    <div className="grid gap-2 text-sm text-[var(--foreground-soft)]">
                        <div className="font-semibold text-[var(--foreground)]">Academy of Design Thinking</div>
                        <a
                            href="https://www.academyofdesignthinking.com/beyond-post-its"
                            target="_blank"
                            rel="noreferrer"
                            className="transition-colors hover:text-[var(--foreground)]"
                        >
                            beyond-post-its methodology
                        </a>
                        <div>Designed as a cleaner digital layer for facilitation, reference, and team collaboration.</div>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                .marquee-track {
                    animation: marquee 32s linear infinite;
                }
            `}</style>
        </div>
    );
}

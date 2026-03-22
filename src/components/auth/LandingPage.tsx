'use client';

import React from 'react';
import Image from 'next/image';
import {
    ArrowRight,
    ArrowUpRight,
    BookOpenText,
    Compass,
    Hammer,
    Layers3,
    Lightbulb,
    MessageSquareQuote,
    MonitorPlay,
    Waypoints
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { ParticleField } from '@/components/ui/ParticleField';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface LandingPageProps {
    onNavigate: (view: 'auth' | 'sandbox') => void;
}

const STAGE_CARDS = [
    { title: 'Explore', description: 'Investigate context, users, assumptions, and opportunity areas.', color: 'text-emerald-600', border: 'border-emerald-200/80', glow: 'bg-emerald-400/18', icon: Compass },
    { title: 'Imagine', description: 'Generate concepts, test directions, and open up new creative territory.', color: 'text-rose-600', border: 'border-rose-200/80', glow: 'bg-rose-400/18', icon: Lightbulb },
    { title: 'Implement', description: 'Turn ideas into experiments, business models, pilots, and scalable systems.', color: 'text-amber-600', border: 'border-amber-200/80', glow: 'bg-amber-400/18', icon: Hammer },
    { title: 'Tell Story', description: 'Craft the narrative, evidence, and presentation that gets innovation adopted.', color: 'text-sky-600', border: 'border-sky-200/80', glow: 'bg-sky-400/18', icon: MessageSquareQuote }
];

const HERO_TITLE = 'Beyond Post-its, staged for real project work.';

const SHOWCASE_VIDEOS = [
    {
        id: 'platform-demo',
        label: 'Platform demo',
        title: 'Sandbox workflow recording',
        note: 'Reserved for a guided product screen recording once the walkthrough is ready.',
        embedUrl: null
    },
    {
        id: 'academy-intro',
        label: 'Academy intro',
        title: 'Design Thinking | Academy of Design Thinking',
        note: 'A short Academy introduction to the mindset behind the work.',
        embedUrl: 'https://www.youtube-nocookie.com/embed/pwkXYlQYI4o?rel=0'
    },
    {
        id: 'business-show',
        label: 'Business show',
        title: 'Julia Goga-Cooke at The Business Show',
        note: 'A fast overview of the Academy, its positioning, and its offer.',
        embedUrl: 'https://www.youtube-nocookie.com/embed/OL8OiuybKUc?rel=0'
    }
] as const;

const PARTNER_LOGOS = [
    { src: '/images/Partner/worldreader.avif', alt: 'Worldreader', width: 180, height: 64, imageClassName: 'scale-[1.08]' },
    { src: '/images/Partner/unfccc_undp.avif', alt: 'UNFCCC UNDP', width: 246, height: 74, imageClassName: 'scale-[1.08]' },
    { src: '/images/Partner/LBS.avif', alt: 'London Business School', width: 158, height: 84, imageClassName: 'scale-[1.1]' },
    { src: '/images/Partner/LoughboroughUniversity.avif', alt: 'Loughborough University', width: 226, height: 74, imageClassName: 'scale-[1.12]' },
    { src: '/images/Partner/EU-Commission.avif', alt: 'EU Commission', width: 156, height: 74, imageClassName: 'scale-[1.14]' },
    { src: '/images/Partner/LSE.avif', alt: 'LSE', width: 156, height: 74, imageClassName: 'scale-[1.16]' },
    { src: '/images/Partner/Arla.avif', alt: 'Arla', width: 190, height: 82, imageClassName: 'scale-[1.06]' },
    { src: '/images/Partner/JustEat.avif', alt: 'Just Eat', width: 188, height: 82, imageClassName: 'scale-[1.04]' },
    { src: '/images/Partner/JohnLewisPartnership.avif', alt: 'John Lewis Partnership', width: 250, height: 82, imageClassName: 'scale-[1.08]' },
    { src: '/images/Partner/AssociatedBritishFoods.avif', alt: 'Associated British Foods', width: 188, height: 88, imageClassName: 'scale-[1.28]' },
    { src: '/images/Partner/AmericanExpress.avif', alt: 'American Express', width: 230, height: 82, imageClassName: 'scale-[1.18]' },
    { src: '/images/Partner/LloydsBank.avif', alt: 'Lloyds Bank', width: 206, height: 82, imageClassName: 'scale-[1.04]' },
    { src: '/images/Partner/spar-atlantico.avif', alt: 'SPAR Atlantico', width: 174, height: 82, imageClassName: 'scale-[1.16]' }
];

export function LandingPage({ onNavigate }: LandingPageProps) {
    const [activeVideoId, setActiveVideoId] = React.useState<(typeof SHOWCASE_VIDEOS)[number]['id']>(SHOWCASE_VIDEOS[0].id);
    const [typedHeroTitle, setTypedHeroTitle] = React.useState('');
    const [showHeroSupport, setShowHeroSupport] = React.useState(false);
    const activeVideo = SHOWCASE_VIDEOS.find((video) => video.id === activeVideoId) || SHOWCASE_VIDEOS[0];

    React.useEffect(() => {
        document.body.classList.add('landing-no-grid');

        return () => {
            document.body.classList.remove('landing-no-grid');
        };
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            setTypedHeroTitle(HERO_TITLE);
            setShowHeroSupport(true);
            return;
        }

        setTypedHeroTitle('');
        setShowHeroSupport(false);

        const typingStartDelay = 140;
        const characterDelay = 34;
        let characterIndex = 0;
        let typingTimer: number | undefined;
        let revealTimer: number | undefined;

        const typeNextCharacter = () => {
            characterIndex += 1;
            setTypedHeroTitle(HERO_TITLE.slice(0, characterIndex));

            if (characterIndex < HERO_TITLE.length) {
                typingTimer = window.setTimeout(typeNextCharacter, characterDelay);
                return;
            }

            revealTimer = window.setTimeout(() => {
                setShowHeroSupport(true);
            }, 180);
        };

        typingTimer = window.setTimeout(typeNextCharacter, typingStartDelay);

        return () => {
            if (typingTimer) {
                window.clearTimeout(typingTimer);
            }

            if (revealTimer) {
                window.clearTimeout(revealTimer);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-transparent text-[var(--foreground)]">
            <nav className="sticky top-0 z-50 px-4 py-4 lg:px-8">
                <div className="surface-panel-strong mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full px-4 py-3 lg:px-5">
                    <BrandLockup compact framed={false} className="min-w-0" />
                    <div className="hidden items-center gap-6 lg:flex">
                        <a href="#sandbox-demo" className="text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]">Sandbox Demo</a>
                        <a href="#beyond-post-its" className="text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]">Beyond Post-its</a>
                        <a href="#workflow" className="text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]">Workflow</a>
                        <a
                            href="https://www.academyofdesignthinking.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:text-[var(--foreground)]"
                        >
                            ADT Homepage
                        </a>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-3">
                        <ThemeToggle compact />
                        <Button variant="brand" onClick={() => onNavigate('auth')}>
                            Get Started <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="relative overflow-hidden px-4 pb-20 lg:px-8">
                <section className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-7xl items-center justify-center overflow-hidden pb-10 pt-3 lg:pb-14 lg:pt-0">
                    <ParticleField variant="hero" className="pointer-events-none absolute inset-0 opacity-95" />
                    <div className="animate-hero-aurora absolute inset-x-[18%] top-[18%] h-44 rounded-full bg-sky-300/24 blur-[120px]" />
                    <div
                        className="animate-hero-aurora absolute inset-x-[28%] bottom-[18%] h-36 rounded-full bg-amber-300/18 blur-[120px]"
                        style={{ animationDelay: '-3.4s' }}
                    />

                    <div className="relative z-10 mx-auto max-w-4xl text-center lg:-translate-y-[3.5vh]">
                        <div
                            className={cn('eyebrow mx-auto mb-6 w-fit opacity-0', showHeroSupport && 'animate-hero-rise')}
                            style={showHeroSupport ? { animationDelay: '40ms' } : undefined}
                        >
                            Innovation Sandbox
                        </div>
                        <h1
                            aria-label={HERO_TITLE}
                            className="relative text-5xl font-display font-semibold leading-[0.98] text-[var(--foreground)] lg:text-7xl"
                        >
                            <span className="invisible block">{HERO_TITLE}</span>
                            <span aria-hidden="true" className="absolute inset-0 block">
                                {typedHeroTitle}
                                {typedHeroTitle.length < HERO_TITLE.length && <span className="hero-typing-caret ml-1" />}
                            </span>
                        </h1>
                        <p
                            className={cn(
                                'mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--foreground-soft)] opacity-0 lg:text-xl',
                                showHeroSupport && 'animate-hero-rise'
                            )}
                            style={showHeroSupport ? { animationDelay: '140ms' } : undefined}
                        >
                            A guided sandbox for Explore, Imagine, Implement, and Tell Story with AI facilitation built in.
                        </p>

                        <div
                            className={cn(
                                'mt-8 flex flex-col items-center justify-center gap-3 opacity-0 sm:flex-row',
                                showHeroSupport && 'animate-hero-rise'
                            )}
                            style={showHeroSupport ? { animationDelay: '240ms' } : undefined}
                        >
                            <Button variant="brand" size="lg" onClick={() => onNavigate('auth')}>
                                Enter Sandbox <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <a
                                href="#beyond-post-its"
                                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-6 text-base font-medium text-[var(--foreground)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5"
                            >
                                Why it exists
                            </a>
                        </div>

                        <div
                            className={cn(
                                'mx-auto mt-10 h-px w-40 rounded-full bg-gradient-to-r from-transparent via-sky-400/85 to-transparent opacity-0',
                                showHeroSupport && 'animate-hero-rise animate-soft-float'
                            )}
                            style={showHeroSupport ? { animationDelay: '320ms' } : undefined}
                        />
                    </div>
                </section>

                <section id="sandbox-demo" className="mx-auto mt-6 max-w-7xl">
                    <div className="surface-panel-strong rounded-[34px] p-5 lg:p-8">
                        <div className="max-w-3xl">
                            <div className="eyebrow">Product Walkthrough</div>
                            <h2 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-5xl">
                                See the workflow in motion.
                            </h2>
                        </div>

                        <div className="mt-5 grid gap-2 lg:grid-cols-3">
                            {SHOWCASE_VIDEOS.map((video) => {
                                const isActive = video.id === activeVideo.id;

                                return (
                                    <button
                                        key={video.id}
                                        type="button"
                                        onClick={() => setActiveVideoId(video.id)}
                                        className={`rounded-[20px] border px-4 py-3 text-left transition-all duration-200 ${isActive
                                            ? 'border-sky-300/70 bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(59,130,246,0.06))] shadow-[0_16px_32px_rgba(14,165,233,0.1)]'
                                            : 'border-[var(--panel-border)] bg-[var(--panel)] hover:border-slate-300/80 hover:bg-[var(--panel-strong)]'
                                            }`}
                                    >
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                                            {video.label}
                                        </div>
                                        <div className="mt-1.5 text-base font-display font-semibold text-[var(--foreground)] lg:text-[1.05rem]">
                                            {video.title}
                                        </div>
                                        <div className="mt-1.5 text-xs leading-relaxed text-[var(--foreground-soft)] lg:text-[13px]">
                                            {video.note}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 overflow-hidden rounded-[30px] border border-[var(--panel-border)] bg-[linear-gradient(180deg,#030712,#0f172a)] shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
                            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 text-white lg:flex-row lg:items-center lg:justify-between lg:px-6">
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Now playing</div>
                                    <div className="mt-2 text-lg font-display font-semibold lg:text-2xl">{activeVideo.title}</div>
                                </div>
                                <div className="text-sm text-white/68">
                                    {activeVideo.note}
                                </div>
                            </div>
                            <div className="aspect-[16/10] w-full bg-black lg:aspect-[16/8.2]">
                                {activeVideo.embedUrl ? (
                                    <iframe
                                        key={activeVideo.id}
                                        src={activeVideo.embedUrl}
                                        title={activeVideo.title}
                                        className="h-full w-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="relative flex h-full items-center justify-center overflow-hidden px-6 py-8">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2),transparent_34%),linear-gradient(180deg,#030712,#0f172a)]" />
                                        <div className="relative mx-auto max-w-2xl text-center text-white">
                                            <div className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                                                Recording slot
                                            </div>
                                            <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/12 bg-white/10 shadow-[0_22px_60px_rgba(56,189,248,0.14)]">
                                                <MonitorPlay className="h-9 w-9 text-sky-300" />
                                            </div>
                                            <div className="mt-6 text-2xl font-display font-semibold lg:text-4xl">
                                                Drop the platform walkthrough here next.
                                            </div>
                                            <div className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/68 lg:text-base">
                                                Use this slot for a full screen recording that shows the flow from dashboard to project hub, stage work, and AI-supported facilitation.
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                Official Source <ArrowUpRight className="ml-2 h-4 w-4" />
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
                        {STAGE_CARDS.map((stage) => {
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
                        <div className="marquee-track flex min-w-max items-center gap-5 lg:gap-6">
                            {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, index) => {
                                const mobileWidth = Math.round((logo.width / logo.height) * 66);
                                const desktopWidth = Math.round((logo.width / logo.height) * 74);

                                return (
                                    <div
                                        key={`${logo.alt}-${index}`}
                                        className="relative h-[4.15rem] w-[var(--logo-width)] shrink-0 opacity-78 transition-opacity duration-300 hover:opacity-100 lg:h-[4.65rem] lg:w-[var(--logo-width-lg)]"
                                        style={{ '--logo-width': `${mobileWidth}px`, '--logo-width-lg': `${desktopWidth}px` } as React.CSSProperties}
                                    >
                                        <Image
                                            src={logo.src}
                                            alt={logo.alt}
                                            fill
                                            sizes="(min-width: 1024px) 220px, 180px"
                                            style={{ objectFit: 'contain', objectPosition: 'center' }}
                                            className={logo.imageClassName}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="px-4 pb-8 pt-12 lg:px-8">
                <div className="surface-panel-strong mx-auto flex max-w-7xl flex-col gap-8 rounded-[34px] px-6 py-8 lg:flex-row lg:items-start lg:justify-between lg:px-8">
                    <div className="max-w-xl">
                        <BrandLockup compact />
                        <p className="mt-5 text-sm leading-relaxed text-[var(--foreground-soft)]">
                            A lighter interface for Beyond Post-its, AI-supported facilitation, and project-based innovation work.
                        </p>
                    </div>

                    <div className="min-w-0 lg:max-w-sm">
                        <div className="eyebrow">Contact Us</div>
                        <div className="mt-4 space-y-1 text-sm leading-relaxed text-[var(--foreground-soft)]">
                            <div>Somerset House Exchange, Strand,</div>
                            <div>London WC2R 1LA</div>
                            <div>England, United Kingdom</div>
                        </div>
                        <div className="mt-4 text-sm text-[var(--foreground-soft)]">
                            Email:{' '}
                            <a
                                href="mailto:juliana@academyofdesignthinking.com"
                                className="font-medium text-[var(--foreground)] underline decoration-sky-400/45 underline-offset-4 transition-colors hover:text-sky-600"
                            >
                                juliana@academyofdesignthinking.com
                            </a>
                        </div>
                        <a
                            href="https://www.academyofdesignthinking.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-5 text-sm font-medium text-[var(--foreground)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5"
                        >
                            Visit ADT homepage <ArrowUpRight className="ml-2 h-4 w-4" />
                        </a>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                .marquee-track {
                    animation: marquee 46s linear infinite;
                }
            `}</style>
        </div>
    );
}

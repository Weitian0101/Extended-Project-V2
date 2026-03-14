'use client';

import React, { useState } from 'react';
import { ArrowLeft, Github, Sparkles } from 'lucide-react';

import { BrandLockup } from '@/components/ui/BrandLockup';
import { Button } from '@/components/ui/Button';
import { ParticleField } from '@/components/ui/ParticleField';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AuthPageProps {
    onBack: () => void;
    onComplete: () => void;
}

export function AuthPage({ onBack, onComplete }: AuthPageProps) {
    const [mode, setMode] = useState<'signin' | 'register'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            onComplete();
        }, 1000);
    };

    return (
        <div className="relative min-h-screen overflow-hidden px-4 py-6 lg:px-8">
            <ParticleField className="opacity-75" />
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6 lg:gap-8">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <ThemeToggle compact />
                </div>

                <div className="grid flex-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                    <div className="surface-panel relative overflow-hidden rounded-[34px] p-6 lg:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.1),transparent_34%)]" />
                        <div className="relative flex h-full flex-col justify-between">
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.26em] text-[var(--foreground-muted)]">Sandbox Access</div>
                                <h1 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-4xl">
                                    Sign in and continue your project.
                                </h1>
                                <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--foreground-soft)]">
                                    Open the workspace, review the card deck, and move into Explore, Imagine, Implement, or Tell Story.
                                </p>
                            </div>

                            <div className="hidden rounded-[28px] border border-[var(--panel-border)] bg-white/70 p-5 sm:block">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-[var(--foreground)]">Simple access, less noise</div>
                                        <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                            The first screen only needs the essentials: sign in, enter the workspace, and keep moving.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="surface-panel-strong flex items-center justify-center rounded-[34px] p-4 lg:p-8">
                        <div className="w-full max-w-md">
                            <BrandLockup compact className="mb-8" />

                            <div className="mb-8">
                                <h2 className="text-3xl font-display font-semibold text-[var(--foreground)]">
                                    {mode === 'signin' ? 'Welcome back' : 'Create your workspace'}
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                    Use a simple mocked sign-in for now. The UI is ready for a real auth provider later.
                                </p>
                            </div>

                            <div className="mb-8 grid grid-cols-2 gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] p-1">
                                <button
                                    type="button"
                                    onClick={() => setMode('signin')}
                                    className={`rounded-full px-4 py-3 text-sm font-semibold transition-all ${mode === 'signin' ? 'border border-sky-500/20 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_16px_24px_rgba(37,99,235,0.18)]' : 'text-[var(--foreground-soft)]'}`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('register')}
                                    className={`rounded-full px-4 py-3 text-sm font-semibold transition-all ${mode === 'register' ? 'border border-sky-500/20 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_16px_24px_rgba(37,99,235,0.18)]' : 'text-[var(--foreground-soft)]'}`}
                                >
                                    Register
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        autoComplete="email"
                                        className="w-full rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--foreground-muted)] focus:border-sky-400 focus:bg-[var(--panel-strong)] focus:ring-4 focus:ring-sky-400/10"
                                        placeholder="innovator@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                                        className="w-full rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--foreground-muted)] focus:border-sky-400 focus:bg-[var(--panel-strong)] focus:ring-4 focus:ring-sky-400/10"
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>

                                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Processing...' : mode === 'signin' ? 'Enter Sandbox' : 'Create Workspace'}
                                </Button>
                            </form>

                            <div className="mt-8 border-t border-[var(--panel-border)] pt-6">
                                <div className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                    Or connect with
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]">
                                        <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 7.373-2.36 3.213-3.008 2.55-9.12 2.55-9.12h-8" fill="currentColor" /></svg>
                                        Google
                                    </button>
                                    <button className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]">
                                        <Github className="h-4 w-4" />
                                        GitHub
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

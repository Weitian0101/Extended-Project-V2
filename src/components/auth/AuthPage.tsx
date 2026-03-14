'use client';

import React, { useState } from 'react';
import { ArrowLeft, Github } from 'lucide-react';

import { BrandLockup } from '@/components/ui/BrandLockup';
import { Button } from '@/components/ui/Button';
import { ParticleField } from '@/components/ui/ParticleField';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AuthPageProps {
    onBack: () => void;
    onComplete?: () => void;
    authMode?: 'local' | 'supabase';
    showRegister?: boolean;
    infoMessage?: string | null;
    errorMessage?: string | null;
    onCredentialsSubmit?: (mode: 'signin' | 'register', email: string, password: string) => Promise<{
        ok: boolean;
        message?: string;
        action?: 'resend-confirmation';
    }>;
    onAdminAccess?: () => Promise<void>;
    onOAuthSubmit?: (provider: 'google' | 'github') => Promise<void>;
    onPasswordResetRequest?: (email: string) => Promise<{
        ok: boolean;
        message?: string;
        action?: 'resend-confirmation';
    }>;
    onResendConfirmationRequest?: (email: string) => Promise<{
        ok: boolean;
        message?: string;
    }>;
}

export function AuthPage({
    onBack,
    onComplete,
    authMode = 'local',
    showRegister = true,
    infoMessage,
    errorMessage,
    onCredentialsSubmit,
    onAdminAccess,
    onOAuthSubmit,
    onPasswordResetRequest,
    onResendConfirmationRequest
}: AuthPageProps) {
    const [mode, setMode] = useState<'signin' | 'register'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [statusTone, setStatusTone] = useState<'info' | 'warning'>('info');
    const [actionHint, setActionHint] = useState<'resend-confirmation' | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatusMessage(null);
        setStatusTone('info');
        setActionHint(null);

        if (mode === 'register') {
            if (password.length < 8) {
                setStatusMessage('Use a password with at least 8 characters.');
                setStatusTone('warning');
                return;
            }

            if (password !== confirmPassword) {
                setStatusMessage('Passwords do not match.');
                setStatusTone('warning');
                return;
            }
        }

        setIsLoading(true);

        try {
            if (authMode === 'supabase' && onCredentialsSubmit) {
                const result = await onCredentialsSubmit(mode, email, password);

                if (!result.ok) {
                    setStatusMessage(result.message || 'Authentication failed.');
                    setStatusTone('warning');
                    setActionHint(result.action || null);
                    return;
                }

                if (result.message) {
                    setStatusMessage(result.message);
                    setStatusTone('info');
                    setActionHint(result.action || null);

                    if (mode === 'register') {
                        setMode('signin');
                        setPassword('');
                        setConfirmPassword('');
                    }
                } else {
                    onComplete?.();
                }

                return;
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
            onComplete?.();
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthClick = async (provider: 'google' | 'github') => {
        if (!onOAuthSubmit) {
            return;
        }

        setIsLoading(true);
        setStatusMessage(null);

        try {
            await onOAuthSubmit(provider);
        } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : `Unable to sign in with ${provider}.`);
            setStatusTone('warning');
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!onPasswordResetRequest || !email.trim()) {
            setStatusMessage('Enter your email first, then request a reset link.');
            setStatusTone('warning');
            return;
        }

        setIsLoading(true);
        setStatusMessage(null);
        setStatusTone('info');
        setActionHint(null);

        try {
            const result = await onPasswordResetRequest(email);
            setStatusMessage(result.message || (result.ok ? 'Password reset email sent.' : 'Unable to send reset email.'));
            setStatusTone(result.ok ? 'info' : 'warning');
            setActionHint(result.action || null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        if (!onResendConfirmationRequest || !email.trim()) {
            setStatusMessage('Enter your email first, then request a new confirmation link.');
            setStatusTone('warning');
            return;
        }

        setIsLoading(true);
        setStatusMessage(null);
        setStatusTone('info');
        setActionHint(null);

        try {
            const result = await onResendConfirmationRequest(email);
            setStatusMessage(result.message || (result.ok ? 'A new confirmation email is on its way.' : 'Unable to resend confirmation email.'));
            setStatusTone(result.ok ? 'info' : 'warning');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminAccess = async () => {
        if (!onAdminAccess) {
            return;
        }

        setIsLoading(true);
        setStatusMessage(null);
        setStatusTone('info');
        setActionHint(null);

        try {
            await onAdminAccess();
        } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : 'Unable to open admin access.');
            setStatusTone('warning');
            setIsLoading(false);
        }
    };

    const statusMessageClassName = statusTone === 'warning'
        ? 'mt-4 rounded-[20px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800'
        : 'mt-4 rounded-[20px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-800';

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
                                <div className="text-[10px] uppercase tracking-[0.26em] text-[var(--foreground-muted)]">Workspace Access</div>
                                <h1 className="mt-4 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-4xl">
                                    Sign in and continue your work.
                                </h1>
                                <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--foreground-soft)]">
                                    Access your projects, team workspace, and saved progress from one place.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="surface-panel-strong flex items-center justify-center rounded-[34px] p-4 lg:p-8">
                        <div className="w-full max-w-md">
                            <BrandLockup compact className="mb-8" />

                            <div className="mb-8">
                                <h2 className="text-3xl font-display font-semibold text-[var(--foreground)]">
                                    {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                    {mode === 'signin'
                                        ? onOAuthSubmit
                                            ? 'Use your email or connected account to continue.'
                                            : 'Use your email to sign in and continue.'
                                        : 'Create an account to start a new workspace and invite your team.'}
                                </p>
                                {infoMessage && (
                                    <div className="mt-4 rounded-[20px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-800">
                                        {infoMessage}
                                    </div>
                                )}
                                {(statusMessage || errorMessage) && (
                                    <div className={statusMessage ? statusMessageClassName : 'mt-4 rounded-[20px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800'}>
                                        {statusMessage || errorMessage}
                                    </div>
                                )}
                                {actionHint === 'resend-confirmation' && onResendConfirmationRequest && (
                                    <div className="mt-3">
                                        <button
                                            type="button"
                                            onClick={() => void handleResendConfirmation()}
                                            disabled={isLoading}
                                            className="text-sm font-medium text-sky-700 transition-colors hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Resend confirmation email
                                        </button>
                                    </div>
                                )}
                            </div>

                            {showRegister && (
                                <div className="mb-8 grid grid-cols-2 gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel)] p-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('signin');
                                            setStatusMessage(null);
                                            setStatusTone('info');
                                            setActionHint(null);
                                        }}
                                        className={`rounded-full px-4 py-3 text-sm font-semibold transition-all ${mode === 'signin' ? 'border border-sky-500/20 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_16px_24px_rgba(37,99,235,0.18)]' : 'text-[var(--foreground-soft)]'}`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('register');
                                            setStatusMessage(null);
                                            setStatusTone('info');
                                            setActionHint(null);
                                        }}
                                        className={`rounded-full px-4 py-3 text-sm font-semibold transition-all ${mode === 'register' ? 'border border-sky-500/20 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_16px_24px_rgba(37,99,235,0.18)]' : 'text-[var(--foreground-soft)]'}`}
                                    >
                                        Register
                                    </button>
                                </div>
                            )}

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
                                        onChange={(event) => setEmail(event.target.value)}
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
                                        onChange={(event) => setPassword(event.target.value)}
                                    />
                                    {authMode === 'supabase' && mode === 'signin' && onPasswordResetRequest && (
                                        <button
                                            type="button"
                                            onClick={() => void handlePasswordReset()}
                                            className="mt-2 text-sm font-medium text-sky-700 transition-colors hover:text-sky-800"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                {mode === 'register' && (
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                            Confirm password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            className="w-full rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--foreground-muted)] focus:border-sky-400 focus:bg-[var(--panel-strong)] focus:ring-4 focus:ring-sky-400/10"
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                        />
                                    </div>
                                )}

                                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Processing...' : mode === 'signin' ? 'Enter Workspace' : 'Create Account'}
                                </Button>
                            </form>

                            {mode === 'signin' && onAdminAccess && (
                                <div className="mt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="lg"
                                        className="w-full"
                                        disabled={isLoading}
                                        onClick={() => void handleAdminAccess()}
                                    >
                                        {isLoading ? 'Opening...' : 'Open Test Workspace'}
                                    </Button>
                                </div>
                            )}

                            {onOAuthSubmit && (
                                <div className="mt-8 border-t border-[var(--panel-border)] pt-6">
                                <div className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                    Or connect with
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => void handleOAuthClick('google')}
                                        disabled={!onOAuthSubmit || isLoading}
                                        className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 7.373-2.36 3.213-3.008 2.55-9.12 2.55-9.12h-8" fill="currentColor" /></svg>
                                        Google
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleOAuthClick('github')}
                                        disabled={!onOAuthSubmit || isLoading}
                                        className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm font-medium text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Github className="h-4 w-4" />
                                        GitHub
                                    </button>
                                </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

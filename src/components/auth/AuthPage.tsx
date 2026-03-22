'use client';

import Link from 'next/link';
import React, { useEffect, useId, useRef, useState } from 'react';
import { Github } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { ParticleField } from '@/components/ui/ParticleField';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

type AuthActionHint = 'resend-confirmation';

interface AuthResult {
    ok: boolean;
    message?: string;
    action?: AuthActionHint;
}

interface AuthPageProps {
    onBack: () => void;
    onComplete?: () => void;
    authMode?: 'local' | 'supabase';
    showRegister?: boolean;
    infoMessage?: string | null;
    errorMessage?: string | null;
    onCredentialsSubmit?: (mode: 'signin' | 'register', email: string, password: string) => Promise<AuthResult>;
    onIdentityCheck?: (mode: 'signin' | 'register', email: string) => Promise<AuthResult>;
    onAdminAccess?: () => Promise<void>;
    onPasswordResetRequest?: (email: string) => Promise<AuthResult>;
    onResendConfirmationRequest?: (email: string) => Promise<AuthResult>;
}

interface FloatingFieldProps {
    id?: string;
    label: string;
    type?: string;
    autoComplete?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    inputRef?: React.RefObject<HTMLInputElement | null>;
}

function FloatingField({
    id,
    label,
    type = 'text',
    autoComplete,
    inputMode,
    value,
    onChange,
    disabled = false,
    required = false,
    inputRef
}: FloatingFieldProps) {
    const generatedId = useId();
    const fieldId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const isRaised = isFocused || value.length > 0;

    return (
        <label htmlFor={fieldId} className="block">
            <div
                data-floating-field={label.toLowerCase().replace(/\s+/g, '-')}
                className={cn(
                    'relative overflow-hidden rounded-[16px] border bg-[var(--panel)] transition-[border-color,box-shadow,background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    'shadow-[0_10px_24px_rgba(15,23,42,0.05)]',
                    isFocused
                        ? 'border-[#EE8D01]/70 bg-[var(--panel-strong)] shadow-[0_14px_28px_rgba(238,141,1,0.12)] dark:border-sky-400/70 dark:shadow-[0_14px_28px_rgba(37,99,235,0.2)]'
                        : 'border-[var(--panel-border)] hover:border-slate-300/70 dark:hover:border-slate-600/80',
                    disabled && 'opacity-70'
                )}
            >
                <span
                    data-floating-label={label.toLowerCase().replace(/\s+/g, '-')}
                    className={cn(
                        'pointer-events-none absolute left-5 z-10 origin-left text-[var(--foreground-muted)] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        isRaised
                            ? 'top-2.5 text-[11px] tracking-[0.02em] text-[var(--foreground-soft)]'
                            : 'top-1/2 -translate-y-1/2 text-[1rem] text-[var(--foreground)]/78'
                    )}
                >
                    {label}
                </span>
                <input
                    data-floating-input={label.toLowerCase().replace(/\s+/g, '-')}
                    id={fieldId}
                    ref={inputRef}
                    type={type}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    required={required}
                    disabled={disabled}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder=" "
                    className="h-[56px] w-full bg-transparent px-4.5 pb-1 pt-4.5 text-[0.95rem] text-[var(--foreground)] outline-none placeholder:text-transparent disabled:cursor-not-allowed"
                />
            </div>
        </label>
    );
}

function GoogleMark() {
    return (
        <svg className="h-6 w-6 shrink-0" aria-hidden="true" viewBox="0 0 24 24">
            <path
                d="M21.8 12.23c0-.76-.07-1.49-.2-2.18H12v4.13h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.94-1.79 3.05-4.43 3.05-7.59Z"
                fill="#4285F4"
            />
            <path
                d="M12 22c2.75 0 5.05-.91 6.73-2.47l-3.3-2.56c-.91.61-2.08.97-3.43.97-2.64 0-4.88-1.78-5.68-4.18H2.91v2.64A9.99 9.99 0 0 0 12 22Z"
                fill="#34A853"
            />
            <path
                d="M6.32 13.76a5.98 5.98 0 0 1 0-3.52V7.6H2.91a10 10 0 0 0 0 8.8l3.41-2.64Z"
                fill="#FBBC04"
            />
            <path
                d="M12 6.06c1.49 0 2.83.51 3.88 1.52l2.91-2.91C17.04 2.98 14.74 2 12 2 8.09 2 4.72 4.24 2.91 7.6l3.41 2.64c.8-2.4 3.04-4.18 5.68-4.18Z"
                fill="#EA4335"
            />
        </svg>
    );
}

export function AuthPage(props: AuthPageProps) {
    const {
        onBack,
        onComplete,
        authMode = 'local',
        showRegister = true,
        infoMessage,
        errorMessage,
        onCredentialsSubmit,
        onIdentityCheck,
        onAdminAccess,
        onPasswordResetRequest,
        onResendConfirmationRequest
    } = props;
    const [mode, setMode] = useState<'signin' | 'register'>('signin');
    const [signInStep, setSignInStep] = useState<'email' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [statusTone, setStatusTone] = useState<'info' | 'warning'>('info');
    const [actionHint, setActionHint] = useState<AuthActionHint | null>(null);
    const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
    const [oauthNotice, setOauthNotice] = useState<string | null>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        document.body.classList.add('auth-no-grid');

        return () => {
            document.body.classList.remove('auth-no-grid');
        };
    }, []);

    const isSignInEmailStep = mode === 'signin' && signInStep === 'email';
    const normalizeEmail = (value: string) => value.trim().toLowerCase();

    const resetStatus = () => {
        setStatusMessage(null);
        setStatusTone('info');
        setActionHint(null);
        setOauthNotice(null);
    };

    const revealPasswordStep = (nextEmail: string) => {
        setEmail(nextEmail);
        setVerifiedEmail(nextEmail);
        setSignInStep('password');

        window.requestAnimationFrame(() => {
            passwordInputRef.current?.focus();
        });
    };

    const handleContinueWithEmail = async () => {
        resetStatus();
        const normalizedEmail = normalizeEmail(email);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setStatusMessage('Enter a valid email address.');
            setStatusTone('warning');
            return;
        }

        setIsLoading(true);

        try {
            if (authMode === 'supabase' && onIdentityCheck) {
                const result = await onIdentityCheck('signin', normalizedEmail);

                if (!result.ok) {
                    setStatusMessage(result.message || 'We could not find that account.');
                    setStatusTone('warning');
                    setActionHint(result.action || null);
                    return;
                }
            }

            revealPasswordStep(normalizedEmail);
        } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : 'Unable to verify this email right now.');
            setStatusTone('warning');
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeChange = (nextMode: 'signin' | 'register') => {
        setMode(nextMode);
        resetStatus();
        setPassword('');
        setConfirmPassword('');

        if (nextMode === 'signin') {
            setSignInStep('email');
            setVerifiedEmail(null);
        } else {
            setSignInStep('password');
            setVerifiedEmail(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        resetStatus();

        if (isSignInEmailStep) {
            await handleContinueWithEmail();
            return;
        }

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

        if (mode === 'signin' && password.length === 0) {
            setStatusMessage('Enter your password to continue.');
            setStatusTone('warning');
            return;
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
                        setSignInStep('email');
                        setVerifiedEmail(null);
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

    const handleOAuthClick = (provider: 'google' | 'github') => {
        setOauthNotice(`${provider === 'google' ? 'Google' : 'GitHub'} sign-in is coming soon.`);
    };

    const handlePasswordReset = async () => {
        if (!onPasswordResetRequest || !email.trim()) {
            setStatusMessage('Enter your email first, then request a reset link.');
            setStatusTone('warning');
            return;
        }

        setIsLoading(true);
        resetStatus();

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
        resetStatus();

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
        resetStatus();

        try {
            await onAdminAccess();
        } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : 'Unable to open admin access.');
            setStatusTone('warning');
            setIsLoading(false);
        }
    };

    const statusMessageClassName = statusTone === 'warning'
        ? 'mt-4 rounded-[16px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800'
        : 'mt-4 rounded-[16px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900';

    const primaryButtonLabel = isLoading
        ? isSignInEmailStep
            ? 'Checking email...'
            : mode === 'signin'
                ? 'Signing in...'
                : 'Creating account...'
        : isSignInEmailStep
            ? 'Continue with email'
            : mode === 'signin'
                ? 'Enter Workspace'
                : 'Create Account';

    return (
        <div className="relative isolate min-h-screen overflow-hidden px-4 py-5 lg:px-8">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,235,204,0.86),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(191,219,254,0.42),transparent_24%),radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.72),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] dark:bg-[linear-gradient(180deg,rgba(5,10,18,0.4),rgba(6,15,25,0.72))]" />
                <div
                    className="absolute left-[-11rem] top-[-3rem] hidden h-[28rem] w-[28rem] rounded-full bg-[#EE8D01]/18 blur-[120px] dark:hidden sm:block"
                    style={{ animation: 'softFloat 12s ease-in-out infinite' }}
                />
                <div
                    className="absolute right-[-8rem] top-[7%] hidden h-[24rem] w-[24rem] rounded-full bg-sky-300/20 blur-[120px] dark:hidden sm:block"
                    style={{ animation: 'softFloat 14s ease-in-out infinite', animationDelay: '-4s' }}
                />
                <div className="absolute left-1/2 top-1/2 hidden h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/58 blur-[110px] dark:hidden sm:block" />
                <div className="absolute left-[-7rem] top-[16%] hidden h-[24rem] w-[24rem] rounded-full border border-white/65 opacity-55 dark:hidden lg:block" />
                <div className="absolute right-[-6rem] top-[20%] hidden h-[22rem] w-[22rem] rounded-full border border-sky-100/70 opacity-55 dark:hidden lg:block" />
                <div className="absolute left-[10%] bottom-[10%] hidden h-[15rem] w-[15rem] rounded-full border border-[#EE8D01]/14 opacity-45 dark:hidden lg:block" />
                <div
                    className="particle-beam absolute hidden opacity-20 dark:hidden lg:block"
                    style={{ top: '46%', left: '26%', width: '48%', height: '4.5rem', animationDuration: '18s', animationDelay: '-2.6s' }}
                />
                <div className="absolute inset-x-[16%] top-[18.5%] hidden h-px bg-[linear-gradient(90deg,transparent,rgba(238,141,1,0.16),rgba(56,189,248,0.14),transparent)] dark:hidden lg:block" />
                <div className="absolute inset-x-[14%] bottom-[17%] hidden h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.08),transparent)] dark:hidden lg:block" />
                <div className="absolute -left-12 bottom-[-5rem] h-[16rem] w-[16rem] rounded-full bg-[#fff3df] blur-[100px] dark:bg-white/6" />
                <div className="absolute -right-10 bottom-[8%] h-[14rem] w-[14rem] rounded-full bg-sky-100/70 blur-[100px] dark:bg-sky-400/10" />
            </div>
            <ParticleField className="z-[1] opacity-52 dark:opacity-72" />
            <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex flex-col items-start">
                    <BrandLockup compact className="min-w-0" onClick={onBack} />
                </div>
                <ThemeToggle compact />
            </div>

            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] max-w-4xl -translate-y-3 flex-col justify-center sm:-translate-y-4">
                <div className="flex flex-1 items-center justify-center">
                    <div className="surface-panel-strong w-full max-w-[33rem] rounded-[28px] px-4 py-7 sm:px-6 sm:py-8 lg:px-7 lg:py-9">
                        <div className="w-full">
                            <div className="mx-auto w-full max-w-[21.75rem] px-1 sm:max-w-[22.5rem]">
                                <div key={`auth-copy-${mode}-${signInStep}`} className="auth-panel-enter mb-7 pt-1 text-center sm:pt-2">
                                    <h2 className="text-[1.7rem] font-display font-semibold text-[var(--foreground)] sm:text-[1.95rem]">
                                        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                                    </h2>
                                    {((mode === 'signin' && signInStep === 'password') || mode === 'register') && (
                                        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                            {mode === 'signin'
                                                ? 'Enter your password to continue.'
                                                : 'Create an account to start a new workspace and invite your team.'}
                                        </p>
                                    )}
                                    {infoMessage && (
                                        <div className="mt-4 rounded-[16px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-left text-sm leading-relaxed text-amber-900">
                                            {infoMessage}
                                        </div>
                                    )}
                                    {(statusMessage || errorMessage) && (
                                        <div className={statusMessage ? `${statusMessageClassName} text-left` : 'mt-4 rounded-[16px] border border-amber-100 bg-amber-50 px-4 py-3 text-left text-sm leading-relaxed text-amber-800'}>
                                            {statusMessage || errorMessage}
                                        </div>
                                    )}
                                    {actionHint === 'resend-confirmation' && onResendConfirmationRequest && (
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                onClick={() => void handleResendConfirmation()}
                                                disabled={isLoading}
                                                className="text-sm font-medium text-[#C76F00] transition-colors hover:text-[#A95F00] disabled:cursor-not-allowed disabled:opacity-60 dark:text-sky-300 dark:hover:text-sky-200"
                                            >
                                                Resend confirmation email
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {showRegister && (
                                    <div data-auth-mode-switch="true" className="relative mb-6 grid grid-cols-2 gap-2 rounded-[15px] border border-[var(--panel-border)] bg-[var(--panel)] p-1.5">
                                        <div
                                            data-auth-mode-indicator={mode}
                                            className={cn(
                                                'pointer-events-none absolute inset-y-1.5 left-1.5 w-[calc(50%-0.5rem)] rounded-[12px] border border-[#EE8D01]/18 bg-[linear-gradient(135deg,#F2AB45,#E59618)] shadow-[0_12px_22px_rgba(238,141,1,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-sky-400/28 dark:bg-[linear-gradient(135deg,#38bdf8,#2563eb)] dark:shadow-[0_14px_28px_rgba(37,99,235,0.24)]',
                                                mode === 'register' && 'translate-x-[calc(100%+0.5rem)]'
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleModeChange('signin')}
                                            className={`relative z-10 rounded-[11px] px-4 py-2 text-sm font-semibold transition-colors duration-200 ${mode === 'signin' ? 'text-white' : 'text-[var(--foreground-soft)]'}`}
                                        >
                                            Sign In
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleModeChange('register')}
                                            className={`relative z-10 rounded-[11px] px-4 py-2 text-sm font-semibold transition-colors duration-200 ${mode === 'register' ? 'text-white' : 'text-[var(--foreground-soft)]'}`}
                                        >
                                            Register
                                        </button>
                                    </div>
                                )}

                                <form key={`auth-form-${mode}`} onSubmit={handleSubmit} className="auth-panel-enter space-y-3">
                                    <FloatingField
                                        label="Email"
                                        type="email"
                                        autoComplete="email"
                                        inputMode="email"
                                        value={email}
                                        onChange={(nextValue) => {
                                            setEmail(nextValue);

                                            if (mode === 'signin' && signInStep === 'password' && normalizeEmail(nextValue) !== verifiedEmail) {
                                                setSignInStep('email');
                                                setVerifiedEmail(null);
                                                setPassword('');
                                            }
                                        }}
                                        required
                                    />

                                    {mode === 'signin' && signInStep === 'password' && (
                                        <div className="auth-step-enter space-y-2.5">
                                            <FloatingField
                                                label="Password"
                                                type="password"
                                                autoComplete="current-password"
                                                value={password}
                                                onChange={setPassword}
                                                inputRef={passwordInputRef}
                                                required
                                            />
                                            <div className="flex items-center justify-between gap-3">
                                                {authMode === 'supabase' && onPasswordResetRequest ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handlePasswordReset()}
                                                        className="text-sm font-medium text-[#C76F00] transition-colors hover:text-[#A95F00] dark:text-sky-300 dark:hover:text-sky-200"
                                                    >
                                                        Forgot password?
                                                    </button>
                                                ) : <span />}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSignInStep('email');
                                                        setVerifiedEmail(null);
                                                        setPassword('');
                                                    }}
                                                    className="text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                                                >
                                                    Use another email
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {mode === 'register' && (
                                        <div className="auth-step-enter space-y-3">
                                            <FloatingField
                                                label="Password"
                                                type="password"
                                                autoComplete="new-password"
                                                value={password}
                                                onChange={setPassword}
                                                required
                                            />
                                            <FloatingField
                                                label="Confirm password"
                                                type="password"
                                                autoComplete="new-password"
                                                value={confirmPassword}
                                                onChange={setConfirmPassword}
                                                required
                                            />
                                        </div>
                                    )}

                                    <Button type="submit" variant="brand" size="lg" className="mt-2 h-[42px] w-full rounded-[14px] text-[0.94rem]" disabled={isLoading}>
                                        {primaryButtonLabel}
                                    </Button>
                                </form>

                                {mode === 'signin' && onAdminAccess && (
                                    <div className="mt-3">
                                        <Button
                                            type="button"
                                            variant="brand-outline"
                                            size="lg"
                                            className="h-[42px] w-full rounded-[14px] text-[0.94rem]"
                                            disabled={isLoading}
                                            onClick={() => void handleAdminAccess()}
                                        >
                                            {isLoading ? 'Opening...' : 'Open Test Workspace'}
                                        </Button>
                                    </div>
                                )}

                                {mode === 'signin' && showRegister && (
                                    <div className="mt-5 border-t border-[var(--panel-border)] pt-4">
                                        <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                            Or continue with
                                        </div>
                                        <div className="space-y-2.5">
                                            <button
                                                type="button"
                                                onClick={() => handleOAuthClick('google')}
                                                disabled={isLoading}
                                                className="inline-flex w-full items-center justify-center gap-3.5 rounded-[14px] border border-[var(--panel-border)] bg-[var(--panel)] px-5 py-2.5 text-[0.94rem] font-medium text-[var(--foreground)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-slate-300/70 hover:bg-[var(--panel-strong)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-sky-400/22 dark:hover:bg-slate-900/84"
                                            >
                                                <GoogleMark />
                                                Continue with Google
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleOAuthClick('github')}
                                                disabled={isLoading}
                                                className="inline-flex w-full items-center justify-center gap-3.5 rounded-[14px] border border-[var(--panel-border)] bg-[var(--panel)] px-5 py-2.5 text-[0.94rem] font-medium text-[var(--foreground)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-slate-300/70 hover:bg-[var(--panel-strong)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-sky-400/22 dark:hover:bg-slate-900/84"
                                            >
                                                <Github className="h-5 w-5" />
                                                Continue with GitHub
                                            </button>
                                        </div>
                                        {oauthNotice && (
                                            <div aria-live="polite" className="mt-3 rounded-[14px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
                                                {oauthNotice}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-7 border-t border-[var(--panel-border)] pt-5 text-center">
                                <div className="flex items-center justify-center gap-5 text-sm text-[var(--foreground-soft)]">
                                    <Link href="/terms-of-use" className="transition-colors hover:text-[var(--foreground)]">
                                        Terms of Use
                                    </Link>
                                    <Link href="/privacy-policy" className="transition-colors hover:text-[var(--foreground)]">
                                        Privacy Policy
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

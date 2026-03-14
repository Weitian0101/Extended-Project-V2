'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [supabaseReady, setSupabaseReady] = useState(false);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const supabase = createSupabaseBrowserClient();
                await supabase.auth.getSession();
                setSupabaseReady(true);
                setIsReady(true);
            } catch (bootstrapError) {
                setError(bootstrapError instanceof Error ? bootstrapError.message : 'Supabase browser client is not configured.');
            }
        };

        void bootstrap();
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setStatus(null);

        if (!supabaseReady) {
            setError('Supabase browser client is not configured.');
            return;
        }

        if (!password || password.length < 8) {
            setError('Use a password with at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const supabase = createSupabaseBrowserClient();
            const { error: updateError } = await supabase.auth.updateUser({
                password
            });

            if (updateError) {
                setError(updateError.message);
                return;
            }

            setStatus('Password updated. You can return to the workspace now.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">
            <div className="surface-panel-strong w-full max-w-xl rounded-[32px] p-8">
                <h1 className="text-3xl font-display font-semibold text-[var(--foreground)]">Choose a new password</h1>
                <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-soft)]">
                    Set a new password for your account, then return to the workspace and continue.
                </p>
                {!isReady && (
                    <div className="mt-4 rounded-[20px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                        Preparing your reset session...
                    </div>
                )}
                {status && (
                    <div className="mt-4 rounded-[20px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {status}
                    </div>
                )}
                {error && (
                    <div className="mt-4 rounded-[20px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {error}
                    </div>
                )}
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                            New password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none"
                            autoComplete="new-password"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="w-full rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none"
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button type="submit" disabled={isLoading || !isReady}>
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.push('/')}>
                            Return Home
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

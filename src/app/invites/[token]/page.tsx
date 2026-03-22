'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

import { AuthPage } from '@/components/auth/AuthPage';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { PermissionLevel } from '@/types';

interface InvitePayload {
    invite: {
        id: string;
        projectId: string;
        projectName: string;
        email: string;
        permission: PermissionLevel;
        status: 'pending' | 'accepted' | 'revoked';
        createdAt: string;
    };
}

interface EmailRegistrationStatus {
    exists: boolean;
    confirmed: boolean;
}

function getAuthRedirectUrl(token: string) {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/invites/${token}`)}`;
    }

    return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(`/invites/${token}`)}`;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(body.error || 'Request failed.');
    }

    return body as T;
}

export default function InvitePage() {
    const router = useRouter();
    const params = useParams<{ token: string }>();
    const token = Array.isArray(params?.token) ? params.token[0] : params?.token;
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const [sessionUser, setSessionUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [inviteLoading, setInviteLoading] = useState(true);
    const [invite, setInvite] = useState<InvitePayload['invite'] | null>(null);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [acceptError, setAcceptError] = useState<string | null>(null);
    const [acceptSuccess, setAcceptSuccess] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    const getEmailRegistrationStatus = async (candidateEmail: string): Promise<EmailRegistrationStatus> => {
        const { data, error } = await supabase.rpc('get_email_registration_status', {
            candidate_email: candidateEmail.trim().toLowerCase()
        });

        if (error) {
            throw error;
        }

        if (typeof data !== 'object' || data === null) {
            return {
                exists: false,
                confirmed: false
            };
        }

        const record = data as Record<string, unknown>;
        return {
            exists: record.exists === true,
            confirmed: record.confirmed === true
        };
    };

    useEffect(() => {
        const bootstrapAuth = async () => {
            const { data, error } = await supabase.auth.getUser();

            if (error) {
                if (error.name !== 'AuthSessionMissingError' && error.message !== 'Auth session missing!') {
                    setAuthError(error.message);
                } else {
                    setAuthError(null);
                }
                setSessionUser(null);
            } else {
                setSessionUser(data.user ?? null);
            }

            setAuthLoading(false);
        };

        void bootstrapAuth();

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSessionUser(session?.user ?? null);
            setAuthLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    useEffect(() => {
        if (!token) {
            return;
        }

        const loadInvite = async () => {
            try {
                const response = await fetch(`/api/invites/${token}`, {
                    cache: 'no-store'
                });
                const data = await parseApiResponse<InvitePayload>(response);
                setInvite(data.invite);
                setInviteError(null);
            } catch (error) {
                setInviteError(error instanceof Error ? error.message : 'Unable to load invite.');
            } finally {
                setInviteLoading(false);
            }
        };

        void loadInvite();
    }, [token]);

    const handleCredentialAuth = async (mode: 'signin' | 'register', email: string, password: string) => {
        setAuthError(null);

        if (mode === 'register') {
            const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: getAuthRedirectUrl(token)
                    }
                });

            if (error) {
                return {
                    ok: false,
                    message: error.message
                };
            }

            if (!data.session) {
                return {
                    ok: true,
                    message: 'Account created. Check your email if confirmation is enabled in Supabase, then come back to this invite.'
                };
            }

            return {
                ok: true
            };
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return {
                ok: false,
                message: error.message
            };
        }

        return {
            ok: true
        };
    };

    const handleIdentityCheck = async (_mode: 'signin' | 'register', email: string) => {
        if (!invite) {
            return {
                ok: false,
                message: 'Invitation details are not available yet.'
            };
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail !== invite.email.toLowerCase()) {
            return {
                ok: false,
                message: `Use ${invite.email} to accept this invitation.`
            };
        }

        const registrationStatus = await getEmailRegistrationStatus(normalizedEmail);

        if (!registrationStatus.exists) {
            return {
                ok: false,
                message: 'No account was found for this email. Create the invited account first.'
            };
        }

        if (!registrationStatus.confirmed) {
            return {
                ok: false,
                message: 'Confirm your email before signing in.',
                action: 'resend-confirmation' as const
            };
        }

        return {
            ok: true
        };
    };

    const handlePasswordReset = async (email: string) => {
        setAuthError(null);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/update-password`
        });

        if (error) {
            return {
                ok: false,
                message: error.message
            };
        }

        return {
            ok: true,
            message: 'Password reset email sent. Use the link, then return to this invitation.'
        };
    };

    const handleAcceptInvite = async () => {
        setAcceptError(null);
        setIsAccepting(true);

        try {
            await parseApiResponse(
                await fetch(`/api/invites/${token}`, {
                    method: 'POST'
                })
            );
            setAcceptSuccess(true);
        } catch (error) {
            setAcceptError(error instanceof Error ? error.message : 'Unable to accept invite.');
        } finally {
            setIsAccepting(false);
        }
    };

    if (!token || authLoading || inviteLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground-muted)]">
                Loading invite...
            </div>
        );
    }

    if (!invite || inviteError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
                <div className="surface-panel-strong w-full max-w-xl rounded-[32px] p-8 text-center">
                    <h1 className="text-3xl font-display font-semibold text-[var(--foreground)]">Invite unavailable</h1>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-soft)]">
                        {inviteError || 'This invite could not be loaded.'}
                    </p>
                    <Button className="mt-6" onClick={() => router.push('/')}>
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    if (!sessionUser) {
        return (
            <AuthPage
                authMode="supabase"
                showRegister={false}
                infoMessage={`Invitation for ${invite.email} to join "${invite.projectName}". Sign in with this email to accept access.`}
                errorMessage={authError}
                onBack={() => router.push('/')}
                onIdentityCheck={handleIdentityCheck}
                onCredentialsSubmit={handleCredentialAuth}
                onPasswordResetRequest={handlePasswordReset}
            />
        );
    }

    const currentEmail = sessionUser.email?.toLowerCase() || '';
    const inviteEmail = invite.email.toLowerCase();

    if (currentEmail !== inviteEmail) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
                <div className="surface-panel-strong w-full max-w-2xl rounded-[32px] p-8">
                    <h1 className="text-3xl font-display font-semibold text-[var(--foreground)]">Wrong account for this invite</h1>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-soft)]">
                        This invite is for <span className="font-medium text-[var(--foreground)]">{invite.email}</span>, but you are signed in as <span className="font-medium text-[var(--foreground)]">{sessionUser.email}</span>.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                void supabase.auth.signOut();
                            }}
                        >
                            Sign Out
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/')}>
                            Return Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (invite.status !== 'pending' || acceptSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
                <div className="surface-panel-strong w-full max-w-2xl rounded-[32px] p-8">
                    <h1 className="text-3xl font-display font-semibold text-[var(--foreground)]">Invitation accepted</h1>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-soft)]">
                        Access to <span className="font-medium text-[var(--foreground)]">{invite.projectName}</span> is now available in your workspace.
                    </p>
                    <Button className="mt-6" onClick={() => router.push('/')}>
                        Open Workspace
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">
            <div className="surface-panel-strong w-full max-w-2xl rounded-[32px] p-8">
                <div className="eyebrow">Project Invitation</div>
                <h1 className="mt-4 text-4xl font-display font-semibold text-[var(--foreground)]">{invite.projectName}</h1>
                <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-soft)]">
                    You are signed in as <span className="font-medium text-[var(--foreground)]">{sessionUser.email}</span> and have been invited with <span className="font-medium text-[var(--foreground)]">{invite.permission}</span> access.
                </p>
                {acceptError && (
                    <div className="mt-4 rounded-[20px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {acceptError}
                    </div>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={() => void handleAcceptInvite()} disabled={isAccepting}>
                        {isAccepting ? 'Accepting...' : 'Accept Invite'}
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/')}>
                        Return Home
                    </Button>
                </div>
            </div>
        </div>
    );
}

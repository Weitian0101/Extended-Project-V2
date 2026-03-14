'use client';

import React from 'react';
import { CreditCard, History, ShieldCheck, User2, X } from 'lucide-react';

import { UserProfileData } from '@/types';
import { Button } from '@/components/ui/Button';

interface UserProfileDialogProps {
    profile: UserProfileData;
    open: boolean;
    onClose: () => void;
}

export function UserProfileDialog({ profile, open, onClose }: UserProfileDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="surface-panel-strong w-full max-w-3xl rounded-[30px] p-5 lg:p-8" onClick={event => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="eyebrow">User Profile</div>
                        <h2 className="mt-3 text-3xl font-display font-semibold text-[var(--foreground)]">{profile.name}</h2>
                        <p className="mt-2 text-sm text-[var(--foreground-soft)]">{profile.title}</p>
                    </div>
                    <Button variant="secondary" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-3">
                    <div className="surface-panel rounded-[24px] p-5">
                        <User2 className="h-5 w-5 text-sky-500" />
                        <div className="mt-4 text-sm font-semibold text-[var(--foreground)]">Personal Info</div>
                        <div className="mt-3 space-y-2 text-sm text-[var(--foreground-soft)]">
                            <div>Name: {profile.name}</div>
                            <div>Email: {profile.email}</div>
                            <div>Workspace: {profile.workspace}</div>
                        </div>
                    </div>
                    <div className="surface-panel rounded-[24px] p-5">
                        <CreditCard className="h-5 w-5 text-amber-500" />
                        <div className="mt-4 text-sm font-semibold text-[var(--foreground)]">Plan & Billing</div>
                        <div className="mt-3 space-y-2 text-sm text-[var(--foreground-soft)]">
                            <div>Current plan: {profile.plan}</div>
                            <div>Renewal: {profile.renewalDate}</div>
                            <div>Usage: {profile.usage}</div>
                        </div>
                    </div>
                    <div className="surface-panel rounded-[24px] p-5">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        <div className="mt-4 text-sm font-semibold text-[var(--foreground)]">Access</div>
                        <div className="mt-3 space-y-2 text-sm text-[var(--foreground-soft)]">
                            <div>Role: Workspace owner</div>
                            <div>Permissions: invite, edit, publish</div>
                            <div>Security: single workspace session</div>
                        </div>
                    </div>
                </div>

                <div className="mt-5 surface-panel rounded-[24px] p-5">
                    <div className="flex items-center gap-2 text-[var(--foreground)]">
                        <History className="h-4 w-4 text-rose-500" />
                        <span className="text-sm font-semibold">Recent plan history</span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-[var(--foreground-soft)]">
                        <div className="flex items-center justify-between rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
                            <span>Sandbox Pro renewed</span>
                            <span>30 Apr 2026</span>
                        </div>
                        <div className="flex items-center justify-between rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
                            <span>Workspace seats updated</span>
                            <span>04 Mar 2026</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

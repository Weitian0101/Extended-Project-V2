'use client';

import React, { useEffect, useState } from 'react';
import {
    Copy,
    Mail,
    MailCheck,
    Settings2,
    ShieldCheck,
    Trash2,
    UserPlus,
    X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RoundedSelect } from '@/components/ui/RoundedSelect';
import { cn } from '@/lib/utils';
import { PermissionLevel, ProjectInvite, WorkspaceProject } from '@/types';

interface ProjectSettingsDialogProps {
    open: boolean;
    project: WorkspaceProject | null;
    projectId?: string;
    currentUserId?: string;
    remoteMode?: boolean;
    isNewProject?: boolean;
    onInviteMember?: (projectId: string, email: string, permission: PermissionLevel) => Promise<{
        delivery: 'invite-created';
        invite: ProjectInvite;
    }>;
    onSendInviteEmail?: (projectId: string, inviteId: string) => Promise<void>;
    onRevokeInvite?: (projectId: string, inviteId: string) => Promise<void>;
    onUpdateMemberPermission?: (projectId: string, memberId: string, permission: PermissionLevel) => Promise<void>;
    onRemoveMember?: (projectId: string, memberId: string) => Promise<void>;
    onClose: () => void;
    onSave: (project: WorkspaceProject) => void;
}

const PERMISSION_OPTIONS = [
    { value: 'owner', label: 'Owner' },
    { value: 'edit', label: 'Can Edit' },
    { value: 'view', label: 'Can View' }
] as const;

type SettingsConfirmState =
    | { type: 'remove-member'; memberId: string; memberName: string }
    | { type: 'revoke-invite'; invite: ProjectInvite };

function getInviteBadgeTone(permission: PermissionLevel) {
    if (permission === 'edit') {
        return 'border-sky-300/30 bg-sky-500/10 text-sky-700 dark:text-sky-300';
    }

    return 'border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
}

function upsertInvite(invites: ProjectInvite[] | undefined, nextInvite: ProjectInvite) {
    const current = invites || [];
    const existing = current.find((invite) => invite.id === nextInvite.id || invite.email.toLowerCase() === nextInvite.email.toLowerCase());

    if (!existing) {
        return [nextInvite, ...current];
    }

    return current.map((invite) => invite.id === existing.id ? nextInvite : invite);
}

export function ProjectSettingsDialog({
    open,
    project,
    projectId,
    currentUserId,
    remoteMode = false,
    isNewProject = false,
    onInviteMember,
    onSendInviteEmail,
    onRevokeInvite,
    onUpdateMemberPermission,
    onRemoveMember,
    onClose,
    onSave
}: ProjectSettingsDialogProps) {
    const [draft, setDraft] = useState<WorkspaceProject | null>(project);
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePermission, setInvitePermission] = useState<PermissionLevel>('view');
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [isInviteLoading, setIsInviteLoading] = useState(false);
    const [inviteActionId, setInviteActionId] = useState<string | null>(null);
    const [memberError, setMemberError] = useState<string | null>(null);
    const [copiedValue, setCopiedValue] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<SettingsConfirmState | null>(null);
    const [isConfirmLoading, setIsConfirmLoading] = useState(false);

    useEffect(() => {
        setDraft(project);
        setInviteEmail('');
        setInvitePermission('view');
        setInviteError(null);
        setInviteSuccess(null);
        setIsInviteLoading(false);
        setInviteActionId(null);
        setMemberError(null);
        setCopiedValue(null);
        setConfirmState(null);
        setIsConfirmLoading(false);
    }, [project]);

    if (!open || !draft) {
        return null;
    }

    const canManageMembers = draft.ownerId === currentUserId
        || draft.members.some((member) => member.id === currentUserId && member.permission === 'owner');

    const handlePermissionChange = async (memberId: string, permission: PermissionLevel) => {
        if (memberId === currentUserId || memberId === draft.ownerId) {
            return;
        }

        if (remoteMode && projectId && onUpdateMemberPermission) {
            try {
                setMemberError(null);
                await onUpdateMemberPermission(projectId, memberId, permission);
                setDraft((current) => current ? {
                    ...current,
                    members: current.members.map((member) => member.id === memberId ? { ...member, permission } : member)
                } : current);
            } catch (error) {
                setMemberError(error instanceof Error ? error.message : 'Unable to update permissions.');
            }
            return;
        }

        setDraft((current) => current ? {
            ...current,
            members: current.members.map((member) => member.id === memberId ? { ...member, permission } : member)
        } : current);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (remoteMode && projectId && onRemoveMember) {
            try {
                setMemberError(null);
                await onRemoveMember(projectId, memberId);
                setDraft((current) => current ? {
                    ...current,
                    members: current.members.filter((member) => member.id !== memberId)
                } : current);
            } catch (error) {
                setMemberError(error instanceof Error ? error.message : 'Unable to remove this member.');
            }
            return;
        }

        setDraft((current) => current ? {
            ...current,
            members: current.members.filter((member) => member.id !== memberId)
        } : current);
    };

    const handleInvite = async () => {
        const normalizedEmail = inviteEmail.trim().toLowerCase();
        if (!normalizedEmail) {
            return;
        }

        if (remoteMode && projectId && onInviteMember) {
            try {
                setIsInviteLoading(true);
                setInviteError(null);
                setInviteSuccess(null);
                const result = await onInviteMember(projectId, normalizedEmail, invitePermission);
                setDraft((current) => current ? {
                    ...current,
                    pendingInvites: upsertInvite(current.pendingInvites, result.invite)
                } : current);
                setInviteEmail('');
                setInviteSuccess(`Invite created for ${normalizedEmail}.`);
            } catch (error) {
                setInviteError(error instanceof Error ? error.message : 'Unable to create invite.');
            } finally {
                setIsInviteLoading(false);
            }
            return;
        }

        const nextInvite: ProjectInvite = {
            id: uuidv4(),
            email: normalizedEmail,
            permission: invitePermission,
            status: 'pending',
            createdAt: new Date().toISOString(),
            inviteUrl: `local://invite/${uuidv4()}`
        };

        setDraft((current) => current ? {
            ...current,
            pendingInvites: upsertInvite(current.pendingInvites, nextInvite)
        } : current);
        setInviteEmail('');
        setInviteSuccess(`Invite created for ${normalizedEmail}.`);
    };

    const handleCopy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedValue(value);
            setInviteError(null);
        } catch (error) {
            setInviteError(error instanceof Error ? error.message : 'Unable to copy invite link.');
        }
    };

    const handleSendInviteEmail = async (invite: ProjectInvite) => {
        if (!projectId || !onSendInviteEmail) {
            return;
        }

        try {
            setInviteActionId(invite.id);
            setInviteError(null);
            await onSendInviteEmail(projectId, invite.id);
            setInviteSuccess(`Invite email sent to ${invite.email}.`);
        } catch (error) {
            setInviteError(error instanceof Error ? error.message : 'Unable to send invite email.');
        } finally {
            setInviteActionId(null);
        }
    };

    const handleRevokeInvite = async (invite: ProjectInvite) => {
        if (remoteMode && projectId && onRevokeInvite) {
            try {
                setInviteActionId(invite.id);
                setInviteError(null);
                await onRevokeInvite(projectId, invite.id);
                setDraft((current) => current ? {
                    ...current,
                    pendingInvites: (current.pendingInvites || []).filter((item) => item.id !== invite.id)
                } : current);
                setInviteSuccess(`Invite revoked for ${invite.email}.`);
            } catch (error) {
                setInviteError(error instanceof Error ? error.message : 'Unable to revoke invite.');
            } finally {
                setInviteActionId(null);
            }
            return;
        }

        setDraft((current) => current ? {
            ...current,
            pendingInvites: (current.pendingInvites || []).filter((item) => item.id !== invite.id)
        } : current);
    };

    const handleConfirmAction = async () => {
        if (!confirmState) {
            return;
        }

        try {
            setIsConfirmLoading(true);
            if (confirmState.type === 'remove-member') {
                await handleRemoveMember(confirmState.memberId);
            } else {
                await handleRevokeInvite(confirmState.invite);
            }
            setConfirmState(null);
        } finally {
            setIsConfirmLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="surface-panel-strong w-full max-w-[96rem] rounded-[36px] p-6 lg:p-8"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="eyebrow">{isNewProject ? 'New Project Setup' : 'Project Settings'}</div>
                        <h2 className="mt-3 text-3xl font-display font-semibold text-[var(--foreground)] lg:text-4xl">{draft.name}</h2>
                    </div>
                    <Button variant="secondary" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                        <section className="surface-panel rounded-[30px] p-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                <Settings2 className="h-4 w-4 text-sky-500" />
                                Project basics
                            </div>
                            <div className="mt-5 grid gap-4">
                                <label className="block">
                                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Project name</div>
                                    <input
                                        value={draft.name}
                                        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                                        className="mt-2 w-full rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-sky-400"
                                    />
                                </label>
                                <label className="block">
                                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Summary</div>
                                    <textarea
                                        value={draft.summary}
                                        onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                                        className="mt-2 h-32 w-full rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-sky-400"
                                    />
                                </label>
                            </div>
                        </section>

                        <section className="surface-panel rounded-[30px] p-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                <UserPlus className="h-4 w-4 text-emerald-500" />
                                Invite by email
                            </div>
                            <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_240px_auto]">
                                <label className="block">
                                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Invite email</div>
                                    <div className="mt-2 flex items-center gap-3 rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3">
                                        <Mail className="h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(event) => setInviteEmail(event.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full min-w-0 bg-transparent text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)]"
                                        />
                                    </div>
                                </label>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Access</div>
                                    <RoundedSelect
                                        className="mt-2"
                                        value={invitePermission}
                                        onChange={(value) => setInvitePermission(value as PermissionLevel)}
                                        options={PERMISSION_OPTIONS.filter((option) => option.value !== 'owner')}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button className="w-full justify-center" onClick={() => void handleInvite()} disabled={isInviteLoading}>
                                        {isInviteLoading ? 'Creating...' : 'Create Invite'}
                                    </Button>
                                </div>
                            </div>

                            {(inviteError || inviteSuccess) && (
                                <div
                                    className={cn(
                                        'mt-4 rounded-[18px] px-4 py-3 text-sm',
                                        inviteError
                                            ? 'border border-amber-300/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                            : 'border border-emerald-300/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                    )}
                                >
                                    {inviteError || inviteSuccess}
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="surface-panel rounded-[30px] p-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                <ShieldCheck className="h-4 w-4 text-violet-500" />
                                Team access
                            </div>
                            <div className="mt-4 space-y-3">
                                {draft.members.map((member) => {
                                    const lockedOwner = member.id === currentUserId || member.id === draft.ownerId || !canManageMembers;
                                    return (
                                        <div key={member.id} className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
                                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-semibold text-[var(--foreground)]">{member.name}</div>
                                                        {member.permission === 'owner' && (
                                                            <span className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
                                                                Owner
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 truncate text-sm text-[var(--foreground-soft)]" title={member.email || member.role}>
                                                        {member.email || member.role}
                                                    </div>
                                                </div>
                                                <RoundedSelect
                                                    value={member.permission}
                                                    disabled={lockedOwner}
                                                    onChange={(value) => void handlePermissionChange(member.id, value as PermissionLevel)}
                                                    options={PERMISSION_OPTIONS}
                                                    buttonClassName="bg-[var(--panel-strong)]"
                                                />
                                                <div className="flex justify-end">
                                                    {!lockedOwner && canManageMembers && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                                                            onClick={() => setConfirmState({ type: 'remove-member', memberId: member.id, memberName: member.name })}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {memberError && (
                                <div className="mt-4 rounded-[18px] border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                                    {memberError}
                                </div>
                            )}
                        </section>

                        <section className="surface-panel rounded-[30px] p-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                                <Mail className="h-4 w-4 text-sky-500" />
                                Pending invites
                            </div>
                            <div className="mt-4 space-y-3">
                                {(draft.pendingInvites || []).length === 0 && (
                                    <div className="rounded-[22px] border border-dashed border-[var(--panel-border)] bg-[var(--panel)] px-4 py-6 text-sm text-[var(--foreground-muted)]">
                                        No pending invites yet.
                                    </div>
                                )}
                                {(draft.pendingInvites || []).map((invite) => (
                                    <div key={invite.id} className="rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-[var(--foreground)]" title={invite.email}>
                                                    {invite.email}
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', getInviteBadgeTone(invite.permission))}>
                                                        {invite.permission}
                                                    </span>
                                                    <span className="rounded-full border border-[var(--panel-border)] bg-[var(--panel-strong)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                                                        Pending
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {invite.inviteUrl && (
                                                    <Button size="sm" variant="secondary" onClick={() => void handleCopy(invite.inviteUrl!)}>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        {copiedValue === invite.inviteUrl ? 'Copied' : 'Copy Link'}
                                                    </Button>
                                                )}
                                                {remoteMode && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => void handleSendInviteEmail(invite)}
                                                        disabled={inviteActionId === invite.id || !onSendInviteEmail}
                                                    >
                                                        <MailCheck className="mr-2 h-4 w-4" />
                                                        {inviteActionId === invite.id ? 'Sending...' : 'Send Email'}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                                                    onClick={() => setConfirmState({ type: 'revoke-invite', invite })}
                                                    disabled={inviteActionId === invite.id}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Revoke
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(draft)}>{isNewProject ? 'Save and Open Project' : 'Save Changes'}</Button>
                </div>
            </div>
            <ConfirmDialog
                open={Boolean(confirmState)}
                title={confirmState?.type === 'remove-member' ? 'Remove member' : 'Revoke invite'}
                description={confirmState?.type === 'remove-member'
                    ? `Remove ${confirmState.memberName} from this project?`
                    : confirmState?.type === 'revoke-invite'
                        ? `Revoke the invite for ${confirmState.invite.email}?`
                        : ''}
                confirmLabel={confirmState?.type === 'remove-member' ? 'Remove Member' : 'Revoke Invite'}
                tone="danger"
                isLoading={isConfirmLoading}
                onClose={() => {
                    if (!isConfirmLoading) {
                        setConfirmState(null);
                    }
                }}
                onConfirm={() => void handleConfirmAction()}
            />
        </div>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Settings2, UserPlus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/Button';
import { PermissionLevel, ProjectInvite, TeamMember, WorkspaceProject } from '@/types';

interface ProjectSettingsDialogProps {
    open: boolean;
    project: WorkspaceProject | null;
    projectId?: string;
    remoteMode?: boolean;
    onInviteMember?: (projectId: string, email: string, permission: PermissionLevel) => Promise<{
        delivery: 'member-added' | 'invite-created';
        invite?: ProjectInvite;
    }>;
    onUpdateMemberPermission?: (projectId: string, memberId: string, permission: PermissionLevel) => Promise<void>;
    onClose: () => void;
    onSave: (project: WorkspaceProject) => void;
}

export function ProjectSettingsDialog({
    open,
    project,
    projectId,
    remoteMode = false,
    onInviteMember,
    onUpdateMemberPermission,
    onClose,
    onSave
}: ProjectSettingsDialogProps) {
    const [draft, setDraft] = useState<WorkspaceProject | null>(project);
    const [inviteValue, setInviteValue] = useState('');
    const [invitePermission, setInvitePermission] = useState<PermissionLevel>('view');
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [isInviteLoading, setIsInviteLoading] = useState(false);
    const [memberError, setMemberError] = useState<string | null>(null);
    const [copiedValue, setCopiedValue] = useState<string | null>(null);

    useEffect(() => {
        setDraft(project);
        setInviteValue('');
        setInvitePermission('view');
        setInviteError(null);
        setInviteSuccess(null);
        setInviteLink(null);
        setMemberError(null);
        setCopiedValue(null);
    }, [project]);

    if (!open || !draft) return null;

    const handlePermissionChange = async (memberId: string, permission: PermissionLevel) => {
        if (remoteMode && projectId && onUpdateMemberPermission) {
            try {
                setMemberError(null);
                await onUpdateMemberPermission(projectId, memberId, permission);
            } catch (error) {
                setMemberError(error instanceof Error ? error.message : 'Unable to update permissions.');
            }

            return;
        }

        setDraft({
            ...draft,
            members: draft.members.map((member) => member.id === memberId ? { ...member, permission } : member)
        });
    };

    const handleInvite = async () => {
        const trimmedValue = inviteValue.trim();
        if (!trimmedValue) return;

        if (remoteMode && projectId && onInviteMember) {
            try {
                setIsInviteLoading(true);
                setInviteError(null);
                setInviteSuccess(null);
                setInviteLink(null);
                const result = await onInviteMember(projectId, trimmedValue, invitePermission);
                setInviteValue('');
                setInviteSuccess(result.delivery === 'member-added'
                    ? 'Existing account added to the project.'
                    : 'Invite link created. Share it with the teammate.');
                setInviteLink(result.invite?.inviteUrl ?? null);
            } catch (error) {
                setInviteError(error instanceof Error ? error.message : 'Unable to add team member.');
            } finally {
                setIsInviteLoading(false);
            }

            return;
        }

        const initials = trimmedValue
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        const newMember: TeamMember = {
            id: uuidv4(),
            name: trimmedValue,
            initials,
            role: 'Team Member',
            status: 'online',
            avatarColor: 'from-violet-500 to-fuchsia-400',
            permission: invitePermission
        };

        setDraft({
            ...draft,
            members: [...draft.members, newMember]
        });
        setInviteValue('');
    };

    const handleCopy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedValue(value);
        } catch (error) {
            setInviteError(error instanceof Error ? error.message : 'Unable to copy invite link.');
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="surface-panel-strong w-full max-w-4xl rounded-[30px] p-5 lg:p-8" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="eyebrow">Project Settings</div>
                        <h2 className="mt-3 text-3xl font-display font-semibold text-[var(--foreground)]">{draft.name}</h2>
                        <p className="mt-2 text-sm text-[var(--foreground-soft)]">
                            {remoteMode
                                ? 'Edit the project, invite collaborators, and manage access with persisted workspace data.'
                                : 'Invite team members, control permissions, and edit the project name in one place.'}
                        </p>
                    </div>
                    <Button variant="secondary" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-5">
                        <div className="surface-panel rounded-[24px] p-5">
                            <div className="flex items-center gap-2 text-[var(--foreground)]">
                                <Settings2 className="h-4 w-4 text-sky-500" />
                                <span className="text-sm font-semibold">General</span>
                            </div>
                            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Project Name</label>
                            <input
                                value={draft.name}
                                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                                className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-sky-400"
                            />
                            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Summary</label>
                            <textarea
                                value={draft.summary}
                                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                                className="mt-2 h-28 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-sky-400"
                            />
                        </div>

                        <div className="surface-panel rounded-[24px] p-5">
                            <div className="flex items-center gap-2 text-[var(--foreground)]">
                                <UserPlus className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-semibold">Invite Member</span>
                            </div>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <input
                                    value={inviteValue}
                                    onChange={(event) => setInviteValue(event.target.value)}
                                    placeholder={remoteMode ? 'Add team member email' : 'Add team member name'}
                                    className="w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-sky-400"
                                />
                                <select
                                    value={invitePermission}
                                    onChange={(event) => setInvitePermission(event.target.value as PermissionLevel)}
                                    className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-sky-400"
                                >
                                    <option value="edit">Can Edit</option>
                                    <option value="view">Can View</option>
                                </select>
                                <Button onClick={() => void handleInvite()} disabled={isInviteLoading}>
                                    {isInviteLoading ? 'Adding...' : 'Invite'}
                                </Button>
                            </div>
                            {inviteError && (
                                <div className="mt-3 rounded-[18px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                    {inviteError}
                                </div>
                            )}
                            {inviteSuccess && (
                                <div className="mt-3 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                    {inviteSuccess}
                                </div>
                            )}
                            {inviteLink && (
                                <div className="mt-3 rounded-[18px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                                    <div className="font-medium">Invite link</div>
                                    <div className="mt-2 break-all">{inviteLink}</div>
                                    <Button size="sm" variant="secondary" className="mt-3" onClick={() => void handleCopy(inviteLink)}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        {copiedValue === inviteLink ? 'Copied' : 'Copy Link'}
                                    </Button>
                                </div>
                            )}
                            {remoteMode && (
                                <div className="mt-3 text-xs leading-relaxed text-[var(--foreground-muted)]">
                                    Existing users are added immediately. New email addresses get a reusable invite link that can be accepted after sign-in.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="surface-panel rounded-[24px] p-5">
                        <div className="text-sm font-semibold text-[var(--foreground)]">Team Access</div>
                        <div className="mt-4 space-y-3">
                            {draft.members.map((member) => (
                                <div key={member.id} className="flex flex-col gap-3 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="font-medium text-[var(--foreground)]">{member.name}</div>
                                        <div className="text-sm text-[var(--foreground-soft)]">
                                            {member.role}
                                            {member.email ? ` - ${member.email}` : ''}
                                        </div>
                                    </div>
                                    <select
                                        value={member.permission}
                                        onChange={(event) => void handlePermissionChange(member.id, event.target.value as PermissionLevel)}
                                        className="rounded-[14px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                                    >
                                        <option value="owner">Owner</option>
                                        <option value="edit">Can Edit</option>
                                        <option value="view">Can View</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                        {Boolean(draft.pendingInvites?.length) && (
                            <div className="mt-5 border-t border-[var(--panel-border)] pt-5">
                                <div className="text-sm font-semibold text-[var(--foreground)]">Pending Invites</div>
                                <div className="mt-3 space-y-3">
                                    {draft.pendingInvites?.map((invite) => (
                                        <div key={invite.id} className="rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <div className="font-medium text-[var(--foreground)]">{invite.email}</div>
                                                    <div className="text-sm text-[var(--foreground-soft)]">
                                                        Pending access - {invite.permission}
                                                    </div>
                                                </div>
                                                {invite.inviteUrl && (
                                                    <Button size="sm" variant="secondary" onClick={() => void handleCopy(invite.inviteUrl!)}>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        {copiedValue === invite.inviteUrl ? 'Copied' : 'Copy Link'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {memberError && (
                            <div className="mt-3 rounded-[18px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                {memberError}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(draft)}>Save Changes</Button>
                </div>
            </div>
        </div>
    );
}

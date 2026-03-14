'use client';

import React, { useEffect, useState } from 'react';
import { Settings2, UserPlus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/Button';
import { TeamMember, WorkspaceProject, PermissionLevel } from '@/types';

interface ProjectSettingsDialogProps {
    open: boolean;
    project: WorkspaceProject | null;
    onClose: () => void;
    onSave: (project: WorkspaceProject) => void;
}

export function ProjectSettingsDialog({ open, project, onClose, onSave }: ProjectSettingsDialogProps) {
    const [draft, setDraft] = useState<WorkspaceProject | null>(project);
    const [inviteName, setInviteName] = useState('');

    useEffect(() => {
        setDraft(project);
        setInviteName('');
    }, [project]);

    if (!open || !draft) return null;

    const handlePermissionChange = (memberId: string, permission: PermissionLevel) => {
        setDraft({
            ...draft,
            members: draft.members.map(member => member.id === memberId ? { ...member, permission } : member)
        });
    };

    const handleInvite = () => {
        const trimmedName = inviteName.trim();
        if (!trimmedName) return;

        const initials = trimmedName
            .split(' ')
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        const newMember: TeamMember = {
            id: uuidv4(),
            name: trimmedName,
            initials,
            role: 'Team Member',
            status: 'online',
            avatarColor: 'from-violet-500 to-fuchsia-400',
            permission: 'view'
        };

        setDraft({
            ...draft,
            members: [...draft.members, newMember]
        });
        setInviteName('');
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="surface-panel-strong w-full max-w-4xl rounded-[30px] p-5 lg:p-8" onClick={event => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="eyebrow">Project Settings</div>
                        <h2 className="mt-3 text-3xl font-display font-semibold text-[var(--foreground)]">{draft.name}</h2>
                        <p className="mt-2 text-sm text-[var(--foreground-soft)]">Invite team members, control permissions, and edit the project name in one place.</p>
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
                                onChange={event => setDraft({ ...draft, name: event.target.value })}
                                className="mt-2 w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-sky-400"
                            />
                            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Summary</label>
                            <textarea
                                value={draft.summary}
                                onChange={event => setDraft({ ...draft, summary: event.target.value })}
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
                                    value={inviteName}
                                    onChange={event => setInviteName(event.target.value)}
                                    placeholder="Add team member name"
                                    className="w-full rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-sky-400"
                                />
                                <Button onClick={handleInvite}>Invite</Button>
                            </div>
                        </div>
                    </div>

                    <div className="surface-panel rounded-[24px] p-5">
                        <div className="text-sm font-semibold text-[var(--foreground)]">Team Access</div>
                        <div className="mt-4 space-y-3">
                            {draft.members.map(member => (
                                <div key={member.id} className="flex flex-col gap-3 rounded-[18px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="font-medium text-[var(--foreground)]">{member.name}</div>
                                        <div className="text-sm text-[var(--foreground-soft)]">{member.role}</div>
                                    </div>
                                    <select
                                        value={member.permission}
                                        onChange={event => handlePermissionChange(member.id, event.target.value as PermissionLevel)}
                                        className="rounded-[14px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                                    >
                                        <option value="owner">Owner</option>
                                        <option value="edit">Can Edit</option>
                                        <option value="view">Can View</option>
                                    </select>
                                </div>
                            ))}
                        </div>
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

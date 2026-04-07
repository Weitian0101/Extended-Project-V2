'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, FolderX, Mail } from 'lucide-react';

import { WorkspaceNotification } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
    notifications?: WorkspaceNotification[];
}

function formatNotificationTime(value: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('en-GB', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(parsed);
}

export function NotificationBell({ notifications = [] }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const unreadCount = notifications.filter((notification) => !notification.readAt).length;
    const sortedNotifications = useMemo(
        () => [...notifications].sort((left, right) => (
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )),
        [notifications]
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:text-[var(--foreground)]"
                aria-label="Notifications"
                aria-expanded={isOpen}
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 inline-flex min-w-[1.05rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[120] w-[22rem] rounded-[26px] border border-[var(--panel-border)] bg-[color:var(--panel-strong)] p-4 shadow-[0_28px_54px_rgba(15,23,42,0.2)] backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                                Notifications
                            </div>
                            <div className="mt-1 text-sm text-[var(--foreground-soft)]">
                                {notifications.length === 0
                                    ? 'Nothing new'
                                    : `${notifications.length} item${notifications.length === 1 ? '' : 's'}`}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
                        {sortedNotifications.length === 0 && (
                            <div className="rounded-[20px] border border-dashed border-[var(--panel-border)] px-4 py-5 text-sm text-[var(--foreground-muted)]">
                                No notifications yet.
                            </div>
                        )}

                        {sortedNotifications.map((notification) => {
                            const Icon = notification.type === 'project-invite' ? Mail : FolderX;

                            return (
                                <div
                                    key={`${notification.type}-${notification.id}`}
                                    className={cn(
                                        'rounded-[20px] border px-4 py-4',
                                        notification.type === 'project-invite'
                                            ? 'border-sky-300/20 bg-sky-500/8'
                                            : 'border-amber-300/20 bg-amber-500/8'
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border',
                                                notification.type === 'project-invite'
                                                    ? 'border-sky-300/30 bg-sky-500/12 text-sky-600'
                                                    : 'border-amber-300/30 bg-amber-500/12 text-amber-600'
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="truncate text-sm font-semibold text-[var(--foreground)]">
                                                    {notification.title}
                                                </div>
                                                {!notification.readAt && (
                                                    <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                                                )}
                                            </div>
                                            <div className="mt-2 text-sm leading-relaxed text-[var(--foreground-soft)]">
                                                {notification.message}
                                            </div>
                                            {notification.projectName && (
                                                <div className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                                                    {notification.projectName}
                                                </div>
                                            )}
                                            <div className="mt-2 text-xs text-[var(--foreground-muted)]">
                                                {formatNotificationTime(notification.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

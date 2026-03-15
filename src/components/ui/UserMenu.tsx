'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GraduationCap, LogOut, UserRound } from 'lucide-react';

import { ProfilePanel } from '@/components/ui/ProfilePanel';
import { MembershipTier } from '@/types';
import { cn } from '@/lib/utils';

interface UserMenuProps {
    name: string;
    title: string;
    tier?: MembershipTier;
    className?: string;
    triggerClassName?: string;
    containerRef?: React.MutableRefObject<HTMLDivElement | null>;
    onOpenProfile: () => void;
    onOpenLearningCenter: () => void;
    onLogout: () => void;
}

interface MenuItem {
    id: 'profile' | 'learning-center' | 'logout';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'default' | 'danger';
    onSelect: () => void;
}

export function UserMenu({
    name,
    title,
    tier,
    className,
    triggerClassName,
    containerRef,
    onOpenProfile,
    onOpenLearningCenter,
    onLogout
}: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const localContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!localContainerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleSelect = (action: () => void) => {
        setIsOpen(false);
        action();
    };

    const items: MenuItem[] = [
        {
            id: 'profile',
            label: 'Profile',
            icon: UserRound,
            onSelect: onOpenProfile
        },
        {
            id: 'learning-center',
            label: 'Learning Center',
            icon: GraduationCap,
            onSelect: onOpenLearningCenter
        },
        {
            id: 'logout',
            label: 'Log Out',
            icon: LogOut,
            tone: 'danger',
            onSelect: onLogout
        }
    ];

    return (
        <div
            ref={(node) => {
                localContainerRef.current = node;
                if (containerRef) {
                    containerRef.current = node;
                }
            }}
            className={cn('relative', className)}
        >
            <ProfilePanel
                compact
                name={name}
                title={title}
                tier={tier}
                onClick={() => setIsOpen((current) => !current)}
                className={triggerClassName}
            />

            <div
                className={cn(
                    'absolute right-0 top-[calc(100%+0.55rem)] z-[120] w-[12.75rem] origin-top-right rounded-[22px] border border-[var(--panel-border)] bg-[color:var(--panel-strong)]/98 p-1.5 shadow-[0_26px_54px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-200 ease-out dark:shadow-[0_28px_64px_rgba(2,6,23,0.46)]',
                    isOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-3 scale-95 opacity-0'
                )}
            >
                <div className="rounded-[16px] border border-[var(--panel-border)] bg-[var(--panel)]/78 px-3 py-2.5">
                    <div className="truncate text-[13px] font-semibold text-[var(--foreground)]">{name}</div>
                    <div className="mt-0.5 truncate text-[10px] text-[var(--foreground-muted)]">{title}</div>
                </div>

                <div className="mt-1.5 space-y-1">
                    {items.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelect(item.onSelect)}
                                className={cn(
                                    'group flex w-full items-center gap-2.5 rounded-[16px] px-3 py-2.5 text-left transition-all duration-200',
                                    item.tone === 'danger'
                                        ? 'text-rose-500 hover:bg-rose-500/8'
                                        : 'text-[var(--foreground-soft)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]'
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                                        item.tone === 'danger'
                                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                                            : 'border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground-muted)] group-hover:text-sky-600'
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold">{item.label}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

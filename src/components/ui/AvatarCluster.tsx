'use client';

import React from 'react';

import { TeamMember } from '@/types';
import { cn } from '@/lib/utils';

interface AvatarClusterProps {
    members: TeamMember[];
    maxVisible?: number;
    size?: 'sm' | 'md';
}

export function AvatarCluster({ members, maxVisible = 3, size = 'md' }: AvatarClusterProps) {
    const visibleMembers = members.slice(0, maxVisible);
    const hiddenCount = Math.max(members.length - maxVisible, 0);
    const sizeClass = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs';

    return (
        <div className="flex items-center">
            {visibleMembers.map((member, index) => (
                <div
                    key={member.id}
                    className={cn(
                        'group relative flex items-center justify-center rounded-full border-2 border-white font-semibold text-white shadow-sm',
                        sizeClass,
                        index === 0 ? '' : '-ml-2',
                        `bg-gradient-to-br ${member.avatarColor}`
                    )}
                >
                    {member.initials}
                    <div className="pointer-events-none absolute -top-10 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
                        {member.name}
                    </div>
                    <span
                        className={cn(
                            'absolute bottom-0 right-0 rounded-full border-2 border-white',
                            size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3',
                            member.status === 'online'
                                ? 'bg-emerald-400'
                                : member.status === 'away'
                                    ? 'bg-amber-400'
                                    : 'bg-slate-400'
                        )}
                    />
                </div>
            ))}
            {hiddenCount > 0 && (
                <div className={cn('relative -ml-2 flex items-center justify-center rounded-full border-2 border-white bg-slate-200 font-semibold text-slate-600', sizeClass)}>
                    +{hiddenCount}
                </div>
            )}
        </div>
    );
}

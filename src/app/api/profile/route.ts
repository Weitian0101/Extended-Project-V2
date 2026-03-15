import { NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { getWorkspaceShell, updateCurrentUserProfile } from '@/lib/server/workspaceRepository';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export async function PATCH(request: Request) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const updates = await request.json();
        await updateCurrentUserProfile(updates);
        const workspace = await getWorkspaceShell();
        const guidePreferenceUpdates = isRecord(updates) && isRecord(updates.guidePreferences)
            ? updates.guidePreferences
            : null;
        const resolvedProfile = {
            ...workspace.profile,
            guidePreferences: {
                ...workspace.profile.guidePreferences,
                ...guidePreferenceUpdates
            }
        };

        return NextResponse.json({
            profile: resolvedProfile
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update profile.';
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

import { NextResponse } from 'next/server';

import { ensureProfileForCurrentUser, getWorkspaceShell } from '@/lib/server/workspaceRepository';
import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { toErrorMessage } from '@/lib/server/errors';

export async function POST() {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ mode: 'local-mvp' });
    }

    try {
        await ensureProfileForCurrentUser();
        const workspace = await getWorkspaceShell();

        return NextResponse.json({
            mode: 'remote-supabase',
            workspace
        });
    } catch (error) {
        const message = toErrorMessage(error, 'Unable to bootstrap authenticated session.');
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

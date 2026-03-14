import { NextResponse } from 'next/server';

import { getBackendMode, isRemoteBackendEnabled } from '@/lib/config/backend';
import { getWorkspaceShell } from '@/lib/server/workspaceRepository';

export async function GET() {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({
            mode: getBackendMode()
        });
    }

    try {
        const workspace = await getWorkspaceShell();

        return NextResponse.json({
            mode: getBackendMode(),
            workspace
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load workspace.';
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

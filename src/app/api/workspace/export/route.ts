import { NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { exportWorkspaceSnapshotForCurrentUser } from '@/lib/server/workspaceRepository';

export async function GET() {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const snapshot = await exportWorkspaceSnapshotForCurrentUser();
        return NextResponse.json({ snapshot });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to export workspace.';
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

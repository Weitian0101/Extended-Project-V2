import { NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { importWorkspaceSnapshotForCurrentUser } from '@/lib/server/workspaceRepository';

export async function POST(request: Request) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const result = await importWorkspaceSnapshotForCurrentUser(body.snapshot);

        return NextResponse.json({ result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to import workspace.';
        const status = message === 'Unauthenticated'
            ? 401
            : message.includes('Backup')
                ? 400
                : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

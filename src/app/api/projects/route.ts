import { NextResponse } from 'next/server';

import { createProjectForCurrentUser } from '@/lib/server/workspaceRepository';
import { isRemoteBackendEnabled } from '@/lib/config/backend';

export async function POST(request: Request) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const project = await createProjectForCurrentUser(body?.name);

        return NextResponse.json({ project });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create project.';
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

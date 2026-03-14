import { NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { getProjectHub, updateProjectHubBrief } from '@/lib/server/projectHubRepository';

interface RouteContext {
    params: Promise<{
        projectId: string;
    }>;
}

export async function GET(_request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId } = await context.params;
        const hub = await getProjectHub(projectId);
        return NextResponse.json({ hub });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load project hub.';
        const status = message === 'Unauthenticated' ? 401 : message === 'Forbidden' ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function PATCH(request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId } = await context.params;
        const body = await request.json().catch(() => ({}));
        const brief = await updateProjectHubBrief(projectId, body);

        return NextResponse.json({ brief });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save project brief.';
        const status = message === 'Unauthenticated' ? 401 : message === 'Forbidden' ? 403 : message.startsWith('Conflict:') ? 409 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

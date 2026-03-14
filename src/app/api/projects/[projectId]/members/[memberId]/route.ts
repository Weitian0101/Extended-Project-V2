import { NextResponse } from 'next/server';

import { updateProjectMember } from '@/lib/server/workspaceRepository';
import { isRemoteBackendEnabled } from '@/lib/config/backend';

interface RouteContext {
    params: Promise<{
        projectId: string;
        memberId: string;
    }>;
}

export async function PATCH(request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId, memberId } = await context.params;
        const body = await request.json();

        await updateProjectMember(projectId, memberId, body);
        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update project member.';
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

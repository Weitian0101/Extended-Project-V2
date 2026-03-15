import { NextResponse } from 'next/server';

import { removeProjectMember, updateProjectMember } from '@/lib/server/workspaceRepository';
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
        const status = message === 'Unauthenticated'
            ? 401
            : message === 'Forbidden'
                ? 403
                : message === 'Owners cannot change their own permission.'
                    ? 400
                    : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId, memberId } = await context.params;
        await removeProjectMember(projectId, memberId);
        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to remove project member.';
        const status = message === 'Unauthenticated'
            ? 401
            : message === 'Forbidden'
                ? 403
                : (message === 'Owners cannot remove themselves from the project.'
                    || message === 'Remove or transfer project ownership before deleting this member.')
                    ? 400
                    : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

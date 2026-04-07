import { NextResponse } from 'next/server';

import { deleteProject, updateProjectSummary } from '@/lib/server/workspaceRepository';
import { isRemoteBackendEnabled } from '@/lib/config/backend';

interface RouteContext {
    params: Promise<{
        projectId: string;
    }>;
}

export async function PATCH(request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId } = await context.params;
        const body = await request.json();

        await updateProjectSummary(projectId, body);
        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update project.';
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId } = await context.params;
        await deleteProject(projectId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete project.';
        const status = message === 'Unauthenticated'
            ? 401
            : message === 'Forbidden'
                ? 403
                : message === 'Project not found.'
                    ? 404
                    : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

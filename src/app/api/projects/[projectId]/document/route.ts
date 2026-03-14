import { NextResponse } from 'next/server';

import { getProjectDocument, saveProjectDocument } from '@/lib/server/workspaceRepository';
import { isRemoteBackendEnabled } from '@/lib/config/backend';

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
        const document = await getProjectDocument(projectId);

        return NextResponse.json({ document });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load project.';
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

export async function PUT(request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId } = await context.params;
        const body = await request.json();

        await saveProjectDocument(projectId, body.document);
        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save project.';
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

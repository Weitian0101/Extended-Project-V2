import { NextResponse } from 'next/server';

import { addProjectMemberByEmail } from '@/lib/server/workspaceRepository';
import { isRemoteBackendEnabled } from '@/lib/config/backend';

interface RouteContext {
    params: Promise<{
        projectId: string;
    }>;
}

export async function POST(request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId } = await context.params;
        const body = await request.json();

        const result = await addProjectMemberByEmail(projectId, body.email, body.permission);
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to add project member.';
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

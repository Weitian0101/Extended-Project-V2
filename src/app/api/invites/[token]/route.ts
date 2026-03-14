import { NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { acceptProjectInvite, getProjectInviteByToken } from '@/lib/server/workspaceRepository';

interface RouteContext {
    params: Promise<{
        token: string;
    }>;
}

export async function GET(_request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { token } = await context.params;
        const invite = await getProjectInviteByToken(token);

        return NextResponse.json({ invite });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load invite.';
        const status = message === 'Invite not found.' ? 404 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(_request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { token } = await context.params;
        const projectId = await acceptProjectInvite(token);

        return NextResponse.json({ ok: true, projectId });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to accept invite.';
        const status = message === 'Unauthenticated'
            ? 401
            : message === 'Invite not found or already used.'
                ? 404
                : 400;

        return NextResponse.json({ error: message }, { status });
    }
}

import { NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { revokeProjectInvite } from '@/lib/server/workspaceRepository';

interface RouteContext {
    params: Promise<{
        projectId: string;
        inviteId: string;
    }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId, inviteId } = await context.params;
        const invite = await revokeProjectInvite(projectId, inviteId);
        return NextResponse.json({ invite });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to revoke invite.';
        const status = message === 'Unauthenticated'
            ? 401
            : message === 'Forbidden'
                ? 403
                : message === 'Invite not found.'
                    ? 404
                    : 400;

        return NextResponse.json({ error: message }, { status });
    }
}

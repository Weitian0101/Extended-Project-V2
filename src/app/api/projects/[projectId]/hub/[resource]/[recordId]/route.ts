import { NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { deleteProjectHubCollectionRecord, updateProjectHubCollectionRecord } from '@/lib/server/projectHubRepository';

interface RouteContext {
    params: Promise<{
        projectId: string;
        resource: string;
        recordId: string;
    }>;
}

const MUTABLE_RESOURCES = new Set([
    'cards',
    'artifacts',
    'sessions',
    'decisions',
    'threads',
    'tasks',
    'presence'
]);

const DELETABLE_RESOURCES = new Set([
    'cards',
    'artifacts',
    'sessions',
    'decisions',
    'threads',
    'tasks'
]);

export async function PATCH(request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId, resource, recordId } = await context.params;
        if (!MUTABLE_RESOURCES.has(resource)) {
            return NextResponse.json({ error: 'Unsupported collaboration resource.' }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));
        const item = await updateProjectHubCollectionRecord(
            projectId,
            resource as Parameters<typeof updateProjectHubCollectionRecord>[1],
            recordId,
            body
        );
        return NextResponse.json({ item });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update collaboration record.';
        const status = message === 'Unauthenticated' ? 401 : message === 'Forbidden' ? 403 : message.startsWith('Conflict:') ? 409 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId, resource, recordId } = await context.params;
        if (!DELETABLE_RESOURCES.has(resource)) {
            return NextResponse.json({ error: 'Unsupported collaboration resource.' }, { status: 404 });
        }

        const result = await deleteProjectHubCollectionRecord(
            projectId,
            resource as Parameters<typeof deleteProjectHubCollectionRecord>[1],
            recordId
        );
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete collaboration record.';
        const status = message === 'Unauthenticated' ? 401 : message === 'Forbidden' ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

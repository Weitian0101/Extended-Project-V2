import { NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { createProjectHubCollectionRecord, listProjectHubCollection } from '@/lib/server/projectHubRepository';

interface RouteContext {
    params: Promise<{
        projectId: string;
        resource: string;
    }>;
}

const SUPPORTED_RESOURCES = new Set([
    'cards',
    'artifacts',
    'sessions',
    'decisions',
    'threads',
    'tasks',
    'activity',
    'presence'
]);

export async function GET(_request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId, resource } = await context.params;
        if (!SUPPORTED_RESOURCES.has(resource)) {
            return NextResponse.json({ error: 'Unsupported collaboration resource.' }, { status: 404 });
        }

        const items = await listProjectHubCollection(projectId, resource as Parameters<typeof listProjectHubCollection>[1]);
        return NextResponse.json({ items });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load collaboration resource.';
        const status = message === 'Unauthenticated' ? 401 : message === 'Forbidden' ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    try {
        const { projectId, resource } = await context.params;
        if (!SUPPORTED_RESOURCES.has(resource)) {
            return NextResponse.json({ error: 'Unsupported collaboration resource.' }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));
        const item = await createProjectHubCollectionRecord(projectId, resource as Parameters<typeof createProjectHubCollectionRecord>[1], body);
        return NextResponse.json({ item });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create collaboration record.';
        const status = message === 'Unauthenticated' ? 401 : message === 'Forbidden' ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

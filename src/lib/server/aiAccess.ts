import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { getAuthenticatedUser } from '@/lib/server/workspaceRepository';

export async function assertAiRouteAccess() {
    if (!isRemoteBackendEnabled()) {
        return;
    }

    const user = await getAuthenticatedUser();

    if (!user) {
        throw new Error('Unauthenticated');
    }
}

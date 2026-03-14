'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    appendActivityEvent,
    createEmptyProjectHubData,
    normalizeProjectHubData,
    updatePresenceEntry
} from '@/lib/collaboration';
import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { loadProjectHub, saveProjectHub } from '@/lib/services/mvpWorkspace';
import {
    ActivityEvent,
    CollaborationEntityType,
    CommentThread,
    DecisionLogEntry,
    PresenceState,
    ProjectArtifact,
    ProjectBrief,
    ProjectContext,
    ProjectHubData,
    ProjectSession,
    TaskItem,
    UserProfileData
} from '@/types';

type HubCollectionResource = 'cards' | 'artifacts' | 'sessions' | 'decisions' | 'threads' | 'tasks' | 'activity' | 'presence';

type HubRecordMap = {
    cards: ProjectHubData['cards'][number];
    artifacts: ProjectArtifact;
    sessions: ProjectSession;
    decisions: DecisionLogEntry;
    threads: CommentThread;
    tasks: TaskItem;
    activity: ActivityEvent;
    presence: PresenceState;
};

async function parseResponse<T>(response: Response): Promise<T> {
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(body.error || 'Request failed.');
    }

    return body as T;
}

function replaceRecord<T extends { id: string }>(items: T[], next: T) {
    return items.map((item) => item.id === next.id ? next : item);
}

export function useProjectHubData({
    projectId,
    projectName,
    profile,
    context
}: {
    projectId: string;
    projectName: string;
    profile: UserProfileData;
    context: ProjectContext;
}) {
    const remoteMode = useMemo(() => isRemoteBackendEnabled(), []);
    const [hub, setHub] = useState<ProjectHubData>(() => createEmptyProjectHubData({
        projectId,
        updatedBy: profile.id || 'user',
        context
    }));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadHub = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (remoteMode) {
                    const result = await parseResponse<{ hub: ProjectHubData }>(
                        await fetch(`/api/projects/${projectId}/hub`, { cache: 'no-store' })
                    );

                    if (isMounted) {
                        setHub(result.hub);
                    }
                } else if (isMounted) {
                    setHub(loadProjectHub(projectId, projectName, profile.id || 'user'));
                }
            } catch (loadError) {
                if (isMounted) {
                    setError(loadError instanceof Error ? loadError.message : 'Unable to load project hub.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadHub();

        return () => {
            isMounted = false;
        };
    }, [projectId, projectName, profile.id, remoteMode]);

    const updateBrief = useCallback(async (updates: Partial<ProjectBrief>) => {
        if (remoteMode) {
            const result = await parseResponse<{ brief: ProjectBrief }>(
                await fetch(`/api/projects/${projectId}/hub`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...hub.brief,
                        ...updates
                    })
                })
            );

            setHub((current) => ({
                ...current,
                brief: result.brief
            }));
            return result.brief;
        }

        let nextBrief = hub.brief;

        setHub((current) => {
            nextBrief = {
                ...current.brief,
                ...updates,
                version: current.brief.version + 1,
                updatedAt: new Date().toISOString(),
                updatedBy: profile.id || 'user'
            };

            const nextHub = {
                ...current,
                brief: nextBrief
            };

            saveProjectHub(projectId, nextHub);
            return nextHub;
        });

        return nextBrief;
    }, [hub.brief, profile.id, projectId, remoteMode]);

    const createRecord = useCallback(async <TResource extends Exclude<HubCollectionResource, 'activity'>>(resource: TResource, payload: Partial<HubRecordMap[TResource]>) => {
        if (remoteMode) {
            const result = await parseResponse<{ item: HubRecordMap[TResource] }>(
                await fetch(`/api/projects/${projectId}/hub/${resource}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
            );

            setHub((current) => ({
                ...current,
                [resource]: [result.item, ...(current[resource] as HubRecordMap[TResource][])]
            }));
            return result.item;
        }

        const actorId = profile.id || 'user';
        const actorName = profile.name;
        const now = new Date().toISOString();
        let createdItem: HubRecordMap[TResource] | null = null;

        setHub((current) => {
            const currentHub = normalizeProjectHubData(current, current);
            const nextActivity = resource === 'presence'
                ? currentHub.activity
                : appendActivityEvent(currentHub.activity, {
                    projectId,
                    actorId,
                    actorName,
                    action: resource === 'artifacts' ? 'captured' : resource === 'sessions' ? 'scheduled' : resource === 'threads' ? 'commented' : resource === 'tasks' ? 'assigned' : 'created',
                    entityType: resource === 'threads' ? 'task' : resource.slice(0, -1) as CollaborationEntityType,
                    entityId: payload.id || projectId,
                    message: `Updated ${resource}.`
                });

            let nextResource: ProjectHubData[TResource];

            if (resource === 'presence') {
                const presencePayload = payload as Partial<PresenceState>;

                nextResource = updatePresenceEntry(currentHub.presence, {
                    projectId,
                    userId: actorId,
                    userName: actorName,
                    surface: getSurfaceFromPayload(presencePayload),
                    objectType: presencePayload.objectType,
                    objectId: presencePayload.objectId
                }) as ProjectHubData[TResource];
            } else {
                nextResource = [{
                    ...payload,
                    id: crypto.randomUUID(),
                    projectId,
                    createdAt: now,
                    updatedAt: now,
                    createdBy: actorId,
                    updatedBy: actorId,
                    version: 1,
                    status: (payload as { status?: string }).status || 'open',
                    metadata: (payload as { metadata?: Record<string, string | number | boolean | null> }).metadata || {}
                }, ...(currentHub[resource] as HubRecordMap[TResource][])] as ProjectHubData[TResource];
            }

            createdItem = Array.isArray(nextResource) ? nextResource[0] as HubRecordMap[TResource] : null;

            const nextHub = {
                ...currentHub,
                [resource]: nextResource,
                activity: nextActivity
            } as ProjectHubData;

            saveProjectHub(projectId, nextHub);
            return nextHub;
        });

        return createdItem;
    }, [profile.id, profile.name, projectId, remoteMode]);

    const updateRecord = useCallback(async <TResource extends Exclude<HubCollectionResource, 'activity'>>(resource: TResource, recordId: string, payload: Partial<HubRecordMap[TResource]>) => {
        if (remoteMode) {
            const result = await parseResponse<{ item: HubRecordMap[TResource] }>(
                await fetch(`/api/projects/${projectId}/hub/${resource}/${recordId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
            );

            setHub((current) => ({
                ...current,
                [resource]: replaceRecord(current[resource] as HubRecordMap[TResource][], result.item)
            }));
            return result.item;
        }

        let updatedItem: HubRecordMap[TResource] | null = null;

        setHub((current) => {
            const nextHub = {
                ...current,
                [resource]: (current[resource] as HubRecordMap[TResource][]).map((item) => {
                    if (item.id !== recordId) {
                        return item;
                    }

                    updatedItem = {
                        ...item,
                        ...payload,
                        updatedAt: new Date().toISOString(),
                        updatedBy: profile.id || 'user',
                        version: item.version + 1
                    };

                    return updatedItem;
                })
            } as ProjectHubData;

            saveProjectHub(projectId, nextHub);
            return nextHub;
        });

        return updatedItem;
    }, [profile.id, projectId, remoteMode]);

    const deleteRecord = useCallback(async (resource: Exclude<HubCollectionResource, 'activity' | 'presence'>, recordId: string) => {
        if (remoteMode) {
            await parseResponse<{ ok: true }>(
                await fetch(`/api/projects/${projectId}/hub/${resource}/${recordId}`, {
                    method: 'DELETE'
                })
            );
        }

        setHub((current) => {
            const nextHub = {
                ...current,
                [resource]: current[resource].filter((item: { id: string }) => item.id !== recordId)
            } as ProjectHubData;

            saveProjectHub(projectId, nextHub);
            return nextHub;
        });
    }, [projectId, remoteMode]);

    return {
        hub,
        isLoading,
        error,
        setHub,
        updateBrief,
        createRecord,
        updateRecord,
        deleteRecord
    };
}

function getSurfaceFromPayload(payload: Partial<PresenceState>) {
    return payload.surface || 'hub';
}

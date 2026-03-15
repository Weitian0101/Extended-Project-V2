import { useEffect, useRef, useState } from 'react';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { ProjectData } from '@/types';
import { loadProjectDocument, saveProjectDocument } from '@/lib/services/mvpWorkspace';
import { fetchApiJson, fetchApiResponse } from '@/lib/services/remoteApi';

export function useProjectData(projectId?: string, projectName?: string) {
    const remoteBackendEnabled = isRemoteBackendEnabled();
    const [resolvedProjectId, setResolvedProjectId] = useState(projectId || 'default');
    const [project, setProjectState] = useState<ProjectData>(loadProjectDocument(projectId, projectName));
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canPersistRemote, setCanPersistRemote] = useState(!remoteBackendEnabled);
    const lastPersistedSnapshotRef = useRef<string>('');

    // Load project state from the active backend mode.
    useEffect(() => {
        const loadProject = async () => {
            try {
                setError(null);

                if (remoteBackendEnabled && projectId) {
                    setCanPersistRemote(false);
                    const body = await fetchApiJson<{ document: ProjectData }>(`/api/projects/${projectId}/document`, {
                        cache: 'no-store'
                    });

                    setResolvedProjectId(body.document.id);
                    setProjectState(body.document);
                    lastPersistedSnapshotRef.current = JSON.stringify(body.document);
                    setCanPersistRemote(true);
                    return;
                }

                const nextProject = loadProjectDocument(projectId, projectName);
                setResolvedProjectId(nextProject.id);
                setProjectState(nextProject);
                lastPersistedSnapshotRef.current = JSON.stringify(nextProject);
                setCanPersistRemote(false);
            } catch (error) {
                setCanPersistRemote(false);
                setError(error instanceof Error ? error.message : 'Unable to load project.');
            } finally {
                setIsLoaded(true);
            }
        };

        void loadProject();
    }, [projectId, projectName, remoteBackendEnabled]);

    // Persist project state to the active backend mode.
    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        const snapshot = JSON.stringify({
            ...project,
            id: resolvedProjectId
        });

        if (snapshot === lastPersistedSnapshotRef.current) {
            return;
        }

        if (remoteBackendEnabled && !canPersistRemote) {
            return;
        }

        if (!remoteBackendEnabled) {
            saveProjectDocument({
                ...project,
                id: resolvedProjectId
            });
            lastPersistedSnapshotRef.current = snapshot;
            return;
        }

        const timer = window.setTimeout(async () => {
            try {
                const response = await fetchApiResponse(`/api/projects/${resolvedProjectId}/document`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document: {
                            ...project,
                            id: resolvedProjectId
                        }
                    })
                });

                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(body.error || 'Failed to save project.');
                }

                lastPersistedSnapshotRef.current = snapshot;
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Unable to save project.');
            }
        }, 450);

        return () => {
            window.clearTimeout(timer);
        };
    }, [canPersistRemote, project, isLoaded, remoteBackendEnabled, resolvedProjectId]);

    const updateProject = (updates: Partial<ProjectData>) => {
        setProjectState((prev) => ({ ...prev, ...updates }));
    };

    return { project, setProject: setProjectState, updateProject, isLoaded, error };
}

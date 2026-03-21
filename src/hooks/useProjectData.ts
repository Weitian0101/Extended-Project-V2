import { useEffect, useRef, useState } from 'react';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { ProjectData } from '@/types';
import { hasProjectDocumentCache, loadProjectDocument, saveProjectDocument } from '@/lib/services/mvpWorkspace';
import { fetchApiJson, fetchApiResponse } from '@/lib/services/remoteApi';

export function useProjectData(projectId?: string, projectName?: string) {
    const remoteBackendEnabled = isRemoteBackendEnabled();
    const [resolvedProjectId, setResolvedProjectId] = useState(projectId || 'default');
    const [project, setProjectState] = useState<ProjectData>(loadProjectDocument(projectId, projectName));
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasCachedProject, setHasCachedProject] = useState(() => hasProjectDocumentCache(projectId));
    const [error, setError] = useState<string | null>(null);
    const [canPersistRemote, setCanPersistRemote] = useState(!remoteBackendEnabled);
    const lastPersistedSnapshotRef = useRef<string>('');

    // Load project state from the active backend mode.
    useEffect(() => {
        const loadProject = async () => {
            try {
                setError(null);
                setHasCachedProject(hasProjectDocumentCache(projectId));

                if (remoteBackendEnabled && projectId) {
                    setCanPersistRemote(false);
                    const body = await fetchApiJson<{ document: ProjectData }>(`/api/projects/${projectId}/document`, {
                        cache: 'no-store'
                    });

                    setResolvedProjectId(body.document.id);
                    setProjectState(body.document);
                    saveProjectDocument(body.document);
                    lastPersistedSnapshotRef.current = JSON.stringify(body.document);
                    setHasCachedProject(true);
                    setCanPersistRemote(true);
                    return;
                }

                const nextProject = loadProjectDocument(projectId, projectName);
                setResolvedProjectId(nextProject.id);
                setProjectState(nextProject);
                saveProjectDocument(nextProject);
                lastPersistedSnapshotRef.current = JSON.stringify(nextProject);
                setHasCachedProject(true);
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
                const nextProject = {
                    ...project,
                    id: resolvedProjectId
                };
                const response = await fetchApiResponse(`/api/projects/${resolvedProjectId}/document`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        document: nextProject
                    })
                });

                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(body.error || 'Failed to save project.');
                }

                saveProjectDocument(nextProject);
                lastPersistedSnapshotRef.current = snapshot;
                setHasCachedProject(true);
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

    return { project, setProject: setProjectState, updateProject, isLoaded, hasCachedProject, error };
}

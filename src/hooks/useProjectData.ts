import { useEffect, useRef, useState } from 'react';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { ProjectData } from '@/types';
import { loadProjectDocument, saveProjectDocument } from '@/lib/services/mvpWorkspace';

export function useProjectData(projectId?: string, projectName?: string) {
    const remoteBackendEnabled = isRemoteBackendEnabled();
    const [resolvedProjectId, setResolvedProjectId] = useState(projectId || 'default');
    const [project, setProjectState] = useState<ProjectData>(loadProjectDocument(projectId, projectName));
    const [isLoaded, setIsLoaded] = useState(false);
    const lastPersistedSnapshotRef = useRef<string>('');

    // Load project state from the active backend mode.
    useEffect(() => {
        const loadProject = async () => {
            try {
                if (remoteBackendEnabled && projectId) {
                    const response = await fetch(`/api/projects/${projectId}/document`, {
                        cache: 'no-store'
                    });
                    const body = await response.json();

                    if (!response.ok) {
                        throw new Error(body.error || 'Failed to load project.');
                    }

                    setResolvedProjectId(body.document.id);
                    setProjectState(body.document);
                    lastPersistedSnapshotRef.current = JSON.stringify(body.document);
                    return;
                }

                const nextProject = loadProjectDocument(projectId, projectName);
                setResolvedProjectId(nextProject.id);
                setProjectState(nextProject);
                lastPersistedSnapshotRef.current = JSON.stringify(nextProject);
            } catch (error) {
                console.error('Failed to load project data', error);
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
                const response = await fetch(`/api/projects/${resolvedProjectId}/document`, {
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
                console.error('Failed to persist project data', error);
            }
        }, 450);

        return () => {
            window.clearTimeout(timer);
        };
    }, [project, isLoaded, remoteBackendEnabled, resolvedProjectId]);

    const updateProject = (updates: Partial<ProjectData>) => {
        setProjectState((prev) => ({ ...prev, ...updates }));
    };

    return { project, setProject: setProjectState, updateProject, isLoaded };
}

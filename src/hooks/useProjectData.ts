import { useState, useEffect } from 'react';
import { ProjectData } from '@/types';
const getStorageKey = (projectId: string) => `innovation_sandbox_authoritative_${projectId}`;

const createDefaultProject = (projectId: string, projectName?: string): ProjectData => ({
    id: projectId,
    context: {
        name: projectName || 'New Innovation Project',
        background: '',
        objectives: '',
        assumptions: ''
    },
    currentStage: 'overview',
    toolRuns: []
});

export function useProjectData(projectId?: string, projectName?: string) {
    const [resolvedProjectId, setResolvedProjectId] = useState(projectId || 'default');
    const [project, setProjectState] = useState<ProjectData>(createDefaultProject(projectId || 'default', projectName));
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const activeProjectId = projectId || localStorage.getItem('app_project_id') || 'default';
            setResolvedProjectId(activeProjectId);

            const stored = localStorage.getItem(getStorageKey(activeProjectId));
            if (stored) {
                const parsed = JSON.parse(stored);
                // Migration safety
                if (!parsed.context) parsed.context = createDefaultProject(activeProjectId, projectName).context;
                setProjectState(parsed);
            } else {
                setProjectState(createDefaultProject(activeProjectId, projectName));
            }
        } catch (error) {
            console.error('Failed to load project data', error);
        } finally {
            setIsLoaded(true);
        }
    }, [projectId, projectName]);

    // Save to local storage whenever project changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(getStorageKey(resolvedProjectId), JSON.stringify(project));
        }
    }, [project, isLoaded, resolvedProjectId]);

    const updateProject = (updates: Partial<ProjectData>) => {
        setProjectState((prev) => ({ ...prev, ...updates }));
    };

    return { project, setProject: setProjectState, updateProject, isLoaded };
}

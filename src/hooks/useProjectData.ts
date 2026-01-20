import { useState, useEffect } from 'react';
import { ProjectData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'innovation_sandbox_authoritative';

const DEFAULT_PROJECT: ProjectData = {
    id: uuidv4(),
    context: {
        name: 'New Innovation Project',
        background: '',
        objectives: '',
        assumptions: ''
    },
    currentStage: 'overview',
    toolRuns: []
};

export function useProjectData() {
    const [project, setProjectState] = useState<ProjectData>(DEFAULT_PROJECT);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Migration safety
                if (!parsed.context) parsed.context = DEFAULT_PROJECT.context;
                setProjectState(parsed);
            }
        } catch (error) {
            console.error('Failed to load project data', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to local storage whenever project changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        }
    }, [project, isLoaded]);

    const updateProject = (updates: Partial<ProjectData>) => {
        setProjectState((prev) => ({ ...prev, ...updates }));
    };

    return { project, setProject: setProjectState, updateProject, isLoaded };
}

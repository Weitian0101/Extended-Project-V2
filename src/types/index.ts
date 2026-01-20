export type StageId = 'overview' | 'explore' | 'imagine' | 'implement' | 'tell-story';

export interface AiPrompt {
    id: string;
    label: string; // The button text
    promptTemplate: string; // The text sent to AI
}

export interface MethodCard {
    id: string;
    stage: StageId;
    title: string;
    purpose: string;
    image: string; // Path to reference image
    aiPrompts: AiPrompt[];
}

export interface ToolRun {
    id: string;
    methodCardId: string;
    methodCardTitle: string;
    stage: StageId;
    createdAt: number;
    updatedAt: number;
    aiResponses: { prompt: string; response: string; timestamp: number }[];
}

export interface ProjectContext {
    name: string;
    background: string;
    objectives: string;
    assumptions: string;
}

export interface ProjectData {
    id: string;
    context: ProjectContext; // Persistent context layer
    currentStage: StageId;
    toolRuns: ToolRun[];
}

export interface ProjectState {
    project: ProjectData;
    setProject: (project: ProjectData) => void;
    updateProject: (updates: Partial<ProjectData>) => void;
}

export type StageId = 'overview' | 'explore' | 'imagine' | 'implement' | 'test' | 'tell-story';

export interface AiPrompt {
    id: string;
    label: string; // The button text
    promptTemplate: string; // The text sent to AI
}

export interface MethodStep {
    id: string;
    title?: string;
    type: 'diverge' | 'input' | 'text' | 'textarea' | 'select' | 'checkbox' | 'instruction';
    facilitatorText?: string;
    placeholder?: string;
    aiCapability?: 'none' | 'generate' | 'critique' | 'elaborate' | 'refine';
    question?: string; // For ToolWorkspace
    options?: string[]; // For ToolWorkspace
}

export interface MethodCard {
    id: string;
    stage: StageId;
    title: string;
    purpose: string;
    image: string; // Path to reference image
    aiPrompts: AiPrompt[];
    steps?: MethodStep[]; // For SessionWorkspace
    template?: MethodStep[]; // For ToolWorkspace
    hint?: string; // For ToolWorkspace
}

export interface ToolRun {
    id: string;
    methodCardId: string;
    methodCardTitle: string;
    stage: StageId;
    createdAt: number;
    updatedAt: number;
    currentStepIndex?: number; // Optional for legacy
    data?: Record<string, any>; // For SessionWorkspace
    answers?: Record<string, any>; // For ToolWorkspace
    aiResponses?: { prompt: string; response: string; timestamp: number }[];
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

export interface StickyNote {
    id: string;
    content: string;
    color?: 'yellow' | 'blue' | 'green' | 'pink';
    tags?: string[];
}

export interface PrototypeArtifact {
    id: string;
    title: string;
    description: string;
    type: string;
    content: string;
}

export interface FeedbackItem {
    id: string;
    content: string;
    userId?: string;
}

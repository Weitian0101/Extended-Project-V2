import { AiResponseEntry, MethodStep, ProjectContext, ProjectData, ToolFieldValue, UserProfileData, WorkspaceProject } from '@/types';

export type RuntimeMode = 'local-mvp' | 'remote-supabase';
export type ResponseSource = 'local-mock' | 'remote-supabase';
export type WorkspaceExportVersion = 'local-mvp-v1' | 'remote-supabase-v1';

export interface WorkspaceShellDto {
    projects: WorkspaceProject[];
    profile: UserProfileData;
}

export interface WorkspaceExportDto {
    version: WorkspaceExportVersion;
    mode: RuntimeMode;
    exportedAt: string;
    workspace: WorkspaceShellDto;
    projectDocuments: ProjectData[];
}

export interface AuthSessionDto {
    userId: string;
    email: string;
    displayName: string;
    provider: 'demo';
    isAuthenticated: boolean;
}

export interface AiPromptBoardRequest {
    methodId: string;
    methodTitle: string;
    stage: string;
    project: ProjectContext;
    promptLabel: string;
    promptTemplate: string;
}

export interface AiFacilitatorChatRequest {
    methodId: string;
    methodTitle: string;
    stage: string;
    project: ProjectContext;
    message: string;
    history: AiResponseEntry[];
}

export interface AiStepAssistRequest {
    methodId: string;
    methodTitle: string;
    stage: string;
    project: ProjectContext;
    stepId: string;
    stepTitle?: string;
    stepType: MethodStep['type'];
    facilitatorText?: string;
    currentValue?: ToolFieldValue;
}

export interface AiTextResponse {
    mode: RuntimeMode;
    source: ResponseSource;
    reply: string;
}

export interface AiStepAssistResponse {
    mode: RuntimeMode;
    source: ResponseSource;
    nextValue: ToolFieldValue;
    summary: string;
}

import { StageId } from '@/types';

type BrowsableStage = Extract<StageId, 'explore' | 'imagine' | 'implement' | 'tell-story'>;

export interface StageMethodSessionState {
    viewState: 'entry' | 'tools' | 'workspace';
    activeMethodId: string | null;
    activeRunId: string | null;
    activeCategory: string;
}

function isBrowser() {
    return typeof window !== 'undefined';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getStorageKey(projectId: string, stage: BrowsableStage) {
    return `innovation_sandbox_stage_method_${projectId}_${stage}`;
}

export function loadStageMethodSession(projectId: string, stage: BrowsableStage): StageMethodSessionState | null {
    if (!isBrowser()) {
        return null;
    }

    try {
        const rawValue = window.sessionStorage.getItem(getStorageKey(projectId, stage));
        if (!rawValue) {
            return null;
        }

        const parsed = JSON.parse(rawValue) as unknown;
        if (!isRecord(parsed)) {
            return null;
        }

        const viewState = parsed.viewState;
        if (viewState !== 'entry' && viewState !== 'tools' && viewState !== 'workspace') {
            return null;
        }

        return {
            viewState,
            activeMethodId: typeof parsed.activeMethodId === 'string' && parsed.activeMethodId.trim() ? parsed.activeMethodId : null,
            activeRunId: typeof parsed.activeRunId === 'string' && parsed.activeRunId.trim() ? parsed.activeRunId : null,
            activeCategory: typeof parsed.activeCategory === 'string' && parsed.activeCategory.trim() ? parsed.activeCategory : 'all'
        };
    } catch (error) {
        console.warn('Failed to restore stage method session', error);
        return null;
    }
}

export function saveStageMethodSession(projectId: string, stage: BrowsableStage, session: StageMethodSessionState) {
    if (!isBrowser()) {
        return;
    }

    window.sessionStorage.setItem(getStorageKey(projectId, stage), JSON.stringify(session));
}

export function clearStageMethodSession(projectId: string, stage: BrowsableStage) {
    if (!isBrowser()) {
        return;
    }

    window.sessionStorage.removeItem(getStorageKey(projectId, stage));
}

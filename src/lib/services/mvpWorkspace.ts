import { DEFAULT_PROJECTS, DEFAULT_USER } from '@/data/workspaceSeed';
import { WorkspaceExportDto, WorkspaceShellDto } from '@/lib/contracts/api';
import { AppViewState, ProjectData } from '@/types';

const STORAGE_KEYS = {
    view: 'app_view',
    activeProjectId: 'app_project_id',
    projects: 'app_projects',
    profile: 'app_profile'
} as const;

const EXPORT_VERSION = 'local-mvp-v1' as const;

export interface WorkspaceSessionState {
    view: AppViewState;
    activeProjectId: string | null;
}

const isBrowser = () => typeof window !== 'undefined';

const getProjectStorageKey = (projectId: string) => `innovation_sandbox_authoritative_${projectId}`;

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

function readJson<T>(key: string, fallback: T): T {
    if (!isBrowser()) {
        return fallback;
    }

    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : fallback;
    } catch (error) {
        console.warn(`Failed to parse local storage key "${key}"`, error);
        return fallback;
    }
}

function writeJson(key: string, value: unknown) {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizeProjectData(projectId: string, projectName?: string, raw?: unknown): ProjectData {
    const base = createDefaultProject(projectId, projectName);

    if (!isRecord(raw)) {
        return base;
    }

    const context = isRecord(raw.context) ? raw.context : {};
    const toolRuns = Array.isArray(raw.toolRuns) ? raw.toolRuns : [];
    const currentStage = typeof raw.currentStage === 'string' ? raw.currentStage : base.currentStage;

    return {
        id: typeof raw.id === 'string' ? raw.id : projectId,
        context: {
            name: typeof context.name === 'string' && context.name.trim() ? context.name : (projectName || base.context.name),
            background: typeof context.background === 'string' ? context.background : '',
            objectives: typeof context.objectives === 'string' ? context.objectives : '',
            assumptions: typeof context.assumptions === 'string' ? context.assumptions : ''
        },
        currentStage: currentStage as ProjectData['currentStage'],
        toolRuns
    };
}

function normalizeWorkspaceShell(raw?: Partial<WorkspaceShellDto>): WorkspaceShellDto {
    return {
        projects: Array.isArray(raw?.projects) && raw.projects.length > 0 ? raw.projects : DEFAULT_PROJECTS,
        profile: raw?.profile ? { ...DEFAULT_USER, ...raw.profile } : DEFAULT_USER
    };
}

export function loadWorkspaceShell(): WorkspaceShellDto {
    return normalizeWorkspaceShell({
        projects: readJson(STORAGE_KEYS.projects, DEFAULT_PROJECTS),
        profile: readJson(STORAGE_KEYS.profile, DEFAULT_USER)
    });
}

export function saveWorkspaceShell(shell: WorkspaceShellDto) {
    writeJson(STORAGE_KEYS.projects, shell.projects);
    writeJson(STORAGE_KEYS.profile, shell.profile);
}

export function loadWorkspaceSession(): WorkspaceSessionState {
    if (!isBrowser()) {
        return {
            view: 'landing',
            activeProjectId: null
        };
    }

    const savedView = window.localStorage.getItem(STORAGE_KEYS.view) as AppViewState | null;
    const savedProjectId = window.localStorage.getItem(STORAGE_KEYS.activeProjectId);

    return {
        view: savedView || 'landing',
        activeProjectId: savedProjectId || null
    };
}

export function saveWorkspaceSession(session: WorkspaceSessionState) {
    if (!isBrowser()) {
        return;
    }

    if (session.view === 'logging_out') {
        clearWorkspaceSession();
        return;
    }

    window.localStorage.setItem(STORAGE_KEYS.view, session.view);

    if (session.activeProjectId) {
        window.localStorage.setItem(STORAGE_KEYS.activeProjectId, session.activeProjectId);
    } else {
        window.localStorage.removeItem(STORAGE_KEYS.activeProjectId);
    }
}

export function clearWorkspaceSession() {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.removeItem(STORAGE_KEYS.view);
    window.localStorage.removeItem(STORAGE_KEYS.activeProjectId);
}

export function loadProjectDocument(projectId?: string, projectName?: string): ProjectData {
    const activeProjectId = projectId || loadWorkspaceSession().activeProjectId || 'default';
    const raw = isBrowser() ? readJson<unknown>(getProjectStorageKey(activeProjectId), null) : null;

    return normalizeProjectData(activeProjectId, projectName, raw);
}

export function saveProjectDocument(project: ProjectData) {
    writeJson(getProjectStorageKey(project.id), project);
}

export function removeProjectDocument(projectId: string) {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.removeItem(getProjectStorageKey(projectId));
}

export function exportWorkspaceSnapshot(shell?: WorkspaceShellDto): WorkspaceExportDto {
    const resolvedShell = normalizeWorkspaceShell(shell || loadWorkspaceShell());

    return {
        version: EXPORT_VERSION,
        mode: 'local-mvp',
        exportedAt: new Date().toISOString(),
        workspace: resolvedShell,
        projectDocuments: resolvedShell.projects.map((project) =>
            loadProjectDocument(project.id, project.name)
        )
    };
}

export function importWorkspaceSnapshot(raw: unknown): WorkspaceShellDto {
    if (!isRecord(raw)) {
        throw new Error('Invalid backup file.');
    }

    if (raw.version !== EXPORT_VERSION) {
        throw new Error('Unsupported backup version.');
    }

    if (!isRecord(raw.workspace) || !Array.isArray(raw.projectDocuments)) {
        throw new Error('Backup file is missing workspace data.');
    }

    const nextShell = normalizeWorkspaceShell(raw.workspace as Partial<WorkspaceShellDto>);
    const currentShell = loadWorkspaceShell();
    const importedDocuments = (raw.projectDocuments as unknown[]).map((document) => {
        if (!isRecord(document) || typeof document.id !== 'string') {
            return null;
        }

        const matchingProject = nextShell.projects.find((project) => project.id === document.id);
        return normalizeProjectData(document.id, matchingProject?.name, document);
    }).filter((document): document is ProjectData => Boolean(document));

    saveWorkspaceShell(nextShell);

    for (const project of currentShell.projects) {
        if (!nextShell.projects.some((nextProject) => nextProject.id === project.id)) {
            removeProjectDocument(project.id);
        }
    }

    for (const project of nextShell.projects) {
        const importedDocument = importedDocuments.find((document) => document.id === project.id);
        saveProjectDocument(importedDocument || createDefaultProject(project.id, project.name));
    }

    clearWorkspaceSession();

    return nextShell;
}

import { DEFAULT_PROJECTS, DEFAULT_USER } from '@/data/workspaceSeed';
import {
    buildWorkspaceCollaborationOverview,
    createEmptyProjectHubData,
    getProjectHubMetrics,
    normalizeProjectHubData
} from '@/lib/collaboration';
import { WorkspaceExportDto, WorkspaceShellDto } from '@/lib/contracts/api';
import { AppViewState, ProjectData, ProjectHubData, ProjectSurface } from '@/types';

const STORAGE_KEYS = {
    view: 'app_view',
    activeProjectId: 'app_project_id',
    activeSurface: 'app_project_surface',
    projects: 'app_projects',
    profile: 'app_profile'
} as const;

const EXPORT_VERSION = 'local-mvp-v1' as const;

export interface WorkspaceSessionState {
    view: AppViewState;
    activeProjectId: string | null;
    activeSurface?: ProjectSurface | null;
}

const isBrowser = () => typeof window !== 'undefined';

const getProjectStorageKey = (projectId: string) => `innovation_sandbox_authoritative_${projectId}`;
const getProjectHubStorageKey = (projectId: string) => `innovation_sandbox_collaboration_${projectId}`;

const createDefaultProject = (projectId: string, projectName?: string): ProjectData => ({
    id: projectId,
    context: {
        name: projectName || 'New Innovation Project',
        background: '',
        objectives: '',
        assumptions: '',
        aiHandoffPrompt: ''
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
            assumptions: typeof context.assumptions === 'string' ? context.assumptions : '',
            aiHandoffPrompt: typeof context.aiHandoffPrompt === 'string' ? context.aiHandoffPrompt : ''
        },
        currentStage: currentStage as ProjectData['currentStage'],
        toolRuns
    };
}

function normalizeWorkspaceShell(raw?: Partial<WorkspaceShellDto>): WorkspaceShellDto {
    const projects = Array.isArray(raw?.projects) && raw.projects.length > 0 ? raw.projects : DEFAULT_PROJECTS;
    const profile = raw?.profile ? { ...DEFAULT_USER, ...raw.profile } : DEFAULT_USER;
    const hubs = Object.fromEntries(
        projects.map((project) => [
            project.id,
            loadProjectHub(project.id, project.name, profile.id || 'user')
        ])
    );

    return {
        projects: projects.map((project) => ({
            ...project,
            ...getProjectHubMetrics(hubs[project.id])
        })),
        profile,
        collaborationOverview: buildWorkspaceCollaborationOverview(projects, hubs, profile.id)
    };
}

export function loadWorkspaceShell(): WorkspaceShellDto {
    return normalizeWorkspaceShell({
        projects: readJson(STORAGE_KEYS.projects, DEFAULT_PROJECTS),
        profile: readJson(STORAGE_KEYS.profile, DEFAULT_USER)
    });
}

export function saveWorkspaceShell(shell: Pick<WorkspaceShellDto, 'projects' | 'profile'>) {
    writeJson(STORAGE_KEYS.projects, shell.projects);
    writeJson(STORAGE_KEYS.profile, shell.profile);
}

function hasJsonValue(key: string) {
    if (!isBrowser()) {
        return false;
    }

    return window.localStorage.getItem(key) !== null;
}

function readSessionValue(key: string) {
    if (!isBrowser()) {
        return null;
    }

    return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
}

function writeSessionValue(key: string, value: string) {
    if (!isBrowser()) {
        return;
    }

    window.sessionStorage.setItem(key, value);
    window.localStorage.removeItem(key);
}

function removeSessionValue(key: string) {
    if (!isBrowser()) {
        return;
    }

    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
}

export function loadWorkspaceSession(): WorkspaceSessionState {
    if (!isBrowser()) {
        return {
            view: 'landing',
            activeProjectId: null,
            activeSurface: null
        };
    }

    const savedView = readSessionValue(STORAGE_KEYS.view) as AppViewState | null;
    const savedProjectId = readSessionValue(STORAGE_KEYS.activeProjectId);
    const savedSurface = readSessionValue(STORAGE_KEYS.activeSurface) as ProjectSurface | null;

    return {
        view: savedView || 'landing',
        activeProjectId: savedProjectId || null,
        activeSurface: savedProjectId ? (savedSurface || 'hub') : null
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

    writeSessionValue(STORAGE_KEYS.view, session.view);

    if (session.activeProjectId) {
        writeSessionValue(STORAGE_KEYS.activeProjectId, session.activeProjectId);
        writeSessionValue(STORAGE_KEYS.activeSurface, session.activeSurface || 'hub');
    } else {
        removeSessionValue(STORAGE_KEYS.activeProjectId);
        removeSessionValue(STORAGE_KEYS.activeSurface);
    }
}

export function clearWorkspaceSession() {
    if (!isBrowser()) {
        return;
    }

    removeSessionValue(STORAGE_KEYS.view);
    removeSessionValue(STORAGE_KEYS.activeProjectId);
    removeSessionValue(STORAGE_KEYS.activeSurface);
}

export function loadProjectDocument(projectId?: string, projectName?: string): ProjectData {
    const activeProjectId = projectId || loadWorkspaceSession().activeProjectId || 'default';
    const raw = isBrowser() ? readJson<unknown>(getProjectStorageKey(activeProjectId), null) : null;

    return normalizeProjectData(activeProjectId, projectName, raw);
}

export function hasProjectDocumentCache(projectId?: string) {
    const activeProjectId = projectId || loadWorkspaceSession().activeProjectId || 'default';
    return hasJsonValue(getProjectStorageKey(activeProjectId));
}

export function loadProjectHub(projectId: string, projectName?: string, updatedBy = 'user'): ProjectHubData {
    const projectDocument = loadProjectDocument(projectId, projectName);
    const raw = isBrowser() ? readJson<unknown>(getProjectHubStorageKey(projectId), null) : null;
    const fallback = createEmptyProjectHubData({
        projectId,
        updatedBy,
        context: projectDocument.context,
        briefDetails: {
            teamRoles: '',
            workingNorms: '',
            keyLinks: '',
            milestones: '',
            successMetrics: ''
        }
    });

    return normalizeProjectHubData(raw, fallback);
}

export function hasProjectHubCache(projectId: string) {
    return hasJsonValue(getProjectHubStorageKey(projectId));
}

export function saveProjectDocument(project: ProjectData) {
    writeJson(getProjectStorageKey(project.id), project);
}

export function saveProjectHub(projectId: string, hub: ProjectHubData) {
    writeJson(getProjectHubStorageKey(projectId), hub);
}

export function removeProjectDocument(projectId: string) {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.removeItem(getProjectStorageKey(projectId));
}

export function removeProjectHub(projectId: string) {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.removeItem(getProjectHubStorageKey(projectId));
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
        ),
        projectHubs: resolvedShell.projects.map((project) =>
            loadProjectHub(project.id, project.name, resolvedShell.profile.id || 'user')
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
    const importedHubs = Array.isArray(raw.projectHubs)
        ? (raw.projectHubs as unknown[]).map((hub) => {
            if (!isRecord(hub)) {
                return null;
            }

            const brief = isRecord(hub.brief) ? hub.brief : null;
            if (!brief || typeof brief.projectId !== 'string') {
                return null;
            }

            const matchingProject = nextShell.projects.find((project) => project.id === brief.projectId);
            return normalizeProjectHubData(
                hub,
                createEmptyProjectHubData({
                    projectId: brief.projectId,
                    updatedBy: nextShell.profile.id || 'user',
                    context: loadProjectDocument(brief.projectId, matchingProject?.name).context
                })
            );
        }).filter((hub): hub is ProjectHubData => Boolean(hub))
        : [];

    saveWorkspaceShell(nextShell);

    for (const project of currentShell.projects) {
        if (!nextShell.projects.some((nextProject) => nextProject.id === project.id)) {
            removeProjectDocument(project.id);
            removeProjectHub(project.id);
        }
    }

    for (const project of nextShell.projects) {
        const importedDocument = importedDocuments.find((document) => document.id === project.id);
        const importedHub = importedHubs.find((hub) => hub.brief.projectId === project.id);
        saveProjectDocument(importedDocument || createDefaultProject(project.id, project.name));
        saveProjectHub(
            project.id,
            importedHub || createEmptyProjectHubData({
                projectId: project.id,
                updatedBy: nextShell.profile.id || 'user',
                context: (importedDocument || createDefaultProject(project.id, project.name)).context
            })
        );
    }

    clearWorkspaceSession();

    return nextShell;
}

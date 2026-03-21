import { WorkspaceProject } from '@/types';

export const DEFAULT_DOCUMENT_TITLE = 'ADT Innovation Sandbox';

export function getWorkspaceDocumentTitle(activeProjectId: string | null, projects: WorkspaceProject[]) {
    if (!activeProjectId) {
        return DEFAULT_DOCUMENT_TITLE;
    }

    const projectName = projects.find((project) => project.id === activeProjectId)?.name?.trim();
    if (!projectName) {
        return DEFAULT_DOCUMENT_TITLE;
    }

    return projectName.length > 48 ? projectName : `ADT | ${projectName}`;
}

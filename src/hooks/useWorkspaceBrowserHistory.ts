'use client';

import { useEffect, useRef } from 'react';

import { AppViewState } from '@/types';

export interface WorkspaceBrowserState {
    view: AppViewState;
    activeProjectId: string | null;
}

interface PersistedWorkspaceHistoryState extends WorkspaceBrowserState {
    kind: 'workspace-navigation';
}

interface UseWorkspaceBrowserHistoryOptions {
    state: WorkspaceBrowserState;
    isReady: boolean;
    onNavigate: (state: WorkspaceBrowserState) => void;
}

const VALID_VIEWS: AppViewState[] = ['landing', 'auth', 'dashboard', 'sandbox', 'profile', 'logging_out'];

function isBrowser() {
    return typeof window !== 'undefined';
}

function isValidView(value: unknown): value is AppViewState {
    return typeof value === 'string' && VALID_VIEWS.includes(value as AppViewState);
}

function normalizeState(state: WorkspaceBrowserState): WorkspaceBrowserState {
    const view = state.view === 'logging_out' ? 'landing' : state.view;
    const activeProjectId = typeof state.activeProjectId === 'string' && state.activeProjectId.trim()
        ? state.activeProjectId
        : null;

    if (view === 'sandbox' && !activeProjectId) {
        return {
            view: 'dashboard',
            activeProjectId: null
        };
    }

    return {
        view,
        activeProjectId
    };
}

function buildUrl(state: WorkspaceBrowserState) {
    if (!isBrowser()) {
        return '/';
    }

    const url = new URL(window.location.href);
    const nextState = normalizeState(state);

    url.searchParams.delete('view');
    url.searchParams.delete('project');

    if (nextState.view !== 'landing') {
        url.searchParams.set('view', nextState.view);
    }

    if (nextState.activeProjectId) {
        url.searchParams.set('project', nextState.activeProjectId);
    }

    return `${url.pathname}${url.search}${url.hash}`;
}

function parseUrlState(): WorkspaceBrowserState | null {
    if (!isBrowser()) {
        return null;
    }

    const params = new URLSearchParams(window.location.search);
    const rawView = params.get('view');
    const rawProjectId = params.get('project');

    if (!rawView && !rawProjectId) {
        return null;
    }

    if (!rawView && rawProjectId) {
        return normalizeState({
            view: 'sandbox',
            activeProjectId: rawProjectId
        });
    }

    if (!isValidView(rawView)) {
        return null;
    }

    return normalizeState({
        view: rawView,
        activeProjectId: rawProjectId
    });
}

function parseHistoryState(raw: unknown): WorkspaceBrowserState | null {
    if (typeof raw !== 'object' || raw === null) {
        return null;
    }

    const record = raw as Partial<PersistedWorkspaceHistoryState>;

    if (record.kind !== 'workspace-navigation' || !isValidView(record.view)) {
        return null;
    }

    return normalizeState({
        view: record.view,
        activeProjectId: typeof record.activeProjectId === 'string' ? record.activeProjectId : null
    });
}

export function loadWorkspaceBrowserState(fallback: WorkspaceBrowserState): WorkspaceBrowserState {
    return parseUrlState() ?? normalizeState(fallback);
}

export function useWorkspaceBrowserHistory({
    state,
    isReady,
    onNavigate
}: UseWorkspaceBrowserHistoryOptions) {
    const navigationHandlerRef = useRef(onNavigate);
    const lastSerializedStateRef = useRef<string | null>(null);
    const isPopNavigationRef = useRef(false);

    useEffect(() => {
        navigationHandlerRef.current = onNavigate;
    }, [onNavigate]);

    useEffect(() => {
        if (!isReady || !isBrowser()) {
            return;
        }

        const handlePopState = (event: PopStateEvent) => {
            const nextState = parseHistoryState(event.state) ?? parseUrlState() ?? {
                view: 'landing',
                activeProjectId: null
            };

            isPopNavigationRef.current = true;
            navigationHandlerRef.current(nextState);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isReady]);

    useEffect(() => {
        if (!isReady || !isBrowser()) {
            return;
        }

        const nextState = normalizeState({
            view: state.view,
            activeProjectId: state.activeProjectId
        });
        const serializedState = JSON.stringify(nextState);
        const persistedState: PersistedWorkspaceHistoryState = {
            kind: 'workspace-navigation',
            ...nextState
        };
        const nextUrl = buildUrl(nextState);

        if (lastSerializedStateRef.current === null) {
            window.history.replaceState(persistedState, '', nextUrl);
            lastSerializedStateRef.current = serializedState;
            return;
        }

        if (serializedState === lastSerializedStateRef.current) {
            return;
        }

        if (isPopNavigationRef.current) {
            window.history.replaceState(persistedState, '', nextUrl);
            isPopNavigationRef.current = false;
            lastSerializedStateRef.current = serializedState;
            return;
        }

        window.history.pushState(persistedState, '', nextUrl);
        lastSerializedStateRef.current = serializedState;
    }, [isReady, state.activeProjectId, state.view]);
}

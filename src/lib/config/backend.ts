export type BackendMode = 'local-mvp' | 'remote-supabase';

export function isRemoteBackendEnabled() {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
}

export function getBackendMode(): BackendMode {
    return isRemoteBackendEnabled() ? 'remote-supabase' : 'local-mvp';
}

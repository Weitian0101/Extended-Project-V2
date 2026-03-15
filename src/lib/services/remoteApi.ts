import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface FetchApiOptions {
    retries?: number;
    retryOnUnauthorized?: boolean;
}

const UNAUTHORIZED_RETRY_DELAYS_MS = [0, 180, 420];

function wait(ms: number) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

async function refreshBrowserSession() {
    try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
            return;
        }

        await supabase.auth.refreshSession();
    } catch {
        // A failed refresh should not mask the original API response.
    }
}

export async function fetchApiResponse(input: RequestInfo | URL, init?: RequestInit, options?: FetchApiOptions) {
    const retries = options?.retries ?? 2;
    const retryOnUnauthorized = options?.retryOnUnauthorized ?? true;
    let response: Response | null = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        if (attempt > 0) {
            const delay = UNAUTHORIZED_RETRY_DELAYS_MS[Math.min(attempt, UNAUTHORIZED_RETRY_DELAYS_MS.length - 1)];
            await wait(delay);
        }

        response = await fetch(input, init);

        if (!retryOnUnauthorized || response.status !== 401 || attempt === retries) {
            return response;
        }

        await refreshBrowserSession();
    }

    return response as Response;
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'Request failed.');
    }

    return body as T;
}

export async function fetchApiJson<T>(input: RequestInfo | URL, init?: RequestInit, options?: FetchApiOptions) {
    const response = await fetchApiResponse(input, init, options);
    return parseApiResponse<T>(response);
}

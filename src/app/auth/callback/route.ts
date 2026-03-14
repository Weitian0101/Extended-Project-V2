import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isRemoteBackendEnabled } from '@/lib/config/backend';

export async function GET(request: Request) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const nextPath = requestUrl.searchParams.get('next');
    const redirectPath = nextPath?.startsWith('/') ? nextPath : '/';

    if (code) {
        const supabase = await createSupabaseServerClient();
        await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(new URL(redirectPath, request.url));
}

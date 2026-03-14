import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const fallbackRedirect = request.nextUrl.clone();
    fallbackRedirect.pathname = '/';
    fallbackRedirect.searchParams.delete('token_hash');
    fallbackRedirect.searchParams.delete('type');
    fallbackRedirect.searchParams.delete('next');

    if (!isRemoteBackendEnabled()) {
        return NextResponse.redirect(fallbackRedirect);
    }

    const tokenHash = request.nextUrl.searchParams.get('token_hash');
    const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
    const nextPath = request.nextUrl.searchParams.get('next');
    const redirectPath = nextPath?.startsWith('/') ? nextPath : '/';

    if (!tokenHash || !type) {
        return NextResponse.redirect(fallbackRedirect);
    }

    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = redirectPath;
    redirectTo.searchParams.delete('token_hash');
    redirectTo.searchParams.delete('type');
    redirectTo.searchParams.delete('next');
    redirectTo.searchParams.delete('error');

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash
    });

    if (error) {
        return NextResponse.redirect(fallbackRedirect);
    }

    return NextResponse.redirect(redirectTo);
}

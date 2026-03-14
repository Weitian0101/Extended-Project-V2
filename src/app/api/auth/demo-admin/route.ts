import { NextResponse } from 'next/server';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    const email = process.env.DEMO_ADMIN_EMAIL;
    const password = process.env.DEMO_ADMIN_PASSWORD;
    const displayName = process.env.DEMO_ADMIN_NAME || 'Sandbox Admin';

    if (!email || !password) {
        return NextResponse.json({ error: 'Admin test access is not configured.' }, { status: 400 });
    }

    try {
        const supabase = await createSupabaseServerClient();

        let authError: string | null = null;
        const signInResult = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInResult.error) {
            const signUpResult = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: displayName,
                        name: displayName,
                        title: 'Workspace administrator'
                    }
                }
            });

            if (signUpResult.error) {
                authError = signUpResult.error.message;
            } else if (!signUpResult.data.session) {
                authError = 'Admin account needs to be created in Supabase before direct access can be used.';
            }
        }

        if (authError) {
            return NextResponse.json({ error: authError }, { status: 400 });
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return NextResponse.json({ error: userError?.message || 'Unable to load the admin account.' }, { status: 400 });
        }

        const { data: existingProfileData, error: existingProfileError } = await supabase
            .from('profiles')
            .select('full_name, title, workspace_name, company, billing_email, account_role, subscription_tier, billing_cycle, subscription_status, payment_method_label')
            .eq('id', userData.user.id)
            .maybeSingle();

        if (existingProfileError) {
            return NextResponse.json({ error: existingProfileError.message }, { status: 500 });
        }

        const existingProfile = existingProfileData as {
            full_name?: string | null;
            title?: string | null;
            workspace_name?: string | null;
            company?: string | null;
            billing_email?: string | null;
            account_role?: string | null;
            subscription_tier?: string | null;
            billing_cycle?: string | null;
            subscription_status?: string | null;
            payment_method_label?: string | null;
        } | null;

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userData.user.id,
                email,
                full_name: existingProfile?.full_name || displayName,
                title: existingProfile?.title || 'Workspace administrator',
                workspace_name: existingProfile?.workspace_name || 'Innovation Sandbox Admin',
                company: existingProfile?.company || 'Innovation Sandbox Ltd.',
                billing_email: existingProfile?.billing_email || email,
                account_role: existingProfile?.account_role || 'Workspace owner',
                subscription_tier: existingProfile?.subscription_tier || 'business',
                billing_cycle: existingProfile?.billing_cycle || 'monthly',
                subscription_status: existingProfile?.subscription_status || 'active',
                payment_method_label: existingProfile?.payment_method_label || 'Visa ending in 4242',
                last_sign_in_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unable to open admin access.' },
            { status: 500 }
        );
    }
}

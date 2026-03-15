import { NextResponse } from 'next/server';
import { Resend } from 'resend';

import { isRemoteBackendEnabled } from '@/lib/config/backend';
import { getProjectInviteById } from '@/lib/server/workspaceRepository';

interface RouteContext {
    params: Promise<{
        projectId: string;
        inviteId: string;
    }>;
}

function getSiteUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export async function POST(_request: Request, context: RouteContext) {
    if (!isRemoteBackendEnabled()) {
        return NextResponse.json({ error: 'Remote backend is not enabled.' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ error: 'Set RESEND_API_KEY before sending project invite emails.' }, { status: 500 });
    }

    try {
        const { projectId, inviteId } = await context.params;
        const invite = await getProjectInviteById(projectId, inviteId);
        const inviteUrl = invite.inviteUrl || `${getSiteUrl()}/invites/${inviteId}`;
        const resend = new Resend(process.env.RESEND_API_KEY);
        const from = process.env.INVITE_FROM_EMAIL || 'Innovation Sandbox <onboarding@resend.dev>';

        await resend.emails.send({
            from,
            to: invite.email,
            subject: 'You were invited to join an Innovation Sandbox project',
            text: [
                'You have been invited to join a project in Innovation Sandbox.',
                '',
                `Access level: ${invite.permission}`,
                `Open invite: ${inviteUrl}`,
                '',
                'Sign in with the invited email address, then accept the project invite.'
            ].join('\n'),
            html: [
                '<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#0f172a;">',
                '<h2 style="margin:0 0 12px;">Innovation Sandbox invite</h2>',
                '<p style="margin:0 0 12px;">You have been invited to join a project in Innovation Sandbox.</p>',
                `<p style="margin:0 0 20px;"><strong>Access level:</strong> ${invite.permission}</p>`,
                `<a href="${inviteUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;">Accept project invite</a>`,
                `<p style="margin:20px 0 0;font-size:13px;color:#475569;">If the button does not work, open this link:<br /><a href="${inviteUrl}">${inviteUrl}</a></p>`,
                '</div>'
            ].join('')
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to send invite email.';
        const status = message === 'Unauthenticated'
            ? 401
            : message === 'Forbidden'
                ? 403
                : message === 'Invite not found.'
                    ? 404
                    : 500;

        return NextResponse.json({ error: message }, { status });
    }
}

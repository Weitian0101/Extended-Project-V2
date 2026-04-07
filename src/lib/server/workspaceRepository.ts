import { randomUUID } from 'crypto';

import { WorkspaceExportDto } from '@/lib/contracts/api';
import { buildMembershipProfile } from '@/lib/membership';
import {
    enrichWorkspaceProjectsWithHub,
    getProjectHub,
    saveProjectHubSnapshot
} from '@/lib/server/projectHubRepository';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
    PermissionLevel,
    ProjectData,
    ProjectHubData,
    ProjectInvite,
    TeamMember,
    ToolRun,
    UserProfileData,
    WorkspaceNotification,
    WorkspaceNotificationType,
    WorkspaceProject
} from '@/types';

interface ProfileRow {
    id: string;
    email: string;
    full_name: string;
    title: string | null;
    phone: string | null;
    location: string | null;
    workspace_name: string | null;
    company: string | null;
    billing_email: string | null;
    account_role: string | null;
    subscription_tier: UserProfileData['subscriptionTier'] | null;
    billing_cycle: UserProfileData['billingCycle'] | null;
    subscription_status: UserProfileData['subscriptionStatus'] | null;
    renewal_date: string | null;
    payment_method_label: string | null;
    guide_preferences?: UserProfileData['guidePreferences'] | null;
    created_at: string;
    last_sign_in_at: string | null;
}

interface ProjectRow {
    id: string;
    owner_id: string;
    name: string;
    summary: string;
    accent: string;
    current_stage: ProjectData['currentStage'];
    background: string;
    objectives: string;
    assumptions: string;
    success_metrics?: string;
    milestones?: string;
    team_roles?: string;
    working_norms?: string;
    key_links?: string;
    created_at: string;
    updated_at: string;
}

interface ProjectMemberRow {
    project_id: string;
    user_id: string;
    role: string;
    permission: PermissionLevel;
    status: TeamMember['status'];
    created_at: string;
    updated_at: string;
}

interface ProjectInviteRow {
    id: string;
    project_id: string;
    email: string;
    role: string;
    permission: PermissionLevel;
    token: string;
    status: ProjectInvite['status'];
    invited_by: string | null;
    accepted_by: string | null;
    accepted_at: string | null;
    created_at: string;
    updated_at: string;
}

interface ProjectInviteDetailsRow {
    id: string;
    project_id: string;
    project_name: string;
    email: string;
    permission: PermissionLevel;
    status: ProjectInvite['status'];
    created_at: string;
}

interface ToolRunRow {
    id: string;
    project_id: string;
    method_card_id: string;
    method_card_title: string;
    stage: ToolRun['stage'];
    current_step_index: number | null;
    data: ToolRun['data'] | null;
    answers: ToolRun['answers'] | null;
    ai_responses: ToolRun['aiResponses'] | null;
    created_at: string;
    updated_at: string;
}

interface WorkspaceNotificationRow {
    id: string;
    type: WorkspaceNotificationType | string;
    title: string;
    message: string;
    project_id: string | null;
    project_name: string | null;
    invite_id: string | null;
    read_at: string | null;
    created_at: string;
}

export interface InviteMemberResult {
    delivery: 'invite-created';
    invite: ProjectInvite;
}

export interface ProjectInviteDetails {
    id: string;
    projectId: string;
    projectName: string;
    email: string;
    permission: PermissionLevel;
    status: ProjectInvite['status'];
    createdAt: string;
}

export interface WorkspaceImportResult {
    importedProjects: number;
    importedMembers: number;
    importedInvites: number;
}

const ACCENT_OPTIONS = [
    'from-emerald-500 to-lime-300',
    'from-sky-500 to-cyan-300',
    'from-rose-500 to-orange-300',
    'from-amber-500 to-yellow-300',
    'from-fuchsia-500 to-violet-400'
] as const;

const AVATAR_GRADIENTS = [
    'from-slate-900 to-slate-700',
    'from-emerald-500 to-teal-400',
    'from-sky-500 to-cyan-400',
    'from-amber-500 to-orange-400',
    'from-rose-500 to-pink-400',
    'from-violet-500 to-fuchsia-400'
] as const;

const PROFILE_SELECT_BASE = 'id, email, full_name, title, phone, location, workspace_name, company, billing_email, account_role, subscription_tier, billing_cycle, subscription_status, renewal_date, payment_method_label, created_at, last_sign_in_at';
const PROFILE_SELECT_WITH_GUIDE = `${PROFILE_SELECT_BASE}, guide_preferences`;

function getSiteUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function buildInviteUrl(token: string) {
    return `${getSiteUrl().replace(/\/$/, '')}/invites/${token}`;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function getAvatarGradient(seed: string) {
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function formatUpdatedLabel(value: string) {
    const now = Date.now();
    const then = new Date(value).getTime();
    const diffMs = Math.max(now - then, 0);
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isMissingGuidePreferencesColumnError(error: unknown) {
    return isRecord(error)
        && error.code === '42703'
        && typeof error.message === 'string'
        && error.message.includes('guide_preferences');
}

function isMissingWorkspaceNotificationsFeatureError(error: unknown) {
    return isRecord(error)
        && typeof error.message === 'string'
        && (
            error.message.includes('workspace_notifications')
            || error.message.includes('get_workspace_notifications')
        );
}

async function fetchProfileById(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    userId: string,
    mode: 'single' | 'maybeSingle'
) {
    const withGuideQuery = supabase
        .from('profiles')
        .select(PROFILE_SELECT_WITH_GUIDE)
        .eq('id', userId);
    const withGuideResult = mode === 'single'
        ? await withGuideQuery.single()
        : await withGuideQuery.maybeSingle();

    if (!isMissingGuidePreferencesColumnError(withGuideResult.error)) {
        return withGuideResult;
    }

    const fallbackQuery = supabase
        .from('profiles')
        .select(PROFILE_SELECT_BASE)
        .eq('id', userId);

    return mode === 'single'
        ? await fallbackQuery.single()
        : await fallbackQuery.maybeSingle();
}

async function fetchProfilesByIds(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    userIds: string[]
) {
    const withGuideResult = await supabase
        .from('profiles')
        .select(PROFILE_SELECT_WITH_GUIDE)
        .in('id', userIds);

    if (!isMissingGuidePreferencesColumnError(withGuideResult.error)) {
        return withGuideResult;
    }

    return await supabase
        .from('profiles')
        .select(PROFILE_SELECT_BASE)
        .in('id', userIds);
}

function normalizeString(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function normalizeNullableString(value: unknown) {
    return typeof value === 'string' ? value : null;
}

function normalizePermission(value: unknown): PermissionLevel {
    return value === 'owner' || value === 'edit' || value === 'view' ? value : 'view';
}

function normalizeStage(value: unknown): ProjectData['currentStage'] {
    return value === 'overview'
        || value === 'explore'
        || value === 'imagine'
        || value === 'implement'
        || value === 'tell-story'
        ? value
        : 'overview';
}

function normalizeToolRuns(value: unknown): ToolRun[] {
    return Array.isArray(value) ? value as ToolRun[] : [];
}

function normalizeProjectDocument(raw: unknown, projectId: string, projectName: string): ProjectData {
    if (!isRecord(raw)) {
        return {
            id: projectId,
            context: {
                name: projectName,
                background: '',
                objectives: '',
                assumptions: ''
            },
            currentStage: 'overview',
            toolRuns: []
        };
    }

    const rawContext = isRecord(raw.context) ? raw.context : {};

    return {
        id: projectId,
        context: {
            name: normalizeString(rawContext.name, projectName) || projectName,
            background: normalizeString(rawContext.background),
            objectives: normalizeString(rawContext.objectives),
            assumptions: normalizeString(rawContext.assumptions)
        },
        currentStage: normalizeStage(raw.currentStage),
        toolRuns: normalizeToolRuns(raw.toolRuns)
    };
}

function mapProfile(profile: ProfileRow): UserProfileData {
    const membership = buildMembershipProfile(
        profile.subscription_tier || 'business',
        profile.billing_cycle || 'monthly',
        profile.subscription_status || 'active',
        profile.payment_method_label || undefined,
        profile.renewal_date
    );
    const guidePreferences: UserProfileData['guidePreferences'] = isRecord(profile.guide_preferences)
        ? {
            onboardingSeenAt: normalizeNullableString(profile.guide_preferences.onboardingSeenAt),
            lastLearningCenterVisitAt: normalizeNullableString(profile.guide_preferences.lastLearningCenterVisitAt),
            methodCardLayout: profile.guide_preferences.methodCardLayout === 'immersive' ? 'immersive' : 'classic',
            helpTooltipsEnabled: profile.guide_preferences.helpTooltipsEnabled !== false
        }
        : {
            onboardingSeenAt: null,
            lastLearningCenterVisitAt: null,
            methodCardLayout: 'classic',
            helpTooltipsEnabled: true
        };

    return {
        id: profile.id,
        name: profile.full_name || profile.email.split('@')[0],
        email: profile.email,
        title: profile.title || 'Innovation collaborator',
        phone: profile.phone || '',
        location: profile.location || '',
        workspace: profile.workspace_name || 'Innovation Sandbox Workspace',
        company: profile.company || '',
        billingEmail: profile.billing_email || profile.email,
        accountRole: profile.account_role || 'Workspace member',
        ...membership,
        createdAt: profile.created_at,
        lastSignInAt: profile.last_sign_in_at,
        guidePreferences
    };
}

function mapProjectInvite(row: ProjectInviteRow): ProjectInvite {
    return {
        id: row.id,
        email: row.email,
        permission: row.permission,
        status: row.status,
        createdAt: row.created_at,
        inviteUrl: buildInviteUrl(row.token)
    };
}

function mapTeamMembers(
    projectId: string,
    membershipRows: ProjectMemberRow[],
    profilesById: Map<string, ProfileRow>
): TeamMember[] {
    return membershipRows
        .filter((membership) => membership.project_id === projectId)
        .map((membership) => {
            const profile = profilesById.get(membership.user_id);
            const name = profile?.full_name || profile?.email || 'Unknown member';

            return {
                id: membership.user_id,
                name,
                email: profile?.email,
                initials: getInitials(name),
                role: membership.role,
                status: membership.status,
                avatarColor: getAvatarGradient(membership.user_id),
                permission: membership.permission
            };
        });
}

function mapProjectSummary(
    project: ProjectRow,
    members: TeamMember[],
    invites: ProjectInvite[]
): WorkspaceProject {
    return {
        id: project.id,
        name: project.name,
        accent: project.accent,
        ownerId: project.owner_id,
        updated: formatUpdatedLabel(project.updated_at),
        updatedAt: project.updated_at,
        summary: project.summary,
        currentStage: project.current_stage,
        members,
        pendingInvites: invites
    };
}

function mapToolRun(row: ToolRunRow): ToolRun {
    return {
        id: row.id,
        methodCardId: row.method_card_id,
        methodCardTitle: row.method_card_title,
        stage: row.stage,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        currentStepIndex: row.current_step_index ?? 0,
        data: row.data || {},
        answers: row.answers || {},
        aiResponses: row.ai_responses || []
    };
}

export async function getAuthenticatedUser() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user;
}

async function getAuthenticatedProjectManager(projectId: string, requiredPermission: PermissionLevel = 'edit') {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        throw new Error('Unauthenticated');
    }

    const { data, error } = await supabase
        .from('project_members')
        .select('permission')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();
    const membership = data as { permission: PermissionLevel } | null;

    if (error || !membership) {
        throw new Error('Forbidden');
    }

    const allowed = requiredPermission === 'owner'
        ? ['owner']
        : ['owner', 'edit'];

    if (!allowed.includes(membership.permission)) {
        throw new Error('Forbidden');
    }

    return {
        user,
        permission: membership.permission
    };
}

function mapWorkspaceNotification(row: WorkspaceNotificationRow): WorkspaceNotification {
    const type: WorkspaceNotificationType = row.type === 'project-invite'
        ? 'project-invite'
        : 'project-dissolved';

    return {
        id: row.id,
        type,
        title: row.title,
        message: row.message,
        createdAt: row.created_at,
        projectId: row.project_id,
        projectName: row.project_name,
        inviteId: row.invite_id,
        readAt: row.read_at
    };
}

async function fetchWorkspaceNotifications(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
    const { data, error } = await supabase.rpc('get_workspace_notifications');

    if (error) {
        if (isMissingWorkspaceNotificationsFeatureError(error)) {
            return [] as WorkspaceNotificationRow[];
        }

        throw error;
    }

    return (data || []) as unknown as WorkspaceNotificationRow[];
}

async function insertWorkspaceNotifications(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    notifications: Array<{
        user_id: string;
        project_id: string | null;
        project_name: string;
        type: 'project-dissolved';
        title: string;
        message: string;
    }>
) {
    if (notifications.length === 0) {
        return;
    }

    const { error } = await supabase
        .from('workspace_notifications')
        .insert(notifications);

    if (error && !isMissingWorkspaceNotificationsFeatureError(error)) {
        console.error('Unable to persist workspace notifications.', error);
    }
}

async function getPendingInviteRow(projectId: string, inviteId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('project_invites')
        .select('id, project_id, email, role, permission, token, status, invited_by, accepted_by, accepted_at, created_at, updated_at')
        .eq('project_id', projectId)
        .eq('id', inviteId)
        .maybeSingle();
    const invite = data as unknown as ProjectInviteRow | null;

    if (error || !invite) {
        throw error || new Error('Invite not found.');
    }

    return invite;
}

export async function ensureProfileForCurrentUser() {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
        throw new Error('Unauthenticated');
    }

    const user = authData.user;
    const fullName =
        (user.user_metadata.full_name as string | undefined)
        || (user.user_metadata.name as string | undefined)
        || user.email?.split('@')[0]
        || 'User';
    const nextTitle = (user.user_metadata.title as string | undefined) || 'Innovation collaborator';

    const { data: existingProfileData, error: existingProfileError } = await fetchProfileById(
        supabase,
        user.id,
        'maybeSingle'
    );
    const existingProfile = existingProfileData as unknown as ProfileRow | null;

    if (existingProfileError) {
        throw existingProfileError;
    }

    const defaultMembership = buildMembershipProfile('business', 'monthly', 'active');
    const timestamp = new Date().toISOString();
    const profilePayload = existingProfile
        ? {
            email: user.email || existingProfile.email,
            full_name: existingProfile.full_name || fullName,
            title: existingProfile.title || nextTitle,
            workspace_name: existingProfile.workspace_name || 'Innovation Sandbox Workspace',
            billing_email: existingProfile.billing_email || user.email || existingProfile.email,
            account_role: existingProfile.account_role || 'Workspace member',
            subscription_tier: existingProfile.subscription_tier || defaultMembership.subscriptionTier,
            billing_cycle: existingProfile.billing_cycle || defaultMembership.billingCycle,
            subscription_status: existingProfile.subscription_status || defaultMembership.subscriptionStatus,
            renewal_date: existingProfile.renewal_date ?? defaultMembership.renewalDate,
            payment_method_label: existingProfile.payment_method_label || defaultMembership.paymentMethodLabel,
            last_sign_in_at: timestamp
        }
        : {
            id: user.id,
            email: user.email || '',
            full_name: fullName,
            title: nextTitle,
            workspace_name: 'Innovation Sandbox Workspace',
            billing_email: user.email || '',
            account_role: 'Workspace member',
            subscription_tier: defaultMembership.subscriptionTier,
            billing_cycle: defaultMembership.billingCycle,
            subscription_status: defaultMembership.subscriptionStatus,
            renewal_date: defaultMembership.renewalDate,
            payment_method_label: defaultMembership.paymentMethodLabel,
            last_sign_in_at: timestamp
        };

    const profileMutation = existingProfile
        ? supabase.from('profiles').update(profilePayload).eq('id', user.id)
        : supabase.from('profiles').insert(profilePayload);
    const { error } = await profileMutation;

    if (error) {
        throw error;
    }
}

export async function getWorkspaceShell() {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        throw new Error('Unauthenticated');
    }

    const { data: profileData, error: profileError } = await fetchProfileById(
        supabase,
        user.id,
        'single'
    );
    const profileRow = profileData as unknown as ProfileRow | null;

    if (profileError || !profileRow) {
        throw profileError || new Error('Profile not found');
    }

    const notifications = (await fetchWorkspaceNotifications(supabase)).map(mapWorkspaceNotification);

    const { data: membershipData, error: membershipError } = await supabase
        .from('project_members')
        .select('project_id, user_id, role, permission, status, created_at, updated_at')
        .eq('user_id', user.id);
    const membershipRows = (membershipData || []) as unknown as ProjectMemberRow[];

    if (membershipError) {
        throw membershipError;
    }

    const projectIds = [...new Set(membershipRows.map((row) => row.project_id))];

    if (projectIds.length === 0) {
        return {
            profile: mapProfile(profileRow),
            projects: [] as WorkspaceProject[],
            collaborationOverview: {
                needsReview: [],
                upcomingSessions: [],
                assignedTasks: [],
                recentActivity: []
            },
            notifications
        };
    }

    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, owner_id, name, summary, accent, current_stage, background, objectives, assumptions, created_at, updated_at')
        .in('id', projectIds)
        .order('updated_at', { ascending: false });
    const projectRows = (projectData || []) as unknown as ProjectRow[];

    if (projectError) {
        throw projectError;
    }

    const { data: allMembershipData, error: allMembershipError } = await supabase
        .from('project_members')
        .select('project_id, user_id, role, permission, status, created_at, updated_at')
        .in('project_id', projectIds);
    const allMembershipRows = (allMembershipData || []) as unknown as ProjectMemberRow[];

    if (allMembershipError) {
        throw allMembershipError;
    }

    const memberIds = [...new Set(allMembershipRows.map((row) => row.user_id))];
    const { data: memberProfilesData, error: memberProfilesError } = await fetchProfilesByIds(
        supabase,
        memberIds
    );
    const memberProfiles = (memberProfilesData || []) as unknown as ProfileRow[];

    if (memberProfilesError) {
        throw memberProfilesError;
    }

    const { data: inviteData, error: inviteError } = await supabase
        .from('project_invites')
        .select('id, project_id, email, role, permission, token, status, invited_by, accepted_by, accepted_at, created_at, updated_at')
        .in('project_id', projectIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    const inviteRows = (inviteData || []) as unknown as ProjectInviteRow[];

    if (inviteError) {
        throw inviteError;
    }

    const profilesById = new Map(memberProfiles.map((profile) => [profile.id, profile]));
    const invitesByProjectId = new Map<string, ProjectInvite[]>();

    for (const invite of inviteRows) {
        const existing = invitesByProjectId.get(invite.project_id) || [];
        existing.push(mapProjectInvite(invite));
        invitesByProjectId.set(invite.project_id, existing);
    }

    const projects = projectRows.map((project) =>
        mapProjectSummary(
            project,
            mapTeamMembers(project.id, allMembershipRows, profilesById),
            invitesByProjectId.get(project.id) || []
        )
    );
    const profile = mapProfile(profileRow);
    const enrichedWorkspace = await enrichWorkspaceProjectsWithHub(projects, profile.id);

    return {
        profile,
        projects: enrichedWorkspace.projects,
        collaborationOverview: enrichedWorkspace.collaborationOverview,
        notifications
    };
}

export async function createProjectForCurrentUser(name?: string) {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        throw new Error('Unauthenticated');
    }

    const projectName = name?.trim() || 'New Innovation Project';
    const accent = ACCENT_OPTIONS[Math.floor(Math.random() * ACCENT_OPTIONS.length)];

    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
            owner_id: user.id,
            name: projectName,
            summary: 'A new sandbox project ready for team setup, context capture, and stage work.',
            accent
        })
        .select('id, owner_id, name, summary, accent, current_stage, background, objectives, assumptions, created_at, updated_at')
        .single();
    const projectRow = projectData as unknown as ProjectRow | null;

    if (projectError || !projectRow) {
        throw projectError || new Error('Failed to create project');
    }

    const { error: membershipError } = await supabase
        .from('project_members')
        .insert({
            project_id: projectRow.id,
            user_id: user.id,
            role: 'Workspace Owner',
            permission: 'owner',
            status: 'online'
        });

    if (membershipError) {
        throw membershipError;
    }

    const { profile } = await getWorkspaceShell();
    const member: TeamMember = {
        id: profile.id || user.id,
        name: profile.name,
        email: profile.email,
        initials: getInitials(profile.name),
        role: 'Workspace Owner',
        status: 'online',
        avatarColor: getAvatarGradient(user.id),
        permission: 'owner'
    };

    return mapProjectSummary(projectRow, [member], []);
}

export async function updateProjectSummary(projectId: string, updates: Partial<Pick<WorkspaceProject, 'name' | 'summary' | 'accent'>>) {
    const supabase = await createSupabaseServerClient();
    const payload: Record<string, string> = {};

    if (typeof updates.name === 'string') payload.name = updates.name;
    if (typeof updates.summary === 'string') payload.summary = updates.summary;
    if (typeof updates.accent === 'string') payload.accent = updates.accent;

    const { error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', projectId);

    if (error) {
        throw error;
    }
}

export async function deleteProject(projectId: string) {
    const supabase = await createSupabaseServerClient();
    const { user } = await getAuthenticatedProjectManager(projectId, 'owner');

    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name, owner_id')
        .eq('id', projectId)
        .maybeSingle();
    const project = projectData as { id: string; name: string; owner_id: string } | null;

    if (projectError || !project) {
        throw projectError || new Error('Project not found.');
    }

    const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId);
    const members = (memberData || []) as Array<{ user_id: string }>;

    if (memberError) {
        throw memberError;
    }

    await insertWorkspaceNotifications(
        supabase,
        members
            .map((member) => member.user_id)
            .filter((memberId) => memberId !== user.id)
            .map((memberId) => ({
                user_id: memberId,
                project_id: projectId,
                project_name: project.name,
                type: 'project-dissolved' as const,
                title: 'Project dissolved',
                message: `"${project.name}" was dissolved and removed from your dashboard.`
            }))
    );

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (error) {
        throw error;
    }
}

export async function addProjectMemberByEmail(projectId: string, email: string, permission: PermissionLevel = 'view'): Promise<InviteMemberResult> {
    const supabase = await createSupabaseServerClient();
    const { user: currentUser } = await getAuthenticatedProjectManager(projectId, 'edit');
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error('Enter a valid email address.');
    }

    const nextToken = randomUUID();
    const { data: existingInviteData, error: existingInviteError } = await supabase
        .from('project_invites')
        .select('id, project_id, email, role, permission, token, status, invited_by, accepted_by, accepted_at, created_at, updated_at')
        .eq('project_id', projectId)
        .ilike('email', normalizedEmail)
        .eq('status', 'pending')
        .maybeSingle();
    const existingInviteRow = existingInviteData as unknown as ProjectInviteRow | null;

    if (existingInviteError) {
        throw existingInviteError;
    }

    if (existingInviteRow) {
        const { data: updatedInviteData, error: updatedInviteError } = await supabase
            .from('project_invites')
            .update({
                permission,
                token: nextToken,
                invited_by: currentUser.id
            })
            .eq('id', existingInviteRow.id)
            .select('id, project_id, email, role, permission, token, status, invited_by, accepted_by, accepted_at, created_at, updated_at')
            .single();
        const updatedInvite = updatedInviteData as unknown as ProjectInviteRow | null;

        if (updatedInviteError || !updatedInvite) {
            throw updatedInviteError || new Error('Unable to refresh invite.');
        }

        return {
            delivery: 'invite-created',
            invite: mapProjectInvite(updatedInvite)
        };
    }

    const { data: inviteData, error: inviteError } = await supabase
        .from('project_invites')
        .insert({
            project_id: projectId,
            email: normalizedEmail,
            role: 'Team Member',
            permission,
            token: nextToken,
            invited_by: currentUser.id
        })
        .select('id, project_id, email, role, permission, token, status, invited_by, accepted_by, accepted_at, created_at, updated_at')
        .single();
    const inviteRow = inviteData as unknown as ProjectInviteRow | null;

    if (inviteError || !inviteRow) {
        throw inviteError || new Error('Unable to create invite.');
    }

    return {
        delivery: 'invite-created',
        invite: mapProjectInvite(inviteRow)
    };
}

export async function updateProjectMember(projectId: string, memberId: string, updates: Partial<Pick<ProjectMemberRow, 'permission' | 'role' | 'status'>>) {
    const { user } = await getAuthenticatedProjectManager(projectId, 'owner');
    const supabase = await createSupabaseServerClient();

    if (memberId === user.id && typeof updates.permission === 'string') {
        throw new Error('Owners cannot change their own permission.');
    }

    const { error } = await supabase
        .from('project_members')
        .update(updates)
        .eq('project_id', projectId)
        .eq('user_id', memberId);

    if (error) {
        throw error;
    }
}

export async function removeProjectMember(projectId: string, memberId: string) {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        throw new Error('Unauthenticated');
    }

    const { data: currentMembershipData, error: currentMembershipError } = await supabase
        .from('project_members')
        .select('permission')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();
    const currentMembership = currentMembershipData as { permission: PermissionLevel } | null;

    if (currentMembershipError || !currentMembership) {
        throw currentMembershipError || new Error('Forbidden');
    }

    const isSelfRemoval = memberId === user.id;

    if (!isSelfRemoval && currentMembership.permission !== 'owner') {
        throw new Error('Forbidden');
    }

    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .maybeSingle();
    const project = projectData as { owner_id: string } | null;

    if (projectError || !project) {
        throw projectError || new Error('Project not found.');
    }

    if (project.owner_id === memberId) {
        throw new Error(
            isSelfRemoval
                ? 'Owners cannot leave their own project. Delete the project or transfer ownership first.'
                : 'Remove or transfer project ownership before deleting this member.'
        );
    }

    const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', memberId);

    if (error) {
        throw error;
    }
}

export async function getProjectInviteById(projectId: string, inviteId: string): Promise<ProjectInvite> {
    await getAuthenticatedProjectManager(projectId, 'edit');
    const invite = await getPendingInviteRow(projectId, inviteId);
    return mapProjectInvite(invite);
}

export async function revokeProjectInvite(projectId: string, inviteId: string): Promise<ProjectInvite> {
    await getAuthenticatedProjectManager(projectId, 'edit');
    const supabase = await createSupabaseServerClient();
    const invite = await getPendingInviteRow(projectId, inviteId);

    if (invite.status !== 'pending') {
        throw new Error('Only pending invites can be revoked.');
    }

    const { data, error } = await supabase
        .from('project_invites')
        .update({
            status: 'revoked'
        })
        .eq('project_id', projectId)
        .eq('id', inviteId)
        .select('id, project_id, email, role, permission, token, status, invited_by, accepted_by, accepted_at, created_at, updated_at')
        .single();
    const revokedInvite = data as unknown as ProjectInviteRow | null;

    if (error || !revokedInvite) {
        throw error || new Error('Unable to revoke invite.');
    }

    return mapProjectInvite(revokedInvite);
}

export async function getProjectInviteByToken(token: string): Promise<ProjectInviteDetails> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_project_invite', {
        invite_token: token
    });
    const rows = (data || []) as unknown as ProjectInviteDetailsRow[];
    const invite = rows[0];

    if (error || !invite) {
        throw error || new Error('Invite not found.');
    }

    return {
        id: invite.id,
        projectId: invite.project_id,
        projectName: invite.project_name,
        email: invite.email,
        permission: invite.permission,
        status: invite.status,
        createdAt: invite.created_at
    };
}

export async function acceptProjectInvite(token: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('accept_project_invite', {
        invite_token: token
    });

    if (error || !data) {
        throw error || new Error('Unable to accept invite.');
    }

    return data as string;
}

export async function getProjectDocument(projectId: string) {
    const supabase = await createSupabaseServerClient();

    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, owner_id, name, summary, accent, current_stage, background, objectives, assumptions, success_metrics, created_at, updated_at')
        .eq('id', projectId)
        .single();
    const projectRow = projectData as unknown as ProjectRow | null;

    if (projectError || !projectRow) {
        throw projectError || new Error('Project not found');
    }

    const { data: toolRunData, error: toolRunError } = await supabase
        .from('tool_runs')
        .select('id, project_id, method_card_id, method_card_title, stage, current_step_index, data, answers, ai_responses, created_at, updated_at')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
    const toolRunRows = (toolRunData || []) as unknown as ToolRunRow[];

    if (toolRunError) {
        throw toolRunError;
    }

    const document: ProjectData = {
        id: projectRow.id,
        context: {
            name: projectRow.name,
            background: projectRow.background || '',
            objectives: projectRow.objectives || '',
            assumptions: projectRow.assumptions || '',
            aiHandoffPrompt: projectRow.success_metrics || ''
        },
        currentStage: projectRow.current_stage,
        toolRuns: toolRunRows.map(mapToolRun)
    };

    return document;
}

export async function saveProjectDocument(projectId: string, document: ProjectData) {
    const supabase = await createSupabaseServerClient();

    const { error: projectError } = await supabase
        .from('projects')
        .update({
            name: document.context.name,
            current_stage: document.currentStage,
            background: document.context.background,
            objectives: document.context.objectives,
            assumptions: document.context.assumptions,
            success_metrics: document.context.aiHandoffPrompt || ''
        })
        .eq('id', projectId);

    if (projectError) {
        throw projectError;
    }

    const incomingRunIds = document.toolRuns.map((run) => run.id);

    const { data: existingRunData, error: existingRunsError } = await supabase
        .from('tool_runs')
        .select('id')
        .eq('project_id', projectId);
    const existingRuns = (existingRunData || []) as Array<{ id: string }>;

    if (existingRunsError) {
        throw existingRunsError;
    }

    const staleRunIds = existingRuns
        .map((run) => run.id)
        .filter((id) => !incomingRunIds.includes(id));

    if (staleRunIds.length > 0) {
        const { error: deleteError } = await supabase
            .from('tool_runs')
            .delete()
            .in('id', staleRunIds);

        if (deleteError) {
            throw deleteError;
        }
    }

    if (document.toolRuns.length > 0) {
        const { error: upsertError } = await supabase
            .from('tool_runs')
            .upsert(document.toolRuns.map((run) => ({
                id: run.id,
                project_id: projectId,
                method_card_id: run.methodCardId,
                method_card_title: run.methodCardTitle,
                stage: run.stage,
                current_step_index: run.currentStepIndex ?? 0,
                data: run.data || {},
                answers: run.answers || {},
                ai_responses: run.aiResponses || [],
                created_at: new Date(run.createdAt).toISOString(),
                updated_at: new Date(run.updatedAt).toISOString()
            })), { onConflict: 'id' });

        if (upsertError) {
            throw upsertError;
        }
    }
}

export async function updateCurrentUserProfile(updates: Partial<UserProfileData>) {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser();

    if (!user) {
        throw new Error('Unauthenticated');
    }

    const payload = {
        full_name: updates.name,
        title: updates.title,
        phone: updates.phone,
        location: updates.location,
        workspace_name: updates.workspace,
        company: updates.company,
        billing_email: updates.billingEmail,
        account_role: updates.accountRole,
        subscription_tier: updates.subscriptionTier,
        billing_cycle: updates.billingCycle,
        subscription_status: updates.subscriptionStatus,
        renewal_date: updates.renewalDate,
        payment_method_label: updates.paymentMethodLabel,
        guide_preferences: updates.guidePreferences
    };

    const sanitizedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => typeof value === 'string' || value === null || isRecord(value))
    );

    const { error } = await supabase
        .from('profiles')
        .update(sanitizedPayload)
        .eq('id', user.id);

    if (error && isMissingGuidePreferencesColumnError(error)) {
        const legacyPayload = { ...sanitizedPayload };
        delete legacyPayload.guide_preferences;

        const { error: fallbackError } = await supabase
            .from('profiles')
            .update(legacyPayload)
            .eq('id', user.id);

        if (fallbackError) {
            throw fallbackError;
        }

        return;
    }

    if (error) {
        throw error;
    }
}

export async function exportWorkspaceSnapshotForCurrentUser(): Promise<WorkspaceExportDto> {
    const workspace = await getWorkspaceShell();
    const [projectDocuments, projectHubs] = await Promise.all([
        Promise.all(workspace.projects.map((project) => getProjectDocument(project.id))),
        Promise.all(workspace.projects.map((project) => getProjectHub(project.id)))
    ]);

    return {
        version: 'remote-supabase-v1',
        mode: 'remote-supabase',
        exportedAt: new Date().toISOString(),
        workspace,
        projectDocuments,
        projectHubs
    };
}

export async function importWorkspaceSnapshotForCurrentUser(raw: unknown): Promise<WorkspaceImportResult> {
    const user = await getAuthenticatedUser();

    if (!user?.email) {
        throw new Error('Unauthenticated');
    }

    if (!isRecord(raw) || !isRecord(raw.workspace) || !Array.isArray(raw.projectDocuments)) {
        throw new Error('Backup file is missing workspace data.');
    }

    const rawWorkspace = raw.workspace;
    const rawProjects = Array.isArray(rawWorkspace.projects) ? rawWorkspace.projects : [];
    const rawDocuments = raw.projectDocuments;
    const rawProjectHubs = Array.isArray(raw.projectHubs) ? raw.projectHubs : [];

    let importedProjects = 0;
    const importedMembers = 0;
    let importedInvites = 0;

    for (let index = 0; index < rawProjects.length; index += 1) {
        const rawProject = rawProjects[index];
        if (!isRecord(rawProject)) {
            continue;
        }

        const sourceProjectId = normalizeString(rawProject.id);
        const projectName = normalizeString(rawProject.name, `Imported Project ${index + 1}`) || `Imported Project ${index + 1}`;
        const createdProject = await createProjectForCurrentUser(projectName);

        await updateProjectSummary(createdProject.id, {
            name: projectName,
            summary: normalizeString(rawProject.summary, 'Imported from a workspace backup.'),
            accent: normalizeString(rawProject.accent, createdProject.accent)
        });

        const matchingDocument = rawDocuments.find((document) => isRecord(document) && normalizeString(document.id) === sourceProjectId);
        const nextDocument = normalizeProjectDocument(matchingDocument, createdProject.id, projectName);
        await saveProjectDocument(createdProject.id, nextDocument);
        const matchingHub = rawProjectHubs.find((hub) => (
            isRecord(hub)
            && isRecord(hub.brief)
            && normalizeString(hub.brief.projectId) === sourceProjectId
        ));
        const nextHub = matchingHub as ProjectHubData | undefined;
        if (nextHub) {
            await saveProjectHubSnapshot(createdProject.id, {
                ...nextHub,
                brief: {
                    ...nextHub.brief,
                    projectId: createdProject.id
                },
                cards: nextHub.cards.map((item) => ({ ...item, projectId: createdProject.id })),
                sessions: nextHub.sessions.map((item) => ({ ...item, projectId: createdProject.id })),
                decisions: nextHub.decisions.map((item) => ({ ...item, projectId: createdProject.id })),
                artifacts: nextHub.artifacts.map((item) => ({ ...item, projectId: createdProject.id })),
                threads: nextHub.threads.map((item) => ({ ...item, projectId: createdProject.id })),
                tasks: nextHub.tasks.map((item) => ({ ...item, projectId: createdProject.id })),
                activity: nextHub.activity.map((item) => ({ ...item, projectId: createdProject.id })),
                presence: nextHub.presence.map((item) => ({ ...item, projectId: createdProject.id }))
            });
        }
        importedProjects += 1;

        const processedEmails = new Set<string>([user.email.toLowerCase()]);
        const rawMembers = Array.isArray(rawProject.members) ? rawProject.members : [];
        const rawInvites = Array.isArray(rawProject.pendingInvites) ? rawProject.pendingInvites : [];

        for (const rawMember of rawMembers) {
            if (!isRecord(rawMember)) {
                continue;
            }

            const email = normalizeString(rawMember.email).trim().toLowerCase();
            if (!email || processedEmails.has(email)) {
                continue;
            }

            processedEmails.add(email);
            const result = await addProjectMemberByEmail(
                createdProject.id,
                email,
                normalizePermission(rawMember.permission)
            );

            if (result.invite) {
                importedInvites += 1;
            }
        }

        for (const rawInvite of rawInvites) {
            if (!isRecord(rawInvite)) {
                continue;
            }

            const email = normalizeString(rawInvite.email).trim().toLowerCase();
            if (!email || processedEmails.has(email)) {
                continue;
            }

            processedEmails.add(email);
            const result = await addProjectMemberByEmail(
                createdProject.id,
                email,
                normalizePermission(rawInvite.permission)
            );

            if (result.invite) {
                importedInvites += 1;
            }
        }
    }

    return {
        importedProjects,
        importedMembers,
        importedInvites
    };
}

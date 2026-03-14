# Runtime And API Spec

This project now supports two concrete runtime modes:

- `local-mvp`: browser-local persistence with demo auth
- `remote-supabase`: real auth, real Postgres persistence, real invites, and real project state

The AI layer is still intentionally local and abstracted. That keeps the UX complete for testing while leaving the eventual model provider replaceable.

## Runtime Modes

### `local-mvp`

- Auth is simulated in the UI
- Workspace and project documents live in browser storage
- Export and import use a local JSON snapshot
- AI responses come from the local gateway

### `remote-supabase`

- Auth is handled by Supabase Auth
- Email/password, Google OAuth, GitHub OAuth, and password reset are wired in
- Workspace metadata, projects, members, invites, and tool runs live in Postgres
- Export and import use a remote JSON snapshot through authenticated API routes
- Invite links can be generated for users who have not signed in yet

## Core Resources

### Workspace Shell

- `GET /api/workspace`
  - Response:
    - `mode: "remote-supabase"`
    - `workspace`
      - `profile: UserProfileData`
      - `projects: WorkspaceProject[]`

### Workspace Transfer

- `GET /api/workspace/export`
  - Response:
    - `snapshot: WorkspaceExportDto`

- `POST /api/workspace/import`
  - Request:
    - `snapshot: WorkspaceExportDto`
  - Response:
    - `result`
      - `importedProjects: number`
      - `importedMembers: number`
      - `importedInvites: number`

### Profile

- `PATCH /api/profile`
  - Request:
    - any subset of:
      - `name`
      - `title`
      - `phone`
      - `location`
      - `workspace`
      - `company`
      - `billingEmail`
      - `accountRole`
  - Response:
    - `profile: UserProfileData`

### Projects

- `POST /api/projects`
  - Request:
    - optional `name: string`
  - Response:
    - `project: WorkspaceProject`

- `PATCH /api/projects/:projectId`
  - Request:
    - any subset of:
      - `name`
      - `summary`
      - `accent`
  - Response:
    - `ok: true`

- `DELETE /api/projects/:projectId`
  - Response:
    - `ok: true`

### Project Document

- `GET /api/projects/:projectId/document`
  - Response:
    - `document: ProjectData`

- `PUT /api/projects/:projectId/document`
  - Request:
    - `document: ProjectData`
  - Response:
    - `ok: true`

### Project Members And Invites

- `POST /api/projects/:projectId/members`
  - Request:
    - `email: string`
    - `permission: "owner" | "edit" | "view"`
  - Response when the email already belongs to an existing user:
    - `delivery: "member-added"`
  - Response when the email needs an invitation link:
    - `delivery: "invite-created"`
    - `invite`
      - `id: string`
      - `email: string`
      - `permission: "owner" | "edit" | "view"`
      - `status: "pending"`
      - `createdAt: string`
      - `inviteUrl: string`

- `PATCH /api/projects/:projectId/members/:memberId`
  - Request:
    - `permission: "owner" | "edit" | "view"`
  - Response:
    - `ok: true`

### Invitation Acceptance

- `GET /api/invites/:token`
  - Response:
    - `invite`
      - `id: string`
      - `projectId: string`
      - `projectName: string`
      - `email: string`
      - `permission: "owner" | "edit" | "view"`
      - `status: "pending" | "accepted" | "revoked"`
      - `createdAt: string`

- `POST /api/invites/:token`
  - Behavior:
    - requires an authenticated user whose email matches the invite email
    - converts the invite into a real project membership
  - Response:
    - `ok: true`
    - `projectId: string`

## Frontend Contracts

### `WorkspaceProject`

The dashboard now expects:

- `members: TeamMember[]`
- optional `pendingInvites: ProjectInvite[]`

### `WorkspaceExportDto`

The export format supports both modes:

- `version: "local-mvp-v1" | "remote-supabase-v1"`
- `mode: "local-mvp" | "remote-supabase"`
- `exportedAt: string`
- `workspace`
  - `projects: WorkspaceProject[]`
  - `profile: UserProfileData`
- `projectDocuments: ProjectData[]`

## AI Surface

The AI contract is still routed through:

- [api.ts](/D:/Local_Code/Extended_Project/src/lib/contracts/api.ts)
- [aiGateway.ts](/D:/Local_Code/Extended_Project/src/lib/services/aiGateway.ts)

Current behavior:

- `mode: "local-mvp"`
- `source: "local-mock"`

That seam is intentionally left in place so the client can later replace only the AI implementation without rewriting the rest of the product.

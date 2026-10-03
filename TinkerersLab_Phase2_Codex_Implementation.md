# Tinkerers Lab — Phase 2 Implementation
## Project Management + User Projects + Team Members

**Project:** Tinkerers Lab — Ahmedabad University  
**Firebase Project ID:** `tinkerers-lab-39e6a`  
**Phase:** 2  
**Prerequisite:** Phase 1 must be working and verified before starting Phase 2.

---

# 0. PHASE 2 OBJECTIVE

Phase 1 established:

```text
Google Login
    ↓
Firebase Authentication
    ↓
users/{uid}
    ↓
Onboarding
    ↓
Dashboard
```

Phase 2 now adds the **user project system**.

The goal is to allow authenticated Tinkerers Lab users to:

- Create projects
- View their projects
- View project details
- Edit projects they own
- Add/remove project team members
- View team members
- Categorize projects using the five approved project categories
- Display project information on a project page
- Keep project ownership and authorization secure
- Prepare the architecture for later QR/equipment/inventory phases

---

# 1. CRITICAL UI PRESERVATION RULE

The user explicitly requires:

> "UI changes na karis jya require hoy taya j karaje."

Therefore:

- Do NOT redesign the existing website.
- Do NOT redesign the homepage.
- Do NOT redesign workshops.
- Do NOT redesign facilities.
- Do NOT redesign the existing portfolio.
- Do NOT redesign the existing navigation.
- Do NOT change the global color system.
- Do NOT change global typography.
- Do NOT replace the existing layout system.

Reuse existing:

- Header
- Navigation
- Footer
- Buttons
- Cards
- Forms
- Dialogs
- Inputs
- Select components
- Existing spacing
- Existing typography
- Existing design tokens
- Existing shadcn/ui components
- Existing responsive patterns

Only add the minimum UI required for Phase 2.

New project pages must visually match the existing website and Phase 1 dashboard.

At the end, report:

- UI files changed
- Why they were changed
- UI intentionally left unchanged

---

# 2. PHASE 2 SCOPE

Implement ONLY:

1. Project data model
2. Project creation
3. Project listing
4. Project details page
5. Project editing
6. Project ownership
7. Team member management
8. Project category selection
9. Project status
10. Project contact information
11. Secure project authorization
12. Dashboard project section
13. Firestore rules for projects and members
14. Basic project search/filter if it fits naturally into the existing UI

Do NOT implement yet:

- QR scanning
- Equipment
- Equipment usage
- Live equipment usage
- Inventory
- Borrowing
- Components
- Media uploads
- Firebase Storage
- Project analytics
- Activity logs
- Notifications
- Admin dashboard
- Equipment reservation
- Equipment booking
- Inventory Excel import
- Project recommendations
- AI features
- Public project discovery unless explicitly required by existing architecture

These belong to later phases.

---

# 3. FIVE PROJECT CATEGORIES

The project system MUST support exactly these five categories:

```text
1. Design, Innovation and Making (DIM)
2. Product Dissection and Realization (PDR)
3. Research under Professor
4. Personal Project
5. Start-up
```

Use these exact names in the application unless there is a strong technical reason to introduce internal enum values.

Recommended internal values:

```text
DIM
PDR
RESEARCH
PERSONAL
STARTUP
```

Display labels:

```text
DIM → Design, Innovation and Making
PDR → Product Dissection and Realization
RESEARCH → Research under Professor
PERSONAL → Personal Project
STARTUP → Start-up
```

Do not add additional project categories in Phase 2.

---

# 4. PROJECT FIRESTORE STRUCTURE

Create:

```text
projects/{projectId}
```

Recommended project document:

```ts
{
  projectId: string,
  title: string,
  slug: string,
  category: ProjectCategory,
  shortDescription: string,
  description: string,

  ownerUid: string,

  status: ProjectStatus,

  department?: string,
  branch?: string,

  professorName?: string,

  contactEmail?: string,
  contactPhone?: string,
  instagramUrl?: string,

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Important:

- `projectId` must equal the Firestore document ID.
- `ownerUid` must be the verified authenticated user's UID when creating the project.
- Never accept owner UID as a trusted browser field.
- `createdAt` must only be set during creation.
- `updatedAt` must update whenever project data changes.

---

# 5. PROJECT MEMBERS

Use the planned subcollection:

```text
projects/{projectId}/members/{uid}
```

Member document:

```ts
{
  uid: string,
  name: string,
  email: string,
  role: ProjectMemberRole,
  joinedAt: Timestamp
}
```

Recommended roles:

```text
OWNER
MEMBER
```

Rules:

- Every project must have one owner.
- Owner is represented by `ownerUid` in the project document.
- Owner should also be represented in the members subcollection if the architecture benefits from consistent member display.
- Do not allow an ordinary member to become owner through client input.
- Ownership changes are NOT implemented in Phase 2 unless technically necessary.

---

# 6. PROJECT STATUS

Use a small controlled set:

```text
ACTIVE
COMPLETED
ARCHIVED
```

Default:

```text
ACTIVE
```

Do not create additional statuses without requirement.

---

# 7. PROJECT CREATION FLOW

Dashboard:

```text
/dashboard
      ↓
My Projects
      ↓
Create Project
      ↓
/projects/new
```

Creation form:

### Required

- Project title
- Category
- Short description
- Description

### Optional

- Department
- Branch
- Professor name
- Contact email
- Contact phone
- Instagram URL

Status should default to:

```text
ACTIVE
```

Owner should automatically be the authenticated user.

Do NOT show an editable owner UID field.

---

# 8. PROJECT TITLE VALIDATION

Requirements:

- Required
- Trim whitespace
- Reasonable maximum length
- Prevent empty title
- Do not allow whitespace-only title

Do not over-engineer validation.

---

# 9. PROJECT DESCRIPTION

Provide:

### Short description

For project cards/dashboard preview.

### Full description

For project details page.

Keep the form simple.

Do not introduce a rich-text editor unless the existing project already uses one.

Plain text is sufficient for Phase 2.

---

# 10. PROJECT CATEGORY

Use a select/dropdown.

Options:

```text
Design, Innovation and Making (DIM)
Product Dissection and Realization (PDR)
Research under Professor
Personal Project
Start-up
```

Category must be validated server-side.

Do not trust arbitrary category strings from the browser.

---

# 11. PROJECT OWNER

When creating a project:

```text
ownerUid = verified Firebase Auth UID
```

Never:

```text
ownerUid = form.ownerUid
```

The browser must not determine ownership.

---

# 12. PROJECT LIST

Dashboard should contain a:

```text
My Projects
```

section.

Display:

- Project title
- Category
- Short description
- Status
- Owner/member context
- Updated date if useful

Add:

```text
Create Project
```

button.

If the user has no projects:

```text
No projects yet.
Create your first project.
```

Do not create fake projects.

---

# 13. PROJECT DETAIL PAGE

Create:

```text
/projects/[projectId]
```

Display:

- Project title
- Category
- Status
- Short description
- Full description
- Department
- Branch
- Professor
- Contact email
- Contact phone
- Instagram
- Owner
- Team members
- Created date
- Updated date

Only display optional fields when present.

Do not show empty labels unnecessarily.

---

# 14. PROJECT EDITING

Only the project owner can edit project information in Phase 2.

Create:

```text
/projects/[projectId]/edit
```

or an existing compatible edit pattern.

Editable:

- Title
- Category
- Short description
- Description
- Department
- Branch
- Professor
- Contact email
- Contact phone
- Instagram
- Status

Do not allow:

- ownerUid modification
- projectId modification
- createdAt modification

Server must enforce ownership.

---

# 15. TEAM MEMBER ADDITION

The owner can add existing Tinkerers Lab users as project members.

Preferred flow:

```text
Add team member
    ↓
Search/select existing user
    ↓
Add by verified user UID
    ↓
Create:
projects/{projectId}/members/{uid}
```

Do NOT create a second user profile.

Do NOT create a member using arbitrary name/email supplied by the browser if the user already exists in `users`.

Member identity should come from:

```text
users/{uid}
```

---

# 16. TEAM MEMBER DISPLAY

On project detail page:

```text
Team Members
```

Display:

- Name
- Email
- Role

Do not expose unnecessary user profile information.

---

# 17. TEAM MEMBER REMOVAL

Owner may remove a member.

Requirements:

- Owner cannot accidentally remove ownership.
- Owner cannot be converted into ordinary member.
- Removing a member only deletes the member relationship.
- It does NOT delete the user's `users/{uid}` profile.
- It does NOT delete the project.

---

# 18. PROJECT ACCESS MODEL

For Phase 2:

### Public users

Do not automatically expose all private project data publicly.

Follow the existing website's authentication/content model.

### Authenticated project owner

Can:

- Read own project
- Edit own project
- Add members
- Remove members

### Authenticated project member

Can:

- Read project
- Read team members

Member edit permissions should NOT be granted unless explicitly required.

### Non-member authenticated user

Follow the project visibility decision implemented in the existing architecture.

If projects are private to authenticated project teams in Phase 2, enforce that.

Do not accidentally expose private project contact details to everyone.

---

# 19. FIRESTORE SECURITY RULES

Add rules for:

```text
projects/{projectId}
projects/{projectId}/members/{uid}
```

Rules must verify:

- User is authenticated.
- Project exists where necessary.
- Ownership is based on `ownerUid`.
- Browser cannot change `ownerUid`.
- Member cannot modify project.
- Only owner can add/remove members.
- Users can only modify authorized documents.

Do NOT use client-provided owner IDs as authorization.

Important:

```text
request.auth.uid
```

must be the source of identity.

Preserve existing:

```text
users
registrations
```

rules.

Do not remove existing registration rules.

---

# 20. SERVER ACTION / API SECURITY

Use the existing verified-token Server Action pattern from Phase 1.

Before every protected operation:

1. Get Firebase ID token/session using existing auth architecture.
2. Verify token server-side.
3. Extract verified UID.
4. Fetch project.
5. Check ownership/member permission.
6. Perform operation.

Never authorize based only on:

```text
project.ownerUid
```

sent by browser.

Never trust:

```text
uid
ownerUid
role
```

from client form data.

---

# 21. PROJECT ID GENERATION

Use Firestore document IDs.

Example:

```text
projects/
  autoGeneratedProjectId
```

Do not allow users to manually choose arbitrary Firestore document IDs.

Slug may be generated from title if useful, but:

- slug must not be used as the security boundary.
- projectId remains the primary identifier.

---

# 22. PROJECT SLUG

If implementing a slug:

- Normalize title.
- Make it URL-friendly.
- Handle duplicate titles.
- Do not rely on slug uniqueness for authorization.

Example:

```text
Smart Room Control System
```

could become:

```text
smart-room-control-system
```

But projectId remains authoritative.

---

# 23. DASHBOARD INTEGRATION

Update Phase 1 dashboard minimally.

Current dashboard:

```text
Profile
Projects will appear here in a future phase.
```

Replace that placeholder with:

```text
My Projects
```

and project cards/list.

Keep the existing profile section.

Do not redesign the dashboard unnecessarily.

---

# 24. PROJECT CREATION UI

Reuse existing form components.

Suggested structure:

```text
Project title
Category
Short description
Description

Department
Branch
Professor

Contact email
Contact phone
Instagram URL

Create Project
```

Do not add media upload yet.

---

# 25. PROJECT EDIT UI

Reuse the creation form where practical.

Avoid duplicate form logic.

Create a reusable project form component if it reduces duplication.

---

# 26. USER SEARCH FOR TEAM MEMBERS

If team member search is implemented:

Search only fields necessary for selection.

Recommended:

- Name
- Email
- Enrollment number

Do not expose unrelated user profile information.

Search results should only be available to authenticated users authorized to manage the project.

---

# 27. DUPLICATE MEMBER PROTECTION

Adding the same user twice must not create duplicate memberships.

Because membership document ID is:

```text
members/{uid}
```

the UID provides the uniqueness boundary.

If member already exists:

- Do not create duplicate member.
- Show a useful message.

---

# 28. OWNER PROTECTION

Never allow:

- deleting owner membership accidentally
- changing ownerUid through edit form
- assigning owner role from ordinary client input

Owner is determined by:

```text
projects/{projectId}.ownerUid
```

---

# 29. PROJECT DELETION

Do NOT implement project deletion in Phase 2 unless the existing requirements explicitly require it.

If deletion is implemented later, it must be a separate protected operation.

For Phase 2, prefer:

```text
ARCHIVED
```

instead of deleting data.

---

# 30. MEDIA

Do NOT implement:

- image uploads
- video uploads
- Firebase Storage
- thumbnails
- galleries

These will be handled in a later phase.

The project detail page should simply leave space for future media without implementing upload functionality.

---

# 31. REAL-TIME DATA

Do NOT add `onSnapshot` yet unless genuinely required.

Phase 2 can use standard Firestore reads.

Real-time updates are planned for later equipment usage.

---

# 32. TYPESCRIPT TYPES

Create reusable types:

```ts
ProjectCategory
ProjectStatus
ProjectMemberRole
Project
ProjectMember
```

Avoid `any`.

Use shared types where appropriate.

---

# 33. EXISTING STATIC PORTFOLIO

Do NOT replace:

```text
src/content/projects.ts
```

or other static portfolio data.

Important distinction:

```text
Existing static portfolio projects
            ≠
User-created Firestore projects
```

Keep both systems separate.

---

# 34. EXISTING WORKSHOP REGISTRATION

Do not change:

```text
registrations
```

collection behavior.

Do not migrate registration documents.

Do not mix project membership with workshop registration.

Existing registration flow must continue working.

---

# 35. AUTHENTICATION

Reuse Phase 1 authentication.

Do not create a new login system.

Continue enforcing:

```text
@ahduni.edu.in
```

for Tinkerers Lab authenticated users.

---

# 36. ROUTES

Expected Phase 2 routes:

```text
/dashboard
/projects/new
/projects/[projectId]
/projects/[projectId]/edit
```

Use the project's existing App Router conventions.

Do not create unnecessary duplicate routes.

---

# 37. ERROR HANDLING

Handle:

- Not authenticated
- Project not found
- Unauthorized access
- Invalid project ID
- Invalid category
- Invalid status
- Missing required fields
- Duplicate member
- User not found when adding member
- Network/server error

Use existing project error/status UI patterns.

Do not expose internal Firebase errors directly to users.

---

# 38. LOADING STATES

Provide appropriate loading states for:

- Project list
- Project creation
- Project detail
- Project edit
- Member search
- Add member
- Remove member

Prevent duplicate submissions.

---

# 39. RESPONSIVE DESIGN

New project UI must work on:

- Desktop
- Tablet
- Mobile

Reuse existing responsive classes/patterns.

Do not redesign global responsive behavior.

---

# 40. IMPLEMENTATION PROCESS

Before editing:

1. Read this entire specification.
2. Inspect Phase 1 implementation.
3. Inspect:
   - `src/app/actions/profile.ts`
   - `src/components/sections/ProfileRoute.tsx`
   - `src/app/dashboard/page.tsx`
   - `src/types/index.ts`
   - `firestore.rules`
4. Inspect existing UI components.
5. Inspect existing Firestore/server action patterns.
6. Identify minimum files required.

Then implement Phase 2.

Do not rewrite unrelated files.

Do not refactor unrelated code.

Do not modify UI files without a Phase 2 reason.

---

# 41. SECURITY REVIEW

Before finishing, verify:

- No Admin SDK in client components.
- No service-account credentials exposed.
- No client-trusted UID authorization.
- No client-trusted ownerUid authorization.
- Project ownership verified server-side.
- Member permissions verified server-side.
- Firestore rules protect project documents.
- Firestore rules protect member documents.
- Existing `users` rules remain intact.
- Existing `registrations` rules remain intact.

---

# 42. VALIDATION

Run:

```bash
npx tsc --noEmit
```

Run:

```bash
npm run lint
```

Run:

```bash
npm run build
```

If available, run existing tests.

Do not hide errors.

If build fails because of external network/font fetching, distinguish that from application errors.

---

# 43. FIRESTORE RULE TESTING

If emulator/rules tests already exist, use them.

Test at minimum:

### Owner

- Can read project
- Can update project
- Can add member
- Can remove member

### Member

- Can read project
- Can read members
- Cannot edit project
- Cannot add/remove members

### Non-member

- Cannot access private project data if Phase 2 uses private project access.

### Unauthenticated

- Cannot access protected project data.

### Cross-project attack

A user must not be able to modify another owner's project by changing:

```text
projectId
ownerUid
uid
role
```

in browser requests.

---

# 44. ACCEPTANCE TESTS

## TEST 1 — Create Project

Login as existing user.

Go:

```text
/dashboard
```

Click:

```text
Create Project
```

Fill required fields.

Expected:

```text
projects/{projectId}
```

created.

`ownerUid` must equal logged-in Firebase UID.

---

## TEST 2 — Dashboard Project List

After creation:

Expected dashboard shows:

```text
My Projects
```

with the new project.

---

## TEST 3 — Project Details

Click project.

Expected:

```text
/projects/{projectId}
```

shows all saved information.

---

## TEST 4 — Edit Project

Owner clicks Edit.

Changes title/description/category.

Expected:

- Changes saved.
- `updatedAt` changes.
- `createdAt` remains unchanged.
- `ownerUid` remains unchanged.

---

## TEST 5 — Team Member

Owner adds another existing Tinkerers Lab user.

Expected:

```text
projects/{projectId}/members/{uid}
```

created.

---

## TEST 6 — Duplicate Member

Add same member again.

Expected:

- No duplicate membership.
- Useful message.

---

## TEST 7 — Remove Member

Owner removes member.

Expected:

- Member document removed.
- User profile remains intact.

---

## TEST 8 — Member Permissions

Login as member.

Expected:

- Can view project.
- Cannot edit project.
- Cannot add member.
- Cannot remove member.

---

## TEST 9 — Non-member Permissions

Login as another authenticated user.

Expected behavior must match the chosen Phase 2 visibility model.

Do not accidentally expose private project information.

---

## TEST 10 — Existing Phase 1

Verify:

- Login still works.
- Onboarding still works for users without profile.
- Existing dashboard profile still works.

---

## TEST 11 — Workshop Registration

Verify existing workshop registration still works.

---

## TEST 12 — Public Website

Verify:

- Homepage
- About
- Workshops
- Facilities
- Portfolio
- Help

still work.

---

# 45. DO NOT IMPLEMENT FUTURE FEATURES

Do NOT add code for:

```text
QR
Equipment
Inventory
Borrowing
Media
Storage
Analytics
Activity Logs
Admin
Notifications
```

Do not create placeholder collections for these.

Keep the Phase 2 implementation focused.

---

# 46. FINAL REPORT

After implementation, provide:

## A. Files created

## B. Files modified

## C. Files intentionally untouched

## D. Project Firestore schema

## E. Member Firestore schema

## F. Project categories

## G. Project status model

## H. Authentication/security flow

## I. Firestore rules

## J. Server-side authorization

## K. UI changes

## L. UI intentionally unchanged

## M. Tests performed

## N. TypeScript result

## O. Lint result

## P. Build result

## Q. Firestore rules test result

## R. Remaining manual Firebase steps

## S. Errors/warnings

Never print:

- API keys
- Private keys
- Service-account JSON
- `.env.local` values
- Credential contents

---

# FINAL INSTRUCTION

IMPLEMENT PHASE 2 NOW.

Read this entire specification before editing.

Do not stop at planning.

Actually implement the required code.

Preserve the existing website.

Preserve Phase 1.

Do not implement Phase 3 features.

Do not redesign the UI.

Do not expose secrets.

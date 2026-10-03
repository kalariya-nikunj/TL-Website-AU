# Tinkerers Lab — Phase 1 Implementation
## User Onboarding + User Profile + Dashboard

**Project:** Tinkerers Lab — Ahmedabad University  
**Firebase Project ID:** `tinkerers-lab-39e6a`  
**Phase:** 1  
**Target:** Existing Next.js + TypeScript + Firebase website

---

## 0. Current Verified Firebase State

Firebase migration has already been completed and verified:

- Firebase project: `Tinkerers Lab`
- Project ID: `tinkerers-lab-39e6a`
- Google Authentication is enabled.
- `@ahduni.edu.in` Google login works.
- Firebase Admin SDK authenticated operation works.
- Firebase client configuration points to the new project.
- `GOOGLE_APPLICATION_CREDENTIALS` is configured locally.
- TypeScript validation passes.
- Existing workshop/event registration must continue working.

Do not repeat Firebase migration unless a genuine issue is discovered.

---

# 1. CRITICAL UI PRESERVATION RULE

The user explicitly requested:

> "UI changes na karis jya require hoy taya j karaje."

Therefore, do **not** redesign the existing website.

Reuse existing:

- Header
- Navigation
- Footer
- Typography
- Buttons
- Cards
- Forms
- Inputs
- Spacing
- Colors
- Responsive behavior
- Existing shadcn/ui/project components

Do NOT redesign or modify:

- Homepage
- Workshop pages
- Workshop registration UI
- Portfolio
- Facilities
- Existing navigation
- Existing footer
- Existing public content

Only make UI changes required for `/onboarding` and `/dashboard`.

New pages must visually match the existing website.

At the end, explicitly report:
1. UI files changed
2. Why each UI change was necessary
3. Existing UI intentionally left unchanged

---

# 2. PHASE 1 SCOPE

Implement ONLY:

1. Google authentication detection
2. User profile existence check
3. First-time onboarding
4. Firestore `users/{uid}` profile
5. Authenticated user dashboard
6. Basic profile display
7. Auth redirect logic
8. Firestore security rules for `users`
9. Server-side authorization using verified Firebase ID token

## DO NOT IMPLEMENT YET

- Projects
- Project CRUD
- Project categories management
- Team members
- QR codes
- Equipment
- Equipment usage
- Inventory
- Components
- Borrowing
- Borrow transactions
- Media uploads
- Firebase Storage
- Project analytics
- Activity logs
- Admin dashboard
- Project history
- Notifications
- Project search
- Real-time project updates
- `onSnapshot` for project/equipment functionality

Do not create unnecessary architecture for future phases.

---

# 3. REQUIRED USER FLOW

```text
Google Sign In
      ↓
Firebase Authentication
      ↓
Get authenticated Firebase UID
      ↓
Check Firestore:
users/{uid}
      ↓
Does profile exist?
      ├── NO
      │    ↓
      │  /onboarding
      │    ↓
      │  Complete profile
      │    ↓
      │  Create users/{uid}
      │    ↓
      │  /dashboard
      │
      └── YES
           ↓
        /dashboard
```

Existing public pages and workshop registration must continue working.

---

# 4. USER FIRESTORE SCHEMA

Create:

```text
users/{uid}
```

Document:

```ts
{
  uid: string,
  name: string,
  email: string,
  enrollmentNumber: string,
  department: string,
  branch: string,
  profileCompleted: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Rules:

- Document ID MUST be Firebase Auth UID.
- `uid` MUST equal the verified Firebase Auth UID.
- Never accept an arbitrary UID from browser input.
- Never allow one user to write another user's document.
- `email` comes from Firebase Authentication.
- Email is not user-editable.
- `profileCompleted` becomes `true` after successful onboarding.
- `createdAt` is set only when first created.
- `updatedAt` is updated on profile updates.
- Prefer Firestore server timestamps.

---

# 5. PROFILE FIELD RULES

### Name
- Required
- Trim whitespace
- Store normalized value

### Email
- Required
- Read-only
- Take from Firebase Auth
- Never accept editable email from form input

### Enrollment Number
- Required
- Trim whitespace
- Normalize to uppercase

Example:

```text
au2440275 -> AU2440275
```

### Department
- Required
- Reuse existing project conventions/options if available.

### Branch
- Required
- Reuse existing project conventions/options if available.

Do not over-engineer validation.

---

# 6. AUTHENTICATION

Reuse the existing architecture.

Important files:

```text
src/lib/firebase/client.ts
src/lib/firebase/admin.ts
src/lib/auth/AuthProvider.tsx
src/lib/auth/policy.ts
src/lib/auth/verify.ts
```

Do NOT replace the authentication system unless technically necessary.

Existing allowed domain:

```text
ahduni.edu.in
```

Continue enforcing it.

Google Authentication is already working.

Do not create a second authentication system.

---

# 7. SERVER-SIDE SECURITY

The browser must NOT be trusted for UID authorization.

For protected Server Actions/API routes:

1. Receive Firebase ID token/session using the existing architecture.
2. Verify it using existing `verify.ts` / Admin SDK architecture.
3. Extract UID from the VERIFIED token.
4. Use that UID for:

```text
users/{verifiedUid}
```

Never authorize using:

```text
users/{uidFromForm}
```

Reuse existing server authentication/verification patterns.

---

# 8. FIRESTORE SECURITY RULES

Add rules for:

```text
users/{uid}
```

Requirements:

- Authenticated user can read only their own profile.
- Authenticated user can create only their own profile.
- Authenticated user can update only their own profile.
- User cannot read another user's profile.
- User cannot write another user's profile.
- Unauthenticated users cannot access `users`.

Core ownership condition:

```text
request.auth.uid == uid
```

IMPORTANT: preserve existing rules for workshop/event registrations and other existing collections. Do not accidentally remove them.

Do not deploy destructive rules.

---

# 9. ONBOARDING PAGE

Create:

```text
/onboarding
```

Collect:

- Name
- Email (read-only)
- Enrollment Number
- Department
- Branch

Requirements:

- Authenticated users only.
- Unauthenticated users follow existing login flow.
- Email populated from Firebase Auth.
- Email not editable.
- Required-field validation.
- Useful validation errors.
- Prevent duplicate submission.
- Loading state.
- Successful creation → `/dashboard`.
- If profile already exists → `/dashboard`.
- Do not create duplicate profiles.

Reuse existing UI/form components.

Do not introduce an unnecessary form library.

---

# 10. DASHBOARD PAGE

Create:

```text
/dashboard
```

Display:

- User name
- Email
- Enrollment number
- Department
- Branch
- Profile completion status

Optional profile editing is allowed only if it naturally fits the existing architecture.

Do NOT add real project data.

A simple future placeholder is acceptable:

```text
Projects will appear here in a future phase.
```

Do not create fake project data.

---

# 11. OPTIONAL PROFILE ROUTE

A separate `/profile` route may be created only if genuinely useful.

Do not create unnecessary pages.

If profile editing can live cleanly in dashboard, keep Phase 1 minimal.

---

# 12. AUTH REDIRECT LOGIC

### Unauthenticated

Public pages remain accessible.

Protected pages:

```text
/dashboard
/onboarding
```

require authentication.

### Authenticated without profile

If:

```text
users/{uid}
```

does not exist:

```text
/onboarding
```

### Authenticated with profile

If:

```text
users/{uid}
```

exists:

```text
/dashboard
```

### Additional cases

Authenticated user visiting `/onboarding` after completing profile:

```text
/dashboard
```

Authenticated user visiting `/dashboard` without profile:

```text
/onboarding
```

Avoid redirect loops.

Handle Firebase Auth loading state before redirect decisions.

---

# 13. FIRESTORE READ STRATEGY

Use the existing project architecture.

Prefer server-side verified access for protected profile operations where supported.

If client-side Firestore access is needed:

- Firestore rules must protect the data.
- Never trust browser UID input.
- Do not introduce unnecessary real-time listeners.

`onSnapshot` will be used later for project/equipment live updates.

---

# 14. SERVER ACTION / API ARCHITECTURE

Inspect existing Server Actions/API routes before implementation.

Reuse existing patterns.

Do not create duplicate Firebase initialization.

Do not expose Firebase Admin SDK to client components.

Never import:

```ts
firebase-admin
```

into client components.

---

# 15. ENVIRONMENT SECURITY

Never expose:

- `GOOGLE_APPLICATION_CREDENTIALS`
- Firebase Admin credentials
- Service-account private key

through:

```text
NEXT_PUBLIC_*
```

Do not modify `.env.local` automatically.

Do not print environment values.

Do not print service-account JSON.

Do not create service-account JSON inside the repository.

---

# 16. DUPLICATE PROFILE PROTECTION

Safely handle:

- Double-click submit
- Page refresh during submission
- Multiple tabs
- Existing `users/{uid}`

The UID document ID provides the uniqueness boundary.

Use a safe create-or-check strategy.

---

# 17. EXISTING WORKSHOP REGISTRATION

Extremely important.

Existing:

```text
registrations
```

is the workshop/event registration system.

New user profile system uses:

```text
users/{uid}
```

Do NOT:

- Rename `registrations`
- Migrate `registrations`
- Replace `registrations`
- Mix workshop registrations with user profiles

Existing workshop registration behavior must remain unchanged.

---

# 18. STATIC CONTENT

Existing static content must remain intact.

Do not replace files such as:

```text
src/content/projects.ts
src/content/facilities.ts
```

with Firestore data in Phase 1.

Future user projects will be separate.

---

# 19. TYPESCRIPT

Create a clean reusable type, for example:

```ts
UserProfile
```

Use it consistently.

Avoid `any` unless genuinely unavoidable.

Do not introduce unnecessary dependencies.

---

# 20. IMPLEMENTATION PROCESS

Before editing:

1. Inspect existing auth flow.
2. Inspect routing structure.
3. Inspect existing form components.
4. Inspect Firestore/server action patterns.
5. Inspect Firestore rules.
6. Identify minimum required files.

Then implement Phase 1.

Do not:
- Rewrite unrelated files
- Refactor unrelated code
- Modify files only for stylistic reasons
- Redesign existing pages

---

# 21. ACCEPTANCE TESTS

## Test 1 — New Google user

```text
Google Login
→ Firebase Auth
→ users/{uid} does not exist
→ /onboarding
```

## Test 2 — Complete onboarding

Expected:

```text
users/{uid} created
uid == Firebase Auth UID
email == Firebase Auth email
profileCompleted == true
→ /dashboard
```

## Test 3 — Existing user

Login again:

```text
users/{uid} exists
→ /dashboard
```

Onboarding skipped.

## Test 4 — Other UID access

Expected:

```text
ACCESS DENIED
```

## Test 5 — Unauthenticated dashboard

```text
/dashboard
→ existing authentication/login flow
```

## Test 6 — Authenticated user without profile

```text
/dashboard
→ /onboarding
```

## Test 7 — Authenticated user with profile

```text
/onboarding
→ /dashboard
```

## Test 8 — Existing workshop registration

Must continue working.

## Test 9 — Existing public website

Must continue working.

## Test 10 — Admin security

Admin credentials must never reach client/browser bundle.

---

# 22. VALIDATION

After implementation run:

```bash
npx tsc --noEmit
```

Also run existing lint/test/build validation if available.

If build fails because of external network/font fetching, distinguish that from application errors.

Do not hide errors.

---

# 23. FIRESTORE RULE VALIDATION

If Firebase emulator/rules tests already exist, use them.

Otherwise:

- Validate rules syntactically if possible.
- Do not automatically deploy rules.
- Report remaining manual Firebase Console/CLI steps.

Do not run destructive Firebase commands.

---

# 24. UI CHANGE REPORT

At the end explicitly report:

### UI files changed
List every UI file.

### Why changed
Explain why each was required.

### UI intentionally unchanged
Confirm:

- Homepage
- Header
- Navigation
- Workshops
- Workshop registration
- Portfolio
- Facilities
- Footer
- Global theme

were not redesigned.

---

# 25. FINAL REPORT

After implementation provide:

### A. Files created
### B. Files modified
### C. Files intentionally not modified
### D. Authentication flow
### E. Firestore schema
### F. Firestore rules
### G. Server-side security
### H. UI changes
### I. UI intentionally avoided
### J. Tests/validation
### K. Manual Firebase steps remaining
### L. Errors/warnings

Never print:

- API keys
- Private keys
- Service-account JSON
- `.env.local` values
- Credential contents

---

# FINAL INSTRUCTION

IMPLEMENT PHASE 1 NOW.

Do not stop at planning.

Make the minimum necessary changes.

Preserve the existing website.

Do not implement Phase 2 functionality.

Do not redesign the UI.

Do not expose secrets.

# Tinkerers' Lab — Phase 3 Codex Implementation Specification

## Phase 3: QR-Based Live Equipment Usage Tracking

### CRITICAL RULE

**DO NOT unnecessarily change, refactor, redesign, or break Phase 1 or Phase 2.**

Phase 1 and Phase 2 are currently working correctly. Treat them as protected functionality and implement Phase 3 incrementally on top of the existing architecture.

Preserve existing authentication, onboarding, dashboard, projects, project members, ownership/security, workshop registration, Firebase initialization, UI/design, and routes unless a change is strictly required for Phase 3.

---

## 1. Phase 3 Goal

Build a **QR-Based Live Equipment Usage Tracking System**.

Real-world example:

A QR code is physically placed on:

**3D Printer #01**

When a student scans that QR code from a phone:

1. Identify the equipment.
2. Identify the authenticated student.
3. Show the student's accessible projects.
4. Student selects/confirms the project being worked on.
5. Student starts an equipment usage session.
6. Firestore stores the active session.
7. The student's existing project page receives the backend update in real time.
8. The project page shows the equipment as currently in use.
9. Student can end the session.
10. Firestore stores the end time and usage history.

The backend/Firestore must be the source of truth. Do not use localStorage or browser-only state as the source of truth.

---

## 2. Example User Flow

Existing project:

```text
KneeSense
```

Equipment:

```text
3D Printer #01
```

Physical QR:

```text
[ QR CODE ]
```

Student scans it.

Application opens an equipment-specific route, for example:

```text
/equipment/printer-3d-01
```

Student sees:

```text
3D Printer #01

Select Project

KneeSense
...

[ Start Usage ]
```

After starting:

```text
3D Printer #01
IN USE

Project: KneeSense
Used by: Student Name
Started: 4:25 PM

● LIVE
```

The existing `KneeSense` project detail page must update automatically without manual refresh.

---

## 3. QR Design

Each equipment must have a stable unique ID.

Example:

```text
equipmentId = printer-3d-01
```

QR should identify the equipment, not a student.

Prefer a route such as:

```text
/equipment/printer-3d-01
```

or an equivalent route compatible with the current application.

Do not put private student information inside the QR.

The QR should be printable and suitable for physical attachment to lab equipment.

---

## 4. Equipment Firestore Model

Add:

```text
equipment/{equipmentId}
```

Suggested document:

```ts
{
  equipmentId: string,
  name: string,
  type: string,
  description?: string,
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "DISABLED",
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Keep this model focused. Do not build a full admin/equipment-management system in Phase 3.

---

## 5. Usage Session Firestore Model

Add:

```text
equipmentUsage/{usageId}
```

Suggested document:

```ts
{
  usageId: string,
  equipmentId: string,
  equipmentName: string,
  userUid: string,
  userName: string,
  projectId: string,
  projectTitle: string,
  status: "ACTIVE" | "COMPLETED",
  startedAt: Timestamp,
  endedAt?: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Important:

- `userUid` must come from authenticated/verified identity.
- Never trust a browser-provided UID.
- `projectId` must be validated against the authenticated user's project membership/ownership.
- `equipmentId` must refer to a valid equipment document.
- Use Firestore server timestamps.
- Status changes must be controlled by trusted logic.

---

## 6. Start Usage Lifecycle

Required flow:

```text
QR Scan
   ↓
Equipment Page
   ↓
Authenticate User
   ↓
Load User's Projects
   ↓
Select Project
   ↓
Validate Project Access
   ↓
Check Equipment Availability
   ↓
Create ACTIVE Usage Session
   ↓
Set Equipment = IN_USE
```

---

## 7. End Usage Lifecycle

Required flow:

```text
End Usage
   ↓
Validate Active Session
   ↓
Set Usage = COMPLETED
   ↓
Set endedAt = server timestamp
   ↓
Set Equipment = AVAILABLE
```

Use appropriate Firestore transaction/batched-write logic so the related state remains consistent.

---

## 8. Equipment Conflict Prevention

This is critical.

If:

```text
3D Printer #01
```

is already in use, another student must not be able to start another active session.

Example:

```text
3D Printer #01

Currently in use.

Project:
KneeSense

Please wait until the current session ends.
```

Do not rely only on frontend checks.

Prevent race conditions where two students attempt to start the same equipment at nearly the same time.

Use an appropriate Firestore transaction or trusted server-side atomic operation.

---

## 9. Project Association

The QR identifies the equipment.

It does NOT automatically determine the student's project.

After scanning:

```text
3D Printer #01
```

show projects accessible to the authenticated user.

Only allow projects where the authenticated user is an owner/member.

Do not allow arbitrary browser-submitted project IDs to create unauthorized usage records.

---

## 10. Live Project Page

The existing Phase 2 project detail page is working and must not be redesigned.

Add only the minimum required section:

```text
Live Equipment Usage
```

Example:

```text
Live Equipment Usage

🟢 3D Printer #01
IN USE

Used by: Student Name
Started: 4:25 PM

● LIVE
```

Use Firestore realtime listeners where appropriate, such as:

```ts
onSnapshot(...)
```

The project page should automatically reflect:

- new ACTIVE usage
- usage completion
- relevant equipment changes

without requiring manual refresh.

---

## 11. Usage History

The project page may show completed usage records for that project.

Example:

```text
Equipment Usage History

3D Printer #01
Started: 4:25 PM
Ended: 5:40 PM
Status: COMPLETED
```

Keep this simple in Phase 3. Do not build advanced analytics yet.

---

## 12. Authentication

The student must be authenticated before starting a usage session.

If logged out:

```text
Please sign in to use this equipment.
```

Use the existing Phase 1 Google Authentication flow.

Do not create a second authentication system.

---

## 13. Security

Sensitive operations must validate authenticated identity.

Never trust these directly from the browser:

```text
userUid
userName
ownerUid
```

Use the existing server-side Firebase authentication/verification architecture.

Project access must be:

```text
Authenticated UID
      ↓
Verify project ownership/member relationship
      ↓
Allow usage session
```

Students must not be able to:

- create a session for another student
- use another user's project
- end another student's active session
- modify another user's usage history
- bypass equipment availability
- arbitrarily change equipment state

---

## 14. Firestore Rules

Before changing rules:

1. Read the existing `firestore.rules`.
2. Understand the Phase 1 and Phase 2 rules.
3. Make the smallest possible additive change.
4. Preserve existing security conditions.

Add only the permissions required for:

```text
equipment
equipmentUsage
```

Do not rewrite working Phase 1/Phase 2 rules unnecessarily.

If sensitive writes are performed through trusted server-side operations, keep direct client permissions appropriately restrictive.

---

## 15. Firestore Indexes

Inspect:

```text
firestore.indexes.json
```

before modifying it.

Do not remove existing Phase 2 indexes.

Add only indexes actually required by Phase 3 queries.

---

## 16. Required Route

Add only the required new route:

```text
/equipment/[equipmentId]
```

This is the page opened after QR scanning.

Do not change these existing routes unnecessarily:

```text
/dashboard
/projects/new
/projects/[projectId]
/projects/[projectId]/edit
```

---

## 17. QR Generation

Provide a simple way to generate/print a QR for an equipment item.

The QR should encode the equipment route, for example:

```text
https://<existing-domain>/equipment/printer-3d-01
```

Use the existing application's base URL/environment configuration if available.

Do not hardcode a production domain if the project already has a suitable configuration.

Avoid unnecessary dependencies. If a QR library is required, use a small maintained library compatible with the existing stack.

Do not build a large QR-management UI.

---

## 18. Mobile Experience

The equipment page is primarily opened on a phone after QR scanning.

Make only necessary responsive adjustments to the new Phase 3 equipment page.

Do not redesign the entire website.

The main flow should be:

```text
Equipment
   ↓
Authenticated Student
   ↓
Select Project
   ↓
Start Usage
```

---

## 19. User-Facing Error States

Handle at least:

### Equipment not found

```text
Equipment not found.
```

### Equipment disabled/unavailable

```text
This equipment is currently unavailable.
```

### Equipment already in use

```text
This equipment is currently in use.
```

### User not authenticated

```text
Please sign in to start using this equipment.
```

### No projects

```text
You need to be part of a project before using this equipment.
```

### Unauthorized project

```text
You do not have permission to use this project.
```

### Session already ended

```text
This usage session has already ended.
```

Do not expose raw Firebase errors to normal users.

---

## 20. Timestamp Requirements

Use Firestore server timestamps for authoritative start/end times.

Do not rely on the phone's local clock as the backend source of truth.

Format timestamps for the user's local display.

---

## 21. Atomicity / Concurrency

Starting usage must be atomic.

Do not implement unsafe logic like:

```text
read status
if AVAILABLE
    create session
```

without atomic protection.

Two simultaneous requests must not both create active sessions for the same equipment.

Use Firestore transaction or equivalent trusted server-side atomic logic.

---

## 22. Data Consistency

When starting:

```text
equipment.status = IN_USE
usage.status = ACTIVE
```

When ending:

```text
usage.status = COMPLETED
usage.endedAt = server timestamp
equipment.status = AVAILABLE
```

Avoid inconsistent partial updates.

Use transaction/batched-write strategies as appropriate.

---

## 23. Existing Project Page Protection

Do NOT replace the Phase 2 project detail page.

Do NOT redesign it.

Do NOT change:

- project information layout
- project ownership logic
- member logic
- edit permissions
- categories
- project statuses

Only add:

```text
Live Equipment Usage
```

and, if appropriate:

```text
Equipment Usage History
```

Use the existing visual language/components.

---

## 24. Explicitly NOT in Phase 3

Do NOT implement yet:

- full admin dashboard
- inventory management
- maintenance management
- advanced analytics
- notifications
- email/SMS
- media/file uploads
- AI features
- booking calendar
- payments
- new authentication
- complex role system
- major UI redesign
- project architecture refactor
- workshop registration changes

These belong to later phases.

---

## 25. Backward Compatibility

After Phase 3, these must still work:

### Phase 1

```text
Google login
Onboarding
Profile
Dashboard
```

### Phase 2

```text
Create project
Project list
Project detail
Edit project
Project members
Owner/member permissions
```

Do not break any of them.

---

## 26. Implementation Process

Before coding:

1. Inspect the current repository.
2. Read the Phase 1 and Phase 2 implementation.
3. Read existing:
   - auth files
   - Firebase client
   - Firebase admin
   - Firestore rules
   - Firestore indexes
   - project types/models
   - project server actions/API
   - project detail page
4. Identify and reuse existing patterns.
5. Implement Phase 3 incrementally.
6. Do not duplicate Firebase initialization or authentication.

---

## 27. TypeScript

Create reusable types for:

```text
Equipment
EquipmentStatus
EquipmentUsage
EquipmentUsageStatus
```

Avoid `any`.

Keep new types compatible with existing project types.

---

## 28. Validation

Run after implementation:

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

```bash
npm run build
```

Do not suppress errors with unnecessary `any`, `@ts-ignore`, or similar workarounds.

---

## 29. Manual Test Plan

### Test 1 — Phase 1 regression

1. Google login
2. Dashboard
3. Profile/onboarding

Expected: unchanged.

### Test 2 — Phase 2 regression

1. Open existing `KneeSense`.
2. Project detail loads.
3. Members load.
4. Owner can edit.

Expected: unchanged.

### Test 3 — Equipment QR

Create/test:

```text
3D Printer #01
equipmentId = printer-3d-01
```

Generate QR.

Scan QR using a phone.

Expected:

```text
/equipment/printer-3d-01
```

opens.

### Test 4 — Start Usage

1. Login as student.
2. Open equipment QR page.
3. Select `KneeSense`.
4. Click `Start Usage`.

Expected:

```text
3D Printer #01
IN USE
KneeSense
● LIVE
```

### Test 5 — Realtime project update

Open `KneeSense` project page in another browser/tab.

Start usage from the equipment page.

Expected:

Project page updates automatically without manual refresh.

### Test 6 — End Usage

Click:

```text
End Usage
```

Expected:

```text
usage.status = COMPLETED
endedAt = server timestamp
equipment.status = AVAILABLE
```

Project page updates automatically.

### Test 7 — Conflict

Student A starts using:

```text
3D Printer #01
```

Student B scans the same QR.

Expected:

Student B cannot start another active session.

### Test 8 — Security

Attempt to use another user's project.

Expected: denied.

Attempt to end another user's session.

Expected: denied.

---

## 30. Firebase Deployment

Do NOT automatically deploy Firebase rules/indexes without first reporting the changes/results.

After implementation, report whether:

```text
firestore.rules
firestore.indexes.json
```

were changed.

If deployment is needed, state the exact commands separately.

Do not run destructive Firebase commands.

Do not modify/delete production data.

---

## 31. Secrets

Never ask the user to paste:

- Firebase service-account JSON
- private keys
- API secrets
- passwords
- tokens

Do not print secrets in logs.

Do not commit service-account files.

Use the existing local Firebase Admin configuration.

---

## 32. Final Codex Report

Return:

```text
PHASE_3_IMPLEMENTATION=PASS/FAIL

PHASE_1_REGRESSION=PASS/FAIL
PHASE_2_REGRESSION=PASS/FAIL

TYPESCRIPT=PASS/FAIL
LINT=PASS/FAIL
BUILD=PASS/FAIL

FIRESTORE_RULES_CHANGED=YES/NO
FIRESTORE_INDEXES_CHANGED=YES/NO

NEW_ROUTES:
...

NEW_FILES:
...

MODIFIED_FILES:
...

SECURITY_NOTES:
...

MANUAL_TESTS:
...

UNRESOLVED_ISSUES:
...
```

---

# 33. MOST IMPORTANT INSTRUCTION

**Phase 1 and Phase 2 are working. Treat them as protected functionality.**

Do not:

- refactor them unnecessarily
- rename existing routes unnecessarily
- replace existing auth
- replace Firebase initialization
- rewrite project logic
- redesign the existing dashboard
- redesign the existing project detail page
- remove existing Firestore rules
- remove existing indexes
- change workshop registration

Only make the smallest changes required to implement:

**QR → Equipment → Authenticated Student → Project → Live Usage Session → Firestore → Realtime Project Page**

This is the core objective of Phase 3.

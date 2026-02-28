# Daily AI Challenge App

A gamified habit-building web app built with Next.js App Router, Prisma, and PostgreSQL.

Users get one personalized AI challenge per day, complete it to build streaks, earn XP, and optionally restore a missed streak within a limited window.

## 1. How The App Runs

### Tech stack
- Next.js 15 (App Router, API routes)
- React 19 + TypeScript
- Prisma ORM
- PostgreSQL
- Cookie-based session auth

### Runtime flow
1. User signs up or logs in.
2. Session token is stored in an HTTP-only cookie.
3. First-time users complete onboarding preferences.
4. Dashboard requests today’s challenge from API.
5. Backend checks/creates one challenge per day (`userId + date`).
6. Completion updates streak + XP.
7. Missed day logic and restore-window logic are applied automatically in backend.

## 2. Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Environment
Create `.env` in project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/daily_ai_challenge?schema=public"
```

(`.env.example` contains a sample URL format.)

### Install + DB migrate + run
```powershell
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

Open `http://localhost:3000`.

## 3. Main Product Behavior

### Daily challenge (1 per day)
- API: `GET /api/challenges/today`
- Logic: `lib/store.ts -> getOrCreateTodayChallenge`
- Enforced by DB unique key: `(userId, dateKey)` in Prisma schema

### Personalization
- Categories + difficulty + outdoor preference from onboarding/profile
- Challenge generation: `lib/challenges.ts -> buildDailyChallenge`
- Deterministic seed by `userId + date` so challenge is stable for a given day

### Streak
- Increments on daily completion
- Resets when day gap is detected
- Best streak tracked separately

### XP
- Easy: 10, Medium: 20, Hard: 30
- Awarded on completion

### Restore streak
- If exactly one day missed, user gets restore window
- Restore costs 50 XP
- Window expires automatically after deadline

## 4. File Map: What Was Written And Why

## Core backend
- `prisma/schema.prisma`
  - Defines persistent data model: users, sessions, streak, categories, challenge history.
  - Why: replaced in-memory state with production-style relational persistence.

- `lib/db.ts`
  - Prisma client singleton.
  - Why: avoids multiple client instances in dev hot reload.

- `lib/store.ts`
  - Main business logic:
    - create/auth user
    - session creation/lookup/destroy
    - set preferences
    - create/get today challenge
    - complete challenge
    - missed-day + restore logic
    - history fetch
  - Why: keeps business rules centralized and API routes thin.

- `lib/challenges.ts`
  - Challenge template bank + deterministic challenge generation + XP mapping.
  - Why: simple and scalable personalization layer.

- `lib/date.ts`
  - Date key and date arithmetic helpers.
  - Why: consistent day-based streak/challenge logic.

- `lib/auth.ts`
  - Session cookie helpers + current user lookup.
  - Why: reusable auth handling for routes/pages.

## API routes
- `app/api/auth/signup/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
  - Why: auth lifecycle endpoints.

- `app/api/user/me/route.ts`
  - Why: profile fetch for client pages.

- `app/api/user/preferences/route.ts`
  - Why: onboarding/profile preference save/update endpoint.

- `app/api/challenges/today/route.ts`
  - Why: fetch today’s assigned challenge and metrics.

- `app/api/challenges/complete/route.ts`
  - Why: complete challenge and apply XP/streak updates.

- `app/api/streak/restore/route.ts`
  - Why: consume XP and restore streak if valid.

- `app/api/history/route.ts`
  - Why: history timeline endpoint.

## Frontend (App Router pages/components)
- `app/page.tsx`
  - Redirect root to correct flow (`/login`, `/onboarding`, `/dashboard`).

- `app/login/page.tsx`, `app/signup/page.tsx`
  - Auth pages.

- `app/onboarding/page.tsx`
  - First-time setup page.

- `app/dashboard/page.tsx`
  - Protected dashboard.

- `app/history/page.tsx`
  - Protected history page.

- `app/profile/page.tsx`
  - Protected profile page with editable preferences.

- `components/auth-form.tsx`
  - Shared login/signup form.

- `components/onboarding-form.tsx`
  - Preference setup form.

- `components/dashboard-client.tsx`
  - Dashboard UI, completion action, optional proof, restore action, celebration state.

- `components/history-client.tsx`
  - History list UI.

- `components/profile-client.tsx`
  - Profile summary + update preferences after login.

- `components/app-shell.tsx`
  - Shared navigation/layout and logout.

- `components/theme-provider.tsx`, `components/theme-toggle.tsx`
  - Light/dark mode support.

- `app/layout.tsx`, `app/globals.css`
  - Global app skeleton and design system styles.

- `types/app.ts`
  - Shared TypeScript domain types.

## 5. Notes
- `.next/` files are build artifacts; do not edit them directly.
- Current architecture is ready for future extensions:
  - badges
  - levels
  - leaderboard
  - notifications

## 6. Useful Commands

```powershell
# Dev server
npm run dev

# Build check
npm run build

# Prisma
npm run prisma:generate
npm run prisma:migrate -- --name <migration_name>
npm run prisma:studio
```

# Fork of Greta ui mockups

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/palontologists-projects/v0-fork-of-greta-ui-mockups)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/Wm5s4dcRXyu)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/palontologists-projects/v0-fork-of-greta-ui-mockups](https://vercel.com/palontologists-projects/v0-fork-of-greta-ui-mockups)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/Wm5s4dcRXyu](https://v0.app/chat/projects/Wm5s4dcRXyu)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Data Model & Onboarding Flow

The app now persists user onboarding data and related entities in a Turso (libsql) database via Drizzle ORM.

### Tables
- `user_profiles`: Stores name, mission, world vision, focus areas, onboarded flag.
- `goals`: User goals (seeded from mission + focus areas). Unique per user (case-insensitive title) via `goals_user_title_idx`.
- `tasks`: Individual tasks with alignment metadata and completion timestamps.
- `goal_activities`: Incremental progress events for goals (lightweight activity log).
- `events`: Calendar / timeline events including the onboarding event.
- `work_sessions`: Time tracking sessions produced by the task timer.

### Onboarding (`completeOnboarding` action)
When the user finishes the onboarding flow (`/onboarding`):
1. Upserts their `user_profiles` row.
2. Creates a goal for the mission (if provided) and for each focus area (idempotent checks).
3. Seeds a starter task for each new focus-area goal.
4. Logs an `events` row of type `onboarding`.
5. All performed inside a DB transaction for atomicity.

### Idempotency
- Unique index: `CREATE UNIQUE INDEX IF NOT EXISTS goals_user_title_idx ON goals(user_id, lower(title));`
- Action checks existing rows to avoid duplicates if onboarding is resubmitted.

### Migrations
Manual SQL migrations are stored in `migrations/`.
Run them with Drizzle Kit or apply manually:

```bash
pnpm db:push   # pushes schema (if using drizzle-kit push)
pnpm db:migrate  # applies chronological migrations if configured
```

### Environment
Set the following in `.env.local` (or hosting provider secrets):
```
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
```

### Developing
```bash
pnpm install
pnpm dev
```

### Future Enhancements
- Normalize focus areas into a separate table.
- Add notes tables for tasks and goals.
- Add materialized analytics / rollups.
- Background AI enrichment of tasks and goals.
## Greta – Mission-Aligned Productivity and ROI Tracking

Greta is a mission-first productivity app that fuses personal growth, startup execution, and ROI visualization. It helps you define your mission, translate it into goals and activities, prioritize aligned work, and see the tangible value of your effort across time, money, and values.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

### Why Greta
- Clarity: Keep your personal mission front and center and ensure daily work supports it.
- Execution: Prioritize high-alignment tasks and track progress at the activity level.
- ROI: See your impact in aligned hours, completion velocity, and value metrics.
- Community: Invite co-founders and collaborate inside a shared workspace.

## Audience
- Founders and small teams who want disciplined execution tied to a clear mission.
- Builders who value minimal, iOS-inspired UX with storytelling and purpose.

## Core Concepts
- Personal vs Startup Goals: Separate life goals from company goals for focus and clarity.
- Goals vs Activities: Goals define outcomes; Activities are the incremental steps that move goals forward.
- Alignment Score: AI-assisted summary of how well your work aligns with your mission.
- ROI Snapshot: Quick read on aligned hours, goals completed, and task velocity.
- Workspaces: Collaborate with co-founders via Clerk Organizations and email invites.

## Features
- Dashboard
  - North Star mission block.
  - Greta Alignment Score with AI analysis, cached to persist across reloads.
  - Smart tasks with alignment categories and quick completion.
  - Upcoming events.
- Impact
  - Enhanced metrics with clear calculations and editing.
  - ROI Snapshot (aligned hours, completed goals, weekly completion rate).
  - Add Founder: invite collaborators by email to a shared workspace.
- Goals
  - Create Personal or Startup goals with targets, units, and deadlines.
  - Manage progress with Activities and quick +1/+5 increments.
  - Mark complete when targets are reached.
- History
  - One place to review Activities, completed Goals, and completed Tasks.
- Profile
  - Mission, World Vision, Focus Areas, and summarized stats with clean UI.
- Timers & Work Sessions
  - Task timers create work sessions to quantify aligned time.

## Architecture
- Next.js (App Router) + React + TypeScript
- Database: Turso (libsql) via Drizzle ORM
- Auth & Orgs: Clerk (users, organizations, invitations)
- UI: shadcn/ui + Tailwind (iOS-inspired minimal aesthetic)
- AI: `lib/ai.ts` (alignment summaries and metric suggestions)
- Caching: `dashboard_insights` table for persistent AI insight on dashboard

## Data Model (Tables)
- `user_profiles`: name, mission, worldVision, focusAreas, onboarded, timestamps
- `goals`: title, description, category, goal_type (personal|startup), unit, target/current, deadline, archived
- `tasks`: title, description, alignmentScore, alignmentCategory, completed timestamps, optional goal link
- `goal_activities`: per-goal granular progress events (completed -> progress applied)
- `work_sessions`: durations created by task timers
- `events`: simple calendar/timeline events
- `dashboard_insights`: cached AI summary per user (persisted between reloads)

## Environment
Add to `.env.local` (or hosting secrets):
```
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
# Optional default org to invite into (else new org is created per invite or by form)
CLERK_DEFAULT_ORG_ID=org_...
```

## Setup
```bash
pnpm install
pnpm db:migrate     # applies migrations in /migrations
pnpm dev            # start local dev
```

## Deployment
- Deploy on Vercel.
- Set all environment variables in Vercel Project Settings.
- Run migrations in a one-off step (e.g., `pnpm db:migrate`) or use `db:push` in CI.

## Key User Flows
- Onboarding: capture mission, world vision, focus areas; seed goals and starter tasks.
- Goals: create with Personal/Startup type, set targets, track progress via Activities and quick increments.
- Tasks: add smart tasks, complete to update metrics and AI insights.
- Founders & Workspaces: add founder on Impact page to send email invite via Clerk Organizations.
- History: review Activities, completed Goals, and Tasks.

## AI Insights & Caching
- The dashboard alignment summary is generated via `generateDashboardSummary()` and persisted in `dashboard_insights`.
- On load: UI fetches cached insight first; if missing, it computes and stores.
- On updates: completing a task or changing goal progress regenerates the cache.

## Permissions & Workspaces
- Clerk Organizations are used to represent a shared startup workspace.
- From Impact → Add Founder: invite by email to an existing org (`CLERK_DEFAULT_ORG_ID` or a provided org ID) or create a new org from the provided Workspace Name.
- You can add gating based on organization membership in `middleware.ts`.

## Commands
```bash
pnpm db:migrate   # apply SQL migrations in order
pnpm db:push      # push schema with drizzle-kit (optional workflow)
pnpm db:studio    # explore DB schema and data
pnpm dev          # run locally
pnpm build && pnpm start  # production build
```

## Roadmap
- Auto-prioritization: rank tasks, activities, and goals by alignment, urgency, and impact
- UX cleanup: simplify pages, remove repetition, make core flows faster and clearer
- Remove Smart Tasks placeholder insight: hide or replace “AI analysis placeholder” with real insights only
- Custom ROI metrics: time spent, money earned, and values alignment with editable targets
- Goal horizons: support short-term vs long-term goals with distinct views and cadences
- Robust analytics: trend lines, slippage, velocity/throughput, cohorts, and goal health scoring
- Chat with Greta: conversational planning, prioritization, and actionable suggestions
- Social/community: find friends, follow founders, share impact snapshots, lightweight community building
- Goal templates and suggested metrics per mission category
- Notifications and nudges (e.g., stale goals, low alignment days)
- Rich notes for tasks and goals (separate tables)
- Calendar integrations (Google/Outlook) and bi-directional sync
- Mobile PWA experience and offline-friendly work session logging
- Deeper ROI: value-of-time, financial metrics, value tags and rollups
- Team roles and granular permissions within organizations
- Localization and accessibility polish
- Performance and background AI enrichment

## Contributing
- Open a PR with a clear description and screenshots for UI changes.
- Include migrations for DB changes and update this README if the product behavior changes.

## License
This repository contains product UI and application code. Licensing terms can be added here.
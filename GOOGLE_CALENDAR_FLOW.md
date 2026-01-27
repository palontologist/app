# Google Calendar Integration - Flow Diagram

## User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Dashboard Page         │
                    │  (Enhanced Dashboard)    │
                    │                          │
                    │  ┌────────────────────┐  │
                    │  │ Upcoming Events    │  │
                    │  │ ┌────────────────┐ │  │
                    │  │ │ [Sync Google  │ │  │
                    │  │ │   Calendar]    │ │  │ ◄── Click
                    │  │ └────────────────┘ │  │
                    │  └────────────────────┘  │
                    └─────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         OAUTH INITIATION                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    GET /api/google/calendar/connect
                                  │
                    ┌─────────────────────────┐
                    │  Check Clerk Auth       │
                    │  userId exists?         │
                    └─────────────────────────┘
                          │               │
                        YES              NO
                          │               │
                          ▼               ▼
              ┌──────────────────┐  ┌──────────┐
              │ Generate OAuth   │  │ Redirect │
              │ URL with scopes: │  │ to Sign  │
              │ - calendar.      │  │ In page  │
              │   readonly       │  └──────────┘
              │ - calendar.      │
              │   events         │
              └──────────────────┘
                          │
                          ▼
              ┌──────────────────────────┐
              │   Redirect to Google     │
              │   OAuth Consent Screen   │
              └──────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────────────┐
│                      GOOGLE AUTHORIZATION                            │
└─────────────────────────────────────────────────────────────────────┘
                          │
                ┌─────────────────────┐
                │  User reviews       │
                │  permissions and    │
                │  approves/denies    │
                └─────────────────────┘
                     │           │
                  APPROVE      DENY
                     │           │
                     │           ▼
                     │    ┌──────────────────┐
                     │    │ Redirect with    │
                     │    │ error=access_    │
                     │    │ denied           │
                     │    └──────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       OAUTH CALLBACK                                 │
└─────────────────────────────────────────────────────────────────────┘
                     │
      GET /api/google/calendar/callback?code=xyz
                     │
      ┌──────────────────────────────┐
      │ Verify Clerk Auth            │
      │ Extract code from params     │
      └──────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │ Exchange Code for Tokens     │
      │ (lib/google-calendar.ts)     │
      │                              │
      │ Returns:                     │
      │ - accessToken               │
      │ - refreshToken (unused)     │
      │ - expiryDate                │
      └──────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EVENT SYNCING                                 │
└─────────────────────────────────────────────────────────────────────┘
                     │
      ┌──────────────────────────────┐
      │ syncGoogleCalendarOnce()     │
      │ (app/actions/               │
      │  google-calendar.ts)         │
      └──────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │ Fetch Calendar Events        │
      │ - Next 30 days              │
      │ - Max 100 events            │
      │ - Primary calendar only     │
      └──────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │ Map Google Events to DB      │
      │ Format:                      │
      │ - title                      │
      │ - eventDate                  │
      │ - eventTime (if timed)       │
      │ - description                │
      │ - metadata (JSON)            │
      │ - syncSource = "google"      │
      └──────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │ Deduplication Check          │
      │                              │
      │ For each event:              │
      │ 1. Query existing events     │
      │    - Same userId             │
      │    - Same title              │
      │    - Same eventDate          │
      │                              │
      │ 2. Check time match:         │
      │    - Both timed: times must  │
      │      match                   │
      │    - One or both all-day:    │
      │      consider duplicate      │
      └──────────────────────────────┘
              │              │
           DUPLICATE     NOT DUPLICATE
              │              │
              ▼              ▼
      ┌─────────────┐  ┌─────────────┐
      │ Skip event  │  │ Insert into │
      │ (increment  │  │ events      │
      │  skipped    │  │ table       │
      │  counter)   │  │             │
      └─────────────┘  │ (increment  │
                       │  synced     │
                       │  counter)   │
                       └─────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │ Revalidate Paths   │
                  │ - /dashboard       │
                  │ - /                │
                  └────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      REDIRECT & FEEDBACK                             │
└─────────────────────────────────────────────────────────────────────┘
                             │
          Redirect to dashboard with URL params:
          ?success=calendar_synced&synced=5&skipped=2
                             │
                             ▼
                  ┌────────────────────┐
                  │ GoogleCalendarBtn  │
                  │ - Reads URL params │
                  │ - Shows message    │
                  │ - Cleans URL after │
                  │   5 seconds        │
                  └────────────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │ Events Display     │
                  │ Updated with new   │
                  │ Google Calendar    │
                  │ events             │
                  └────────────────────┘

```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      GOOGLE CALENDAR EVENT                           │
└─────────────────────────────────────────────────────────────────────┘
{
  id: "abc123",
  summary: "Team Meeting",
  start: {
    dateTime: "2024-02-01T14:00:00Z"
  },
  end: {
    dateTime: "2024-02-01T15:00:00Z"
  },
  description: "Weekly team sync",
  location: "Conference Room A",
  organizer: {
    email: "user@example.com"
  },
  attendees: [...]
}
                             │
                             │ mapGoogleEventToDbEvent()
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE EVENT RECORD                           │
└─────────────────────────────────────────────────────────────────────┘
{
  userId: "clerk_user_123",
  title: "Team Meeting",
  eventDate: Date("2024-02-01T14:00:00Z"),
  eventTime: "2:00 PM",
  eventType: null,
  description: "Weekly team sync",
  metadata: JSON.stringify({
    googleEventId: "abc123",
    googleCalendarId: "user@example.com",
    location: "Conference Room A",
    htmlLink: "https://...",
    attendees: [...]
  }),
  syncSource: "google"
}
                             │
                             │ db.insert(events)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EVENTS TABLE                                 │
└─────────────────────────────────────────────────────────────────────┘
  id  | userId | title         | eventDate  | eventTime | syncSource
 ─────┼────────┼───────────────┼────────────┼───────────┼────────────
  1   | user_1 | Team Meeting  | 2024-02-01 | 2:00 PM   | google
  2   | user_1 | Dentist Appt  | 2024-02-03 | NULL      | manual
  3   | user_1 | Project Demo  | 2024-02-05 | 3:30 PM   | google

```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPONENT HIERARCHY                             │
└─────────────────────────────────────────────────────────────────────┘

app/
├── layout.tsx (ClerkProvider)
├── dashboard/
│   └── page.tsx
│       └── EnhancedDashboard
│           └── Events Card
│               ├── GoogleCalendarButton ◄─── New Component
│               └── Event List
│
├── api/
│   └── google/
│       └── calendar/
│           ├── connect/
│           │   └── route.ts ◄─── GET handler
│           └── callback/
│               └── route.ts ◄─── GET handler
│
└── actions/
    ├── events.ts (existing)
    └── google-calendar.ts ◄─── New action

lib/
├── db.ts (existing)
└── google-calendar.ts ◄─── New library

components/
├── enhanced-dashboard.tsx (modified)
└── google-calendar-button.tsx ◄─── New component

db/
└── schema.ts
    └── events table (modified: added syncSource)

migrations/
└── 0006_add_sync_source_to_events.sql ◄─── New migration
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                                 │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: Clerk Authentication
├── All routes check auth() from @clerk/nextjs/server
├── userId must exist to proceed
└── Redirect to sign-in if not authenticated

Layer 2: OAuth Authorization
├── User must explicitly grant calendar permissions
├── Scopes: calendar.readonly, calendar.events
└── Google validates client credentials

Layer 3: Session-Based Tokens (No Persistence)
├── Access token used immediately for sync
├── Token discarded after use
├── No token storage in database
└── User must re-authorize for each sync

Layer 4: Data Isolation
├── Events filtered by userId
├── Each user can only sync to their own events
└── Database queries scoped to authenticated user

Layer 5: Input Validation
├── OAuth code validated
├── Event data sanitized
└── Error handling for malformed responses
```

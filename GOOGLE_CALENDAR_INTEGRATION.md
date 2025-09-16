# Google Calendar Integration

This integration allows users to sync their Google Calendar events and tasks with the application dashboard.

## Features

### ✅ Implemented
- **OAuth Authentication**: Connect Google Calendar via OAuth 2.0
- **Smart Event Classification**: Automatically categorizes calendar items as events or tasks
- **Bi-directional Data Mapping**: Maps Google Calendar events to local events and tasks
- **Sync Status Tracking**: Tracks last sync times and Google Calendar IDs
- **Deduplication**: Prevents importing the same event/task multiple times
- **UI Components**: Ready-to-use React components for calendar management
- **API Endpoints**: RESTful endpoints for triggering sync operations

### 🎯 Smart Import Logic
Events are automatically classified as tasks if they:
- Contain task keywords: "TODO", "Task", "Do:", "Action:", "Reminder:", "[ ]", "[x]"
- Have short duration (≤30 minutes)
- Otherwise imported as regular events

### 📅 Sync Scope
- **Time Range**: Last 30 days to next 365 days
- **Calendar Access**: Primary calendar and all selected calendars
- **Event Types**: All event types supported
- **Frequency**: Manual sync (can be extended to automatic)

## Usage

### 1. Connect Google Calendar
Users can connect their Google Calendar from the Profile page:
```typescript
// Navigate to /profile and click "Connect Google Calendar"
// Or direct link: /api/google/auth/start
```

### 2. Sync Calendar Data
```typescript
import { syncGoogleCalendar } from "@/app/actions/google-calendar-sync"

// Sync all calendars
const result = await syncGoogleCalendar()

// Sync specific calendar
const result = await syncGoogleCalendar("calendar-id")

console.log(result)
// {
//   success: true,
//   eventsImported: 5,
//   tasksImported: 3,
//   error?: string
// }
```

### 3. Use UI Components
```typescript
import { GoogleCalendarManager } from "@/components/google-calendar-manager"

// In your React component
<GoogleCalendarManager 
  isConnected={true}
  userEmail="user@example.com"
/>
```

### 4. API Endpoints
```bash
# Trigger calendar sync
POST /api/google/sync/events
Content-Type: application/json

{
  "calendarId": "primary" // optional, syncs all calendars if omitted
}
```

## Database Schema

### Added Fields to Events Table
```sql
ALTER TABLE events ADD COLUMN google_event_id TEXT;
ALTER TABLE events ADD COLUMN google_calendar_id TEXT;
ALTER TABLE events ADD COLUMN last_synced_at INTEGER; -- timestamp_ms
```

### Added Fields to Tasks Table
```sql
ALTER TABLE tasks ADD COLUMN google_event_id TEXT;
ALTER TABLE tasks ADD COLUMN google_calendar_id TEXT;
ALTER TABLE tasks ADD COLUMN last_synced_at INTEGER; -- timestamp_ms
```

## File Structure

```
app/
├── actions/
│   ├── google-calendar-sync.ts    # Server actions for sync
│   └── google-status.ts           # Check connection status
├── api/google/
│   ├── auth/                      # OAuth flow (existing)
│   ├── calendars/                 # Calendar list (existing)
│   └── sync/events/               # Sync endpoint (new)
└── calendar-demo/                 # Demo page

components/
├── google-calendar-manager.tsx    # Full calendar management UI
└── google-calendar-sync.tsx       # Simple sync button

lib/google/
├── oauth.ts                       # OAuth utilities (updated)
└── calendar-sync.ts              # Core sync logic (new)

db/
└── schema.ts                      # Updated with sync fields

migrations/
└── 0003_whole_hellfire_club.sql   # Database migration
```

## Environment Variables

Ensure these Google OAuth variables are set:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/auth/callback
```

## OAuth Scopes

The integration requires these Google API scopes:
- `openid` - Basic authentication
- `email` - User email
- `profile` - User profile
- `https://www.googleapis.com/auth/calendar.readonly` - Read calendar data
- `https://www.googleapis.com/auth/calendar.events` - Write calendar events (for future bi-directional sync)

## Demo Pages

- `/profile` - Updated profile page with calendar integration
- `/calendar-demo` - Dedicated demo page showing sync functionality

## Error Handling

The implementation includes comprehensive error handling:
- OAuth token refresh
- Network timeouts
- Missing permissions
- Invalid calendar IDs
- Duplicate import prevention

## Future Enhancements

### Potential Features
- **Automatic Sync**: Schedule periodic background sync
- **Bi-directional Sync**: Push local changes back to Google Calendar
- **Selective Sync**: Choose which calendars to sync
- **Conflict Resolution**: Handle conflicting updates
- **Webhook Integration**: Real-time sync via Google Calendar webhooks
- **Task Status Sync**: Sync task completion status with calendar events

## Testing

To test the integration:
1. Set up Google OAuth credentials in your project
2. Navigate to `/profile` and connect your Google Calendar
3. Visit `/calendar-demo` to see the sync in action
4. Create test events in Google Calendar with keywords like "TODO" or "Task"
5. Trigger a sync and verify events/tasks appear in the dashboard

## Security Considerations

- OAuth tokens are encrypted and stored securely
- Refresh tokens are used for long-term access
- Scope limitations prevent unauthorized calendar access
- User consent required for all calendar operations
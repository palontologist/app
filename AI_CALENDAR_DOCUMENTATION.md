# AI Calendar Suggestions - Feature Documentation

## Overview

AI-powered calendar scheduling that analyzes your goals, tasks, and existing calendar to suggest optimal time blocks for achieving your objectives.

## Features

### 1. Intelligent Scheduling
- **AI Analysis**: Uses DeepSeek AI to analyze your goals, tasks, and calendar
- **Smart Suggestions**: Generates 3-5 personalized event suggestions
- **Contextual Reasoning**: Provides clear explanation for each suggestion
- **Priority-Based**: Suggests high-priority work blocks first

### 2. Google Calendar Integration
- **Bidirectional Sync**: Both read and write to Google Calendar
- **Persistent Tokens**: OAuth tokens stored securely with automatic refresh
- **Dual Creation**: Events created in both local database and Google Calendar
- **Graceful Fallback**: If Google sync fails, events still saved locally

### 3. User-Friendly Interface
- **One-Click Access**: "AI Calendar Suggestions" button on dashboard
- **Review Before Adding**: See all suggestions with reasoning
- **Batch Selection**: Choose which suggestions to accept
- **Clear Feedback**: Success/error messages with event counts

## How to Use

### Step 1: Connect Google Calendar
1. Click "Sync Google Calendar" button on dashboard
2. Authorize Google Calendar access (includes write permissions)
3. Initial sync fetches your existing events

### Step 2: Get AI Suggestions
1. Click "AI Calendar Suggestions" button
2. AI analyzes your:
   - Active goals and progress
   - High-priority tasks
   - Existing calendar events
   - User mission and vision
3. Wait a few seconds for suggestions to generate

### Step 3: Review Suggestions
Each suggestion shows:
- **Title**: What to work on (e.g., "Work on [Goal Name]")
- **Description**: Specific activity to accomplish
- **Date & Time**: Suggested scheduling (with duration)
- **Priority**: High/Medium/Low based on importance
- **Reasoning**: Why this time slot is optimal

### Step 4: Add to Calendar
1. Suggestions are pre-selected by default
2. Uncheck any you don't want to add
3. Click "Add X to Calendar"
4. Events created automatically in both systems

## AI Scheduling Logic

### What the AI Considers
1. **Goals**: Incomplete goals needing attention
2. **Tasks**: High-priority and medium-priority tasks
3. **Calendar**: Existing events to avoid conflicts
4. **Work Hours**: Suggests 9 AM - 6 PM on weekdays
5. **Duration**: Realistic time blocks (30min - 2hrs)
6. **Timeline**: Next 7-14 days for actionable planning

### Suggestion Quality
- Links events to specific goals when relevant
- Balances short-term tasks with long-term initiatives
- Considers your mission alignment
- Provides actionable next steps

## Technical Details

### Data Flow
```
User Request
    ↓
Fetch Goals, Tasks, Events
    ↓
AI Analysis (DeepSeek model)
    ↓
Generate 3-5 Suggestions
    ↓
User Reviews & Selects
    ↓
Create in Local DB
    ↓
Sync to Google Calendar
    ↓
Update UI
```

### Token Management
- **Storage**: `googleAccounts` table in database
- **Refresh**: Automatic when token expires
- **Security**: Encrypted at rest in database
- **Scope**: `calendar.readonly` and `calendar.events`

### Error Handling
- Partial data failures handled gracefully
- Google API errors don't break local creation
- Clear error messages to user
- Automatic retry for token refresh

## API Functions

### Server Actions
```typescript
// Get AI suggestions
getAICalendarSuggestions()

// Create single event
createEventFromSuggestion(suggestion)

// Create multiple events
createEventsFromSuggestions(suggestions)
```

### Google Calendar Functions
```typescript
// Store OAuth tokens
storeTokens(userId, tokens, userInfo)

// Get valid access token
getValidAccessToken(userId)

// Create Google Calendar event
createGoogleCalendarEvent(userId, event)

// Refresh expired token
refreshAccessToken(userId)
```

### AI Functions
```typescript
// Generate calendar suggestions
generateCalendarSuggestions(userId, context)
```

## Database Schema

### Events Table (Modified)
```sql
- syncSource: text DEFAULT 'manual'  -- "manual" or "google"
- metadata: text  -- JSON with googleEventId, relatedGoalId, etc.
```

### Google Accounts Table (Existing)
```sql
- userId: text PRIMARY KEY
- googleUserId: text
- email: text
- accessToken: text
- refreshToken: text
- expiryDate: integer
- scope: text
- tokenType: text
```

## Best Practices

### For Users
1. **Connect Google Calendar first** before using AI suggestions
2. **Review suggestions carefully** - AI is smart but not perfect
3. **Regenerate if needed** - Get fresh suggestions anytime
4. **Update your goals regularly** - Better goals = better suggestions
5. **Complete tasks** - Helps AI understand your progress

### For Developers
1. **Handle token expiry** - Always check and refresh tokens
2. **Graceful degradation** - Local-only mode if Google fails
3. **User timezone** - Pass timezone when creating events
4. **Rate limiting** - Be mindful of Google API quotas
5. **Error logging** - Log failures for debugging

## Troubleshooting

### "No suggestions generated"
- Ensure you have active goals and tasks
- Check that user mission is set
- Try regenerating suggestions

### "Failed to create events"
- Verify Google Calendar is connected
- Check token hasn't been revoked
- Ensure network connectivity

### "Events not syncing to Google"
- Check OAuth scopes include `calendar.events`
- Verify token hasn't expired
- Events still saved locally as fallback

### "Suggestions seem off"
- Update your mission and goals
- Mark completed tasks as done
- Regenerate for fresh analysis

## Future Enhancements

Potential improvements (out of scope for current implementation):
1. **Learning from user behavior** - Track accepted vs. rejected suggestions
2. **Recurring event suggestions** - For regular goal check-ins
3. **Team coordination** - Suggest meeting times based on multiple calendars
4. **Integration with tasks** - Auto-create tasks from events
5. **Mobile notifications** - Remind about upcoming AI-suggested events
6. **Calendar analytics** - Show productivity patterns
7. **Custom scheduling preferences** - Let users set preferred work hours

## Security & Privacy

### Data Protection
- OAuth tokens encrypted in database
- No plaintext credentials stored
- Tokens auto-refresh securely
- User data never shared with third parties

### Permissions
- Requires user consent for Google Calendar access
- Can revoke access anytime from Google account settings
- Only accesses user's own calendar
- No access to other Google services

### AI Processing
- Uses secure Groq API endpoint
- No training on user data
- Temporary processing only
- No data retention by AI provider

## Support

For issues or questions:
1. Check Google Calendar connection status
2. Verify goals and tasks are set up
3. Review error messages in UI
4. Check browser console for technical errors
5. Ensure network connectivity to Google APIs

## Success Metrics

Track these to measure effectiveness:
- Number of suggestions generated
- Acceptance rate (events created / suggestions)
- Goal completion rate before/after using feature
- Time saved on manual scheduling
- User engagement with suggested events

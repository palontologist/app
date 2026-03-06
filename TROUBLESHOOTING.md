# Troubleshooting Guide

## 1. Calendar Connection Issues

### OAuth / Redirect Errors

**Check these in Google Cloud Console:**

1. **Redirect URI** must match exactly:
   ```
   http://localhost:3000/api/google/calendar/callback
   ```
   - Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth 2.0 Client ID
   - Add this URI under "Authorized redirect URIs"

2. **Scopes**: The app requests `calendar.readonly` and `calendar.events`. Your OAuth consent screen must allow these. If you changed scopes, users may need to re-authorize.

3. **OAuth consent screen**:
   - If the app is in "Testing" mode, only test users can connect
   - Add your email as a test user under OAuth consent screen → Test users

### Common Dashboard Errors

| URL Param | Meaning |
|-----------|---------|
| `oauth_denied` | User denied access on Google consent screen |
| `oauth_setup_failed` | Server error generating OAuth URL |
| `missing_code` | Google didn't return an authorization code |
| `token_exchange_failed` | Failed to exchange code for tokens (check client secret) |
| `sync_failed` | Calendar API call failed after auth |

---

## 2. GROQ API Key Errors

The `GROQ_API_KEY` is used for AI features (task alignment, goal analysis, etc.), not for the calendar. Errors with the AI often show as generic failures.

**Verify your key:**
1. Go to [console.groq.com](https://console.groq.com/) → API Keys
2. Confirm the key starts with `gsk_` and is 48+ characters
3. Check the key is active and not expired
4. Ensure your account has usage/credits

**Environment variable:**
```
GROQ_API_KEY=gsk_your_key_here
```
No quotes, no trailing spaces. Ensure `.env.local` has no stray characters (e.g. closing backticks).

---

## 3. better-sqlite3 Build Failure (NixOS / Linux)

**Error:** `make: cc: No such file or directory`

The project uses **Turso** (libsql) for the database, not better-sqlite3. If you see this error:

- `better-sqlite3` has been removed from dependencies
- `drizzle.config.ts` uses `dialect: "turso"` with your Turso credentials
- Run `pnpm install` again

**If you need better-sqlite3 for another reason** (e.g. local SQLite), add a C compiler to your environment:
- **NixOS:** `nix-shell -p gcc` or add `stdenv.cc` to your shell
- **Ubuntu/Debian:** `sudo apt install build-essential`
- **Fedora:** `sudo dnf install gcc`

---

## 4. Environment Variables Checklist

Ensure `.env.local` contains (no trailing backticks or markdown):

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/calendar/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
GROQ_API_KEY=gsk_...
```

---

## 5. Clerk Error 1016 (Cloudflare Origin DNS error)

**Symptom:** Clerk pages fail with a Cloudflare message referencing `*.clerk.accounts.dev` and `Error 1016`.

**Cause:** Your app is usually using Clerk keys tied to an instance domain that no longer resolves.

**Fix:**
1. Open Clerk Dashboard and verify the active instance.
2. Copy fresh keys from that instance:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Update local and hosted environment variables.
4. Restart local dev server and redeploy.
5. If still failing, create a new Clerk development instance and update keys again.

**Next runtime file naming:**
- Next.js 16 and newer: use `proxy.ts`
- Next.js 15 and older: use `middleware.ts`

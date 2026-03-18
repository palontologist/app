import { PostHog } from "posthog-node"

let _client: PostHog | null = null

export function getPostHogServer(): PostHog {
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return _client
}

/**
 * Track a server-side event. Safe to call from any server action or route handler.
 * Fire-and-forget — awaiting is optional but recommended on the shutdown path.
 */
export async function trackServerEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  try {
    const ph = getPostHogServer()
    ph.capture({ distinctId: userId, event, properties })
    await ph.flush()
  } catch {
    // Never let analytics errors surface to the user
  }
}

/**
 * Identify / update a user's traits in PostHog from the server.
 */
export async function identifyUser(
  userId: string,
  traits: Record<string, unknown>,
) {
  try {
    const ph = getPostHogServer()
    ph.identify({ distinctId: userId, properties: traits })
    await ph.flush()
  } catch {
    // silent
  }
}

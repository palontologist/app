import { SignIn } from '@clerk/nextjs'

// Marking async to future-proof if Next requires awaiting dynamic APIs (message indicates sync access warning)
export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }) {
  const resolved = (searchParams instanceof Promise) ? await searchParams : searchParams
  let redirectUrl = typeof resolved?.redirect_url === 'string' ? resolved.redirect_url : '/dashboard'
  // Prevent open redirect: allow only internal paths
  if (!redirectUrl.startsWith('/')) redirectUrl = '/dashboard'
  return (
    <div className="flex min-h-[60vh] items-start justify-center pt-12">
      <SignIn afterSignInUrl={redirectUrl} afterSignUpUrl={redirectUrl} />
    </div>
  )
}

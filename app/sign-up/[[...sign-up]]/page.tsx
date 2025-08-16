import { SignUp } from '@clerk/nextjs'

export default async function SignUpPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }) {
  const resolved = (searchParams instanceof Promise) ? await searchParams : searchParams
  let redirectUrl = typeof resolved?.redirect_url === 'string' ? resolved.redirect_url : '/onboarding'
  if (!redirectUrl.startsWith('/')) redirectUrl = '/onboarding'
  return (
    <div className="flex min-h-[60vh] items-start justify-center pt-12">
      <SignUp afterSignUpUrl={redirectUrl} afterSignInUrl={redirectUrl} />
    </div>
  )
}

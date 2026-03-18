import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import ClerkProviderWrapper from '@/components/clerk-provider-wrapper'
import { ThemeProvider } from '@/components/theme-provider'
import { PostHogProvider } from '@/components/posthog-provider'


export const metadata: Metadata = {
  title: 'greta',
  description: 'ship mission-aligned work',
  generator: 'frontforumfocus.com',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null

  return (
    <ClerkProviderWrapper publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        </head>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PostHogProvider>
              {children}
            </PostHogProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProviderWrapper>
  )
}

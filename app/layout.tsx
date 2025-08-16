import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import ClerkProviderWrapper from '@/components/clerk-provider-wrapper'


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
      <html lang="en">
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
          {children}
        </body>
      </html>
    </ClerkProviderWrapper>
  )
}

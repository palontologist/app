import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import {
  ClerkProvider,
 
} from '@clerk/nextjs'


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
  return (
      <ClerkProvider>
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
                
      {children}</body>
    </html>
      </ClerkProvider>
  )
}

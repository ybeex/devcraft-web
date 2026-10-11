import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { QueryProvider } from '@/components/layout/QueryProvider'
import { MotionProvider } from '@/components/layout/MotionProvider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'DevCraft — The last place you learn to code',
    template: '%s · DevCraft',
  },
  description:
    'Master Frontend and Backend Engineering with an AI-native, project-driven learning platform built to the same craft standard as the code it teaches.',
  icons: {
    icon: '/brand/logo/devcraft-favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Fonts loaded via standard <link> tags rather than next/font/google.
          This is a deliberate, network-environment-agnostic choice (works
          identically whether or not the build environment can reach
          fonts.gstatic.com) and has no runtime performance difference for
          end users — both approaches resolve to a <link> + font-display swap.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Bricolage+Grotesque:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider><MotionProvider>{children}</MotionProvider></QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'CrossTrails - Explore Bible Connections',
  description: 'Discover meaningful connections between Bible passages through interactive cross-references and AI-powered insights',
  keywords: ['Bible', 'cross-references', 'scripture', 'biblical connections', 'NLT', 'Bible study'],
  authors: [{ name: 'CrossTrails Team' }],
  openGraph: {
    title: 'CrossTrails - Explore Bible Connections',
    description: 'Discover meaningful connections between Bible passages through interactive cross-references and AI-powered insights',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrossTrails - Explore Bible Connections',
    description: 'Discover meaningful connections between Bible passages through interactive cross-references and AI-powered insights',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Adobe Typekit fonts for Figma design */}
        <link rel="stylesheet" href="https://use.typekit.net/vzb2itz.css" />

        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color for browsers */}
        <meta name="theme-color" content="#f26b3c" />

        {/* Prevent zoom on mobile inputs */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body
        className={`${inter.className} selection-primary antialiased`}
        suppressHydrationWarning={true}
      >
        

        {/* Main application container */}
  <div className="min-h-screen" style={{ background: '#F5F5F5' }}>
          {children}
        </div>

        {/* Performance and analytics scripts would go here */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Add analytics scripts for production */}
            {/* <Script src="..." strategy="afterInteractive" /> */}
          </>
        )}
      </body>
    </html>
  )
}
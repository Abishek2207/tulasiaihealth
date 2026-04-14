import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TulsiHealth - India\'s First FHIR R4-Compliant AYUSH + ICD-11 Dual-Coding EMR Platform',
  description: 'TulsiHealth is a revolutionary EMR platform that bridges traditional AYUSH medicine with modern ICD-11 coding through FHIR R4 compliance.',
  keywords: ['AYUSH', 'ICD-11', 'FHIR', 'EMR', 'Ayurveda', 'Siddha', 'Unani', 'Healthcare India', 'Digital Health'],
  authors: [{ name: 'SmartAI Studio', url: 'https://smartai.studio' }],
  creator: 'Abishek R',
  publisher: 'SmartAI Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'TulsiHealth - AYUSH + ICD-11 EMR Platform',
    description: 'India\'s first FHIR R4-compliant dual-coding EMR platform for AYUSH medicine',
    url: 'https://tulsihealth.in',
    siteName: 'TulsiHealth',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TulsiHealth Platform',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TulsiHealth - AYUSH + ICD-11 EMR Platform',
    description: 'India\'s first FHIR R4-compliant dual-coding EMR platform',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background font-sans antialiased">
            {children}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

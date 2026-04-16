import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: "TulsiHealth — India's First AYUSH + ICD-11 Dual-Coding EMR",
  description: "TulsiHealth is India's first EMR platform with AYUSH + ICD-11 dual-coding, AI-powered diagnosis, and FHIR R4 compliance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Inter, sans-serif', background: '#000', color: '#fff' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}




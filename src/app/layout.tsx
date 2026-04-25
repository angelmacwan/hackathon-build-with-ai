import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'NeuralPath — Adaptive Learning Intelligence',
    template: '%s | NeuralPath',
  },
  description:
    'NeuralPath is an AI-powered personalized learning assistant that adapts every explanation to your pace, background, and cognitive style using a 6-agent LangGraph pipeline.',
  keywords: ['adaptive learning', 'AI tutor', 'personalized education', 'LangGraph'],
  openGraph: {
    title: 'NeuralPath — Adaptive Learning Intelligence',
    description: 'AI-powered learning that adapts to you, not the other way around.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#f8f9f9" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

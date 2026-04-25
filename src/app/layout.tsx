import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
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
    <html lang="en" className={poppins.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#F0FBF8" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

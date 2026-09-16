import type { Metadata } from 'next';
import { DM_Mono, Libre_Baskerville, Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });
const libre = Libre_Baskerville({ variable: '--font-libre', subsets: ['latin'], weight: ['400', '700'] });
const mono = DM_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://audioplugin.io'),
  title: {
    default: 'audioplugin.io — Audio Plugin Archive',
    template: '%s | audioplugin.io',
  },
  description: 'A community-maintained historical archive of audio plugins, virtual instruments, effects, and music software.',
  applicationName: 'audioplugin.io',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${manrope.variable} ${libre.variable} ${mono.variable}`}>{children}</body></html>;
}

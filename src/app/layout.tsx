import type { Metadata, Viewport } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { StyleProvider } from '@/components/theme/style-provider';
import { APP_DESCRIPTION, APP_NAME, STYLE_STORAGE_KEY } from '@/lib/constants';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dm-sans',
});

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fraunces',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Мой Крем',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f2ed' },
    { media: '(prefers-color-scheme: dark)', color: '#171311' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning data-style="warm">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gde-moy-krem-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}var s=localStorage.getItem('${STYLE_STORAGE_KEY}');document.documentElement.dataset.style=s==='pulse'?'pulse':s==='riot'?'riot':'warm';}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${fraunces.variable} min-h-full antialiased`}
      >
        <ThemeProvider>
          <StyleProvider>{children}</StyleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const fontMain = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const fontSecondary = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MTC Internal',
  description: 'Internal business management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontMain.variable} ${fontSecondary.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

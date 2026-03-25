import type { Metadata } from 'next';
import { Geist, Geist_Mono, DM_Sans } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", dmSans.variable)}>
      <body
        className={`${fontMain.variable} ${fontSecondary.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

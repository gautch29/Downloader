import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { MobileNav } from '@/components/mobile-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Downloader',
    description: 'Premium 1fichier Download Manager',
    icons: {
        icon: '/globe.svg',
    },
};

import { I18nProvider } from '@/lib/i18n';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen text-foreground antialiased selection:bg-[#0071E3]/20 dark:selection:bg-[#0A84FF]/20 overflow-x-hidden`}>
                <I18nProvider>
                    <Header />
                    <main className="relative z-10 pb-20 md:pb-0">
                        {children}
                    </main>
                    <MobileNav />
                </I18nProvider>
            </body>
        </html>
    );
}

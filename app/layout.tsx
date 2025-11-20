import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'dl.flgr.fr',
    description: 'Premium 1fichier Download Manager',
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
                    <main className="relative z-10">
                        {children}
                    </main>
                </I18nProvider>
            </body>
        </html>
    );
}

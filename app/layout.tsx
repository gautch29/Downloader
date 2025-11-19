import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: '1fichier Downloader',
    description: 'Premium 1fichier Download Manager',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased selection:bg-violet-500/30`}>
                <Header />
                <main className="relative z-10">
                    {children}
                </main>
            </body>
        </html>
    );
}

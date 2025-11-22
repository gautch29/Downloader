'use client';

import { useState } from 'react';
import { Book, Download, Loader2, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { GlassCard } from './ui/glass-card';
import { useI18n } from '@/lib/i18n';

interface BookProps {
    book: {
        id: string;
        title: string;
        author: string;
        year?: number | string;
        cover?: string | null;
        link?: string;
        extension?: string;
        size?: string;
    };
}

export function BookCard({ book }: BookProps) {
    const { t } = useI18n();
    const [downloading, setDownloading] = useState(false);

    const handleDownload = () => {
        setDownloading(true);
        // Open the detail page on Anna's Archive
        if (book.link) {
            window.open(book.link, '_blank');
        } else {
            // Fallback: Open Anna's Archive search
            const query = `${book.title} ${book.author}`;
            const url = `https://annas-archive.org/search?q=${encodeURIComponent(query)}`;
            window.open(url, '_blank');
        }
        setDownloading(false);
    };

    return (
        <GlassCard className="overflow-hidden hover:scale-[1.02] transition-transform">
            <div className="relative">
                {/* Cover */}
                <div className="aspect-[2/3] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center overflow-hidden">
                    {book.cover ? (
                        <img
                            src={book.cover}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    <div className={book.cover ? 'hidden' : 'flex items-center justify-center'}>
                        <BookOpen className="h-16 w-16 text-zinc-400 dark:text-zinc-600" />
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-2 text-sm">
                        {book.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                        {book.author}
                    </p>
                    {book.year && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {book.year}
                        </p>
                    )}
                </div>

                {/* Download Button */}
                <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full h-10 md:h-9 bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white text-sm md:text-xs font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                    {downloading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Searching...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Get Book
                        </>
                    )}
                </Button>
            </div>
        </GlassCard>
    );
}

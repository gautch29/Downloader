import { NextRequest, NextResponse } from 'next/server';
import { annasArchive } from '@/lib/annas-archive';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        const results = await annasArchive.search(query);

        const books = results.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            year: book.year,
            cover: book.cover,
            link: book.link,
            extension: book.extension,
            size: book.size,
        }));

        return NextResponse.json({ books });
    } catch (error: any) {
        console.error('Book search error:', error);
        return NextResponse.json({ error: 'Failed to search books' }, { status: 500 });
    }
}

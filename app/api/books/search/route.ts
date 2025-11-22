import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,first_publish_year,isbn,language`);

        if (!response.ok) {
            throw new Error(`Open Library API error: ${response.statusText}`);
        }

        const data = await response.json();

        const books = data.docs.map((doc: any) => ({
            id: doc.key.replace('/works/', ''),
            title: doc.title,
            author: doc.author_name?.[0] || 'Unknown Author',
            year: doc.first_publish_year,
            cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
            isbn: doc.isbn?.[0],
            language: doc.language?.[0],
        }));

        return NextResponse.json({ books });
    } catch (error: any) {
        console.error('Book search error:', error);
        return NextResponse.json({ error: 'Failed to search books' }, { status: 500 });
    }
}

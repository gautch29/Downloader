import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
    try {
        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // Fetch the image
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Use sharp to extract dominant color
        const image = sharp(Buffer.from(response.data));
        const { dominant } = await image.stats();

        const color = `${dominant.r}, ${dominant.g}, ${dominant.b}`;

        return NextResponse.json({ color });
    } catch (error: any) {
        console.error('Color extraction error:', error.message);
        return NextResponse.json({ color: '59, 130, 246' }); // Default blue
    }
}

'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Extract dominant color from an image URL
 */
export function useDominantColor(imageUrl: string | null | undefined): string {
    const [color, setColor] = useState<string>('59, 130, 246'); // Default blue
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!imageUrl) {
            setColor('59, 130, 246'); // Default blue
            return;
        }

        // Create canvas if it doesn't exist
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            // Scale down for performance
            canvas.width = 50;
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);

            try {
                const imageData = ctx.getImageData(0, 0, 50, 50);
                const data = imageData.data;

                // Color frequency map
                const colorMap = new Map<string, number>();

                // Sample pixels and count color frequencies
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    // Skip transparent or very dark/light pixels
                    if (a < 128 || (r < 20 && g < 20 && b < 20) || (r > 235 && g > 235 && b > 235)) {
                        continue;
                    }

                    // Quantize colors to reduce variations
                    const qr = Math.round(r / 32) * 32;
                    const qg = Math.round(g / 32) * 32;
                    const qb = Math.round(b / 32) * 32;
                    const key = `${qr},${qg},${qb}`;

                    colorMap.set(key, (colorMap.get(key) || 0) + 1);
                }

                // Find most frequent color
                let maxCount = 0;
                let dominantRGB = '59, 130, 246'; // Default blue

                for (const [color, count] of colorMap.entries()) {
                    if (count > maxCount) {
                        maxCount = count;
                        dominantRGB = color;
                    }
                }

                // Parse and boost saturation
                const [r, g, b] = dominantRGB.split(',').map(Number);

                // Boost saturation for more vibrant glow
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const saturation = max === 0 ? 0 : (max - min) / max;

                if (saturation < 0.4) {
                    // Boost the dominant channel
                    const boost = 1.4;
                    const newR = r === max ? Math.min(255, Math.floor(r * boost)) : r;
                    const newG = g === max ? Math.min(255, Math.floor(g * boost)) : g;
                    const newB = b === max ? Math.min(255, Math.floor(b * boost)) : b;
                    setColor(`${newR}, ${newG}, ${newB}`);
                } else {
                    setColor(dominantRGB);
                }
            } catch (error) {
                // CORS or other error, use default
                setColor('59, 130, 246');
            }
        };

        img.onerror = () => {
            setColor('59, 130, 246');
        };

        img.src = imageUrl;
    }, [imageUrl]);

    return color;
}

/**
 * Hook to track mouse position relative to an element
 */
export function useMouseGlow(enabled: boolean = true) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!enabled || !elementRef.current) return;

        const element = elementRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        };

        const handleMouseEnter = () => setIsHovering(true);
        const handleMouseLeave = () => setIsHovering(false);

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [enabled]);

    return { elementRef, mousePosition, isHovering };
}

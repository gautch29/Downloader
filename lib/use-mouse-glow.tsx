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

                let r = 0, g = 0, b = 0;
                let count = 0;

                // Sample pixels and calculate average color
                for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel for performance
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }

                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                // Boost saturation for more vibrant glow
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const saturation = max === 0 ? 0 : (max - min) / max;

                if (saturation < 0.3) {
                    // Boost colors if image is too desaturated
                    const boost = 1.5;
                    r = Math.min(255, Math.floor(r * boost));
                    g = Math.min(255, Math.floor(g * boost));
                    b = Math.min(255, Math.floor(b * boost));
                }

                setColor(`${r}, ${g}, ${b}`);
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

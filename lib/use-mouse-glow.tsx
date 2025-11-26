'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Extract dominant color from an image URL
 */
export function useDominantColor(imageUrl: string | null | undefined): string {
    const [color, setColor] = useState<string>('59, 130, 246'); // Default blue

    useEffect(() => {
        if (!imageUrl) {
            setColor('59, 130, 246'); // Default blue
            return;
        }

        // Use server-side API to extract color (avoids CORS issues)
        fetch('/api/extract-color', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl })
        })
            .then(res => res.json())
            .then(data => {
                if (data.color) {
                    setColor(data.color);
                }
            })
            .catch(err => {
                console.error('Color extraction failed:', err);
                setColor('59, 130, 246'); // Fallback to default
            });
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

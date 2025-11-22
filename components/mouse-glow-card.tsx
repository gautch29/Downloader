'use client';

import React, { useRef, useState, useEffect } from 'react';

interface MouseGlowCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    glowSize?: number;
    glowIntensity?: number;
}

export function MouseGlowCard({
    children,
    className = '',
    glowColor = '#0071E3',
    glowSize = 300,
    glowIntensity = 0.4,
}: MouseGlowCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setMousePosition({ x, y });
        };

        const handleMouseEnter = () => setIsHovering(true);
        const handleMouseLeave = () => setIsHovering(false);

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            card.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseenter', handleMouseEnter);
            card.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div
            ref={cardRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                // @ts-ignore - CSS custom properties
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`,
                '--glow-color': glowColor,
                '--glow-size': `${glowSize}px`,
                '--glow-intensity': glowIntensity,
            }}
        >
            {/* Colored blur that follows the mouse */}
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300"
                style={{
                    opacity: isHovering ? 1 : 0,
                }}
            >
                <div
                    className="absolute rounded-full blur-3xl transition-all duration-200 ease-out"
                    style={{
                        left: mousePosition.x,
                        top: mousePosition.y,
                        width: `${glowSize}px`,
                        height: `${glowSize}px`,
                        transform: 'translate(-50%, -50%)',
                        background: `radial-gradient(circle, ${glowColor}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                        willChange: 'transform',
                    }}
                />
            </div>

            {/* Card content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

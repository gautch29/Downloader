import React from 'react';

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20" />
                    <h1 className="text-xl font-bold tracking-tight">
                        <span className="text-white">1fichier</span>
                        <span className="text-white/40">.dl</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        SYSTEM ONLINE
                    </div>
                </div>
            </div>
        </header>
    );
}

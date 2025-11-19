import React from 'react';
import { Activity, LogOut, Settings } from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from './ui/button';
import Link from 'next/link';

export async function Header() {
    // Get current user
    const userId = await getSession();
    let username = 'User';

    if (userId) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (user) username = user.username;
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-lg">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                        <span className="text-lg font-bold text-white">1F</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">1fichier.dl</h1>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Download Manager</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5">
                        <Activity className="h-3 w-3 animate-pulse text-emerald-400" />
                        <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                            {username}
                        </span>
                    </div>

                    <Link href="/settings">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </Button>
                    </Link>

                    <form action={logoutAction}>
                        <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    );
}

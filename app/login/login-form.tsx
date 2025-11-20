'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Lock, User } from 'lucide-react';

export function LoginForm() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const result = await loginAction(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else {
            // Redirect to home page on successful login
            router.push('/');
            router.refresh();
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Download className="h-8 w-8 text-violet-400" />
                        <h1 className="text-3xl font-bold text-gradient">1fichier.dl</h1>
                    </div>
                    <p className="text-zinc-400">Sign in to access the downloader</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8 rounded-2xl border border-white/10 backdrop-blur-sm animate-fade-in-up delay-100">
                    <form action={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input
                                    name="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    required
                                    autoComplete="username"
                                    className="pl-10 bg-black/20 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                    className="pl-10 bg-black/20 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-600 mt-6">
                    Contact the administrator to create an account
                </p>
            </div>
        </div>
    );
}

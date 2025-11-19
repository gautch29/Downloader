'use client';

import { useState } from 'react';
import { changePasswordAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        setSuccess(false);

        const result = await changePasswordAction(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else if (result?.success) {
            setSuccess(true);
            setLoading(false);
            // Clear form
            (document.getElementById('password-form') as HTMLFormElement)?.reset();
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <div className="mb-6">
                <Link href="/" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Downloads
                </Link>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-white/10">
                <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Change Password</h2>

                        <form id="password-form" action={handleSubmit} className="space-y-4">
                            {/* Current Password */}
                            <div>
                                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        name="currentPassword"
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        className="pl-10 bg-black/20 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20"
                                    />
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        name="newPassword"
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        className="pl-10 bg-black/20 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        autoComplete="new-password"
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

                            {/* Success Message */}
                            {success && (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                                    Password changed successfully!
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                {loading ? 'Changing Password...' : 'Change Password'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

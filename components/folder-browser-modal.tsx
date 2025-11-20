'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, ChevronRight, CornerLeftUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderBrowserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
    initialPath: string;
}

interface FolderItem {
    name: string;
    path: string;
}

export function FolderBrowserModal({ isOpen, onClose, onSelect, initialPath }: FolderBrowserModalProps) {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && initialPath) {
            setCurrentPath(initialPath);
            setHistory([]);
            loadFolders(initialPath);
        }
    }, [isOpen, initialPath]);

    async function loadFolders(path: string) {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/paths/browse?path=${encodeURIComponent(path)}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to load folders');
            }

            setFolders(data.folders);
            setCurrentPath(data.currentPath);
        } catch (err: any) {
            setError(err.message);
            setFolders([]);
        } finally {
            setLoading(false);
        }
    }

    function handleNavigate(path: string) {
        setHistory(prev => [...prev, currentPath]);
        loadFolders(path);
    }

    function handleGoUp() {
        if (history.length > 0) {
            const previousPath = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            loadFolders(previousPath);
        }
    }

    function handleSelect() {
        onSelect(currentPath);
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Folder className="h-5 w-5 text-[#0071E3] dark:text-[#0A84FF]" />
                        Browse Folders
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Current Path Breadcrumb-ish */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-mono overflow-hidden">
                        <span className="truncate direction-rtl text-zinc-600 dark:text-zinc-300">
                            {currentPath || 'Select a root path first'}
                        </span>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGoUp}
                            disabled={history.length === 0 || loading}
                            className="gap-1"
                        >
                            <CornerLeftUp className="h-4 w-4" />
                            Back
                        </Button>
                    </div>

                    {/* Folder List */}
                    <div className="border rounded-lg min-h-[300px] relative bg-white dark:bg-zinc-900">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0071E3]" />
                            </div>
                        ) : error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                <p className="text-red-500 text-sm mb-2">{error}</p>
                                <Button variant="outline" size="sm" onClick={() => loadFolders(currentPath)}>
                                    Retry
                                </Button>
                            </div>
                        ) : folders.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
                                No subfolders found
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px]">
                                <div className="p-2 space-y-1">
                                    {folders.map((folder) => (
                                        <button
                                            key={folder.path}
                                            onClick={() => handleNavigate(folder.path)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Folder className="h-5 w-5 text-zinc-400 group-hover:text-[#0071E3] transition-colors flex-shrink-0" />
                                                <span className="text-sm font-medium truncate text-zinc-700 dark:text-zinc-200">
                                                    {folder.name}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500" />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSelect} disabled={loading || !currentPath}>
                        Select This Folder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

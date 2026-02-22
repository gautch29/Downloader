import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  DownloadJob,
  DownloadStatus,
  FolderBrowseResponse,
  FolderEntry,
  FolderPresetsResponse,
  StorageStatus
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined)
  };

  if (init.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
}

function formatStatus(status: DownloadStatus): string {
  return status.slice(0, 1).toUpperCase() + status.slice(1);
}

function formatTime(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

function formatSyncTime(iso: string | null): string {
  if (!iso) {
    return 'Never';
  }

  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return 'Never';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(value);
}

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [accessKey, setAccessKey] = useState('');
  const [url, setUrl] = useState('');
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [presets, setPresets] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customTargetPath, setCustomTargetPath] = useState<string>('');

  const [showBrowser, setShowBrowser] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [browseCurrentPath, setBrowseCurrentPath] = useState('');
  const [browseParentPath, setBrowseParentPath] = useState<string | null>(null);
  const [browseDirectories, setBrowseDirectories] = useState<FolderEntry[]>([]);

  const [jobSearch, setJobSearch] = useState('');

  const isAuthed = useMemo(() => Boolean(token), [token]);
  const activeTarget = customTargetPath || selectedPreset;

  const refreshJobs = async () => {
    if (!token) {
      return;
    }

    try {
      const [list, storageStatus] = await Promise.all([
        api<DownloadJob[]>('/downloads', { method: 'GET' }, token),
        api<StorageStatus>('/system/storage', { method: 'GET' }, token)
      ]);
      setJobs(list);
      setStorage(storageStatus);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadInitialData = async () => {
      try {
        const [list, presetResponse, browse, storageStatus] = await Promise.all([
          api<DownloadJob[]>('/downloads', { method: 'GET' }, token),
          api<FolderPresetsResponse>('/folders/presets', { method: 'GET' }, token),
          api<FolderBrowseResponse>('/folders/browse', { method: 'GET' }, token),
          api<StorageStatus>('/system/storage', { method: 'GET' }, token)
        ]);

        setJobs(list);
        setStorage(storageStatus);
        setPresets(presetResponse.presets);
        setSelectedPreset(presetResponse.presets[0] ?? '');

        setBrowseCurrentPath(browse.current_path);
        setBrowseParentPath(browse.parent_path);
        setBrowseDirectories(browse.directories);
        setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    loadInitialData();
    const id = setInterval(refreshJobs, 4000);
    return () => clearInterval(id);
  }, [token]);

  const browsePath = async (path?: string) => {
    if (!token) {
      return;
    }

    try {
      const query = path ? `?path=${encodeURIComponent(path)}` : '';
      const browse = await api<FolderBrowseResponse>(`/folders/browse${query}`, { method: 'GET' }, token);
      setBrowseCurrentPath(browse.current_path);
      setBrowseParentPath(browse.parent_path);
      setBrowseDirectories(browse.directories);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const createFolder = async () => {
    if (!token || !newFolderName.trim()) {
      return;
    }

    try {
      await api<FolderEntry>(
        '/folders/create',
        {
          method: 'POST',
          body: JSON.stringify({ parent_path: browseCurrentPath, name: newFolderName.trim() })
        },
        token
      );
      setNewFolderName('');
      await browsePath(browseCurrentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const data = await api<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ access_key: accessKey })
      });
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      setAccessKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const submitDownload = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setError(null);

    if (!activeTarget) {
      setError('Select a destination folder first.');
      return;
    }

    try {
      await api<DownloadJob>(
        '/downloads',
        {
          method: 'POST',
          body: JSON.stringify({ url, target_dir: activeTarget })
        },
        token
      );
      setUrl('');
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const pauseJob = async (jobId: string) => {
    if (!token) {
      return;
    }

    try {
      await api<DownloadJob>(`/downloads/${jobId}/pause`, { method: 'POST' }, token);
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const stopJob = async (jobId: string) => {
    if (!token) {
      return;
    }

    try {
      await api<DownloadJob>(`/downloads/${jobId}/stop`, { method: 'POST' }, token);
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const removeJob = async (jobId: string) => {
    if (!token) {
      return;
    }

    try {
      await api<void>(`/downloads/${jobId}`, { method: 'DELETE' }, token);
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const cleanJobs = async () => {
    if (!token) {
      return;
    }

    try {
      await api<{ removed_count: number }>('/downloads/clean', { method: 'POST' }, token);
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setJobs([]);
    setShowBrowser(false);
    setCustomTargetPath('');
    setStorage(null);
    setLastSyncedAt(null);
  };

  const stats = useMemo(() => {
    const running = jobs.filter((job) => job.status === 'running').length;
    const queued = jobs.filter((job) => job.status === 'queued').length;
    const failed = jobs.filter((job) => job.status === 'failed').length;
    const completed = jobs.filter((job) => job.status === 'success').length;
    return { running, queued, failed, completed };
  }, [jobs]);

  const storageUsedPercent = useMemo(() => {
    if (!storage || storage.total_bytes <= 0) {
      return 0;
    }

    return (storage.used_bytes / storage.total_bytes) * 100;
  }, [storage]);

  const filteredJobs = useMemo(() => {
    const search = jobSearch.trim().toLowerCase();
    return jobs.filter((job) => {
      if (!search) {
        return true;
      }
      return (
        job.source_url.toLowerCase().includes(search) ||
        (job.file_name || '').toLowerCase().includes(search) ||
        job.target_dir.toLowerCase().includes(search)
      );
    });
  }, [jobs, jobSearch]);

  return (
    <main className="app">
      <section className="shell">
        <header className="masthead">
          <div className="masthead-copy">
            <p className="eyebrow">Private Pipeline</p>
            <h1>Movie Drop Console</h1>
            <p className="lead">Queue secure 1fichier downloads, route them to the right library folder, and monitor progress live.</p>
          </div>

          {isAuthed && (
            <div className="masthead-actions">
              <p className="sync-pill">Updated {formatSyncTime(lastSyncedAt)}</p>
              <button type="button" className="button button-ghost" onClick={logout}>
                Sign out
              </button>
            </div>
          )}
        </header>

        {!isAuthed ? (
          <section className="auth-wrap">
            <form className="auth-card" onSubmit={login}>
              <h2>Unlock Workspace</h2>
              <p>Use your private access key to start remote downloads.</p>
              <label className="field">
                <span>Access key</span>
                <input
                  type="password"
                  value={accessKey}
                  onChange={(event) => setAccessKey(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter access key"
                  required
                />
              </label>
              <button type="submit" className="button button-primary button-wide">
                Unlock
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="metrics-grid">
              <article className="metric-card">
                <p className="metric-label">Running</p>
                <p className="metric-value">{stats.running}</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Queued</p>
                <p className="metric-value">{stats.queued}</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Completed</p>
                <p className="metric-value">{stats.completed}</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Failed</p>
                <p className="metric-value">{stats.failed}</p>
              </article>
              <article className="metric-card storage-card">
                <p className="metric-label">Storage Free</p>
                <p className="metric-value">{storage ? formatBytes(storage.free_bytes) : '...'}</p>
                <div className="meter">
                  <span className="meter-fill" style={{ width: `${Math.min(100, Math.max(0, storageUsedPercent))}%` }} />
                </div>
              </article>
            </section>

            <section className="workflow-grid">
              <form className="panel" onSubmit={submitDownload}>
                <header className="panel-head">
                  <h2>New Download</h2>
                  <p className="panel-sub">Destination: {activeTarget || 'Select a folder'}</p>
                </header>

                <label className="field">
                  <span>1fichier link</span>
                  <input
                    type="url"
                    placeholder="https://1fichier.com/?..."
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>Destination preset</span>
                  <div className="split-row">
                    <select value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value)}>
                      {presets.length === 0 && <option value="">No preset available</option>}
                      {presets.map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={async () => {
                        setShowBrowser(true);
                        await browsePath(customTargetPath || undefined);
                      }}
                    >
                      Browse
                    </button>
                  </div>
                </label>

                {customTargetPath && (
                  <div className="target-pill">
                    <span>Custom folder</span>
                    <code>{customTargetPath}</code>
                    <button type="button" className="button button-clear" onClick={() => setCustomTargetPath('')}>
                      Clear
                    </button>
                  </div>
                )}

                {showBrowser && (
                  <section className="browser-shell">
                    <header className="browser-head">
                      <p>Folder Browser</p>
                      <div className="browser-controls">
                        <button type="button" className="button button-clear" onClick={() => browsePath()}>
                          Root
                        </button>
                        <button
                          type="button"
                          className="button button-clear"
                          onClick={() => browseParentPath && browsePath(browseParentPath)}
                          disabled={!browseParentPath}
                        >
                          Up
                        </button>
                        <button type="button" className="button button-clear" onClick={() => setShowBrowser(false)}>
                          Close
                        </button>
                      </div>
                    </header>

                    <p className="browser-path">{browseCurrentPath}</p>

                    <ul className="folder-list">
                      {browseDirectories.map((folder) => (
                        <li key={folder.path}>
                          <button type="button" className="folder-row" onClick={() => browsePath(folder.path)}>
                            <span className="folder-icon" aria-hidden>
                              <svg viewBox="0 0 20 20" focusable="false">
                                <path d="M2 5.5a2 2 0 0 1 2-2h4l1.2 1.4h6.8a2 2 0 0 1 2 2v6.8a2.2 2.2 0 0 1-2.2 2.2H4.2A2.2 2.2 0 0 1 2 13.7V5.5Z" />
                              </svg>
                            </span>
                            <span className="folder-copy">
                              <strong>{folder.name}</strong>
                              <small>{folder.path}</small>
                            </span>
                          </button>
                        </li>
                      ))}
                      {browseDirectories.length === 0 && <li className="folder-empty">No subfolders in this path.</li>}
                    </ul>

                    <div className="browser-footer">
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => {
                          setCustomTargetPath(browseCurrentPath);
                          setShowBrowser(false);
                        }}
                      >
                        Select this folder
                      </button>
                    </div>

                    <div className="split-row">
                      <input
                        placeholder="new-folder-name"
                        value={newFolderName}
                        onChange={(event) => setNewFolderName(event.target.value)}
                      />
                      <button type="button" className="button button-secondary" onClick={createFolder}>
                        Create
                      </button>
                    </div>
                  </section>
                )}

                <button type="submit" className="button button-primary button-wide">
                  Queue download
                </button>
              </form>

              <section className="panel jobs-panel">
                <header className="panel-head panel-head-space">
                  <div>
                    <h2>Recent Jobs</h2>
                    <p className="panel-sub">{filteredJobs.length} visible</p>
                  </div>
                  <button type="button" className="button button-ghost" onClick={cleanJobs}>
                    Clean completed
                  </button>
                </header>

                <label className="field search-field">
                  <span className="sr-only">Search jobs</span>
                  <input
                    placeholder="Search file name, target folder, or link"
                    value={jobSearch}
                    onChange={(event) => setJobSearch(event.target.value)}
                  />
                </label>

                <div className="jobs-list">
                  {filteredJobs.length === 0 && (
                    <div className="empty-state">
                      <p>No jobs yet.</p>
                      <span>Queue a link to start your first download.</span>
                    </div>
                  )}

                  {filteredJobs.map((job) => (
                    <article key={job.id} className={`job-card status-${job.status}`}>
                      <header className="job-top">
                        <p className="status-pill">{formatStatus(job.status)}</p>
                        <p className="job-time">{formatTime(job.updated_at)}</p>
                      </header>

                      {job.file_name && <p className="job-title">{job.file_name}</p>}
                      <p className="job-link">{job.source_url}</p>
                      <p className="job-target">Target: {job.target_dir}</p>

                      <div className="progress-wrap">
                        <div className="progress-meta">
                          <span>{job.total_bytes ? `${job.progress_percent.toFixed(1)}%` : 'Streaming'}</span>
                          <span>
                            {formatBytes(job.bytes_downloaded)}
                            {job.total_bytes ? ` / ${formatBytes(job.total_bytes)}` : ''}
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-value"
                            style={{ width: `${Math.min(100, Math.max(0, job.progress_percent || 0))}%` }}
                          />
                        </div>
                      </div>

                      {job.saved_path && <p className="job-target">Saved: {job.saved_path}</p>}
                      {job.error_message && <p className="job-error">Error: {job.error_message}</p>}

                      <div className="job-actions">
                        {(job.status === 'running' || job.status === 'queued') && (
                          <>
                            <button type="button" className="button button-clear" onClick={() => pauseJob(job.id)}>
                              Pause
                            </button>
                            <button type="button" className="button button-clear" onClick={() => stopJob(job.id)}>
                              Stop
                            </button>
                          </>
                        )}
                        <button type="button" className="button button-clear" onClick={() => removeJob(job.id)}>
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          </>
        )}

        {error && <p className="error-banner">{error}</p>}
      </section>
    </main>
  );
}

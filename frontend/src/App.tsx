import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DownloadJob, FolderBrowseResponse, FolderEntry, FolderPresetsResponse, StorageStatus } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

type JobFilter = 'all' | DownloadJob['status'];

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

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [accessKey, setAccessKey] = useState('');
  const [url, setUrl] = useState('');
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageStatus | null>(null);

  const [presets, setPresets] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customTargetPath, setCustomTargetPath] = useState<string>('');

  const [showBrowser, setShowBrowser] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [browseCurrentPath, setBrowseCurrentPath] = useState('');
  const [browseParentPath, setBrowseParentPath] = useState<string | null>(null);
  const [browseDirectories, setBrowseDirectories] = useState<FolderEntry[]>([]);

  const [jobFilter, setJobFilter] = useState<JobFilter>('all');
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
        if (presetResponse.presets.length > 0) {
          setSelectedPreset(presetResponse.presets[0]);
        }

        setBrowseCurrentPath(browse.current_path);
        setBrowseParentPath(browse.parent_path);
        setBrowseDirectories(browse.directories);
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
  };

  const stats = useMemo(() => {
    const running = jobs.filter((j) => j.status === 'running').length;
    const queued = jobs.filter((j) => j.status === 'queued').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;
    const completed = jobs.filter((j) => j.status === 'success').length;
    return { running, queued, failed, completed };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const search = jobSearch.trim().toLowerCase();
    return jobs.filter((job) => {
      if (jobFilter !== 'all' && job.status !== jobFilter) {
        return false;
      }
      if (!search) {
        return true;
      }
      return (
        job.source_url.toLowerCase().includes(search) ||
        (job.file_name || '').toLowerCase().includes(search) ||
        job.target_dir.toLowerCase().includes(search)
      );
    });
  }, [jobs, jobFilter, jobSearch]);

  return (
    <main className="layout">
      <section className="card">
        <header className="topbar">
          <div>
            <p className="tag">Private Pipeline</p>
            <h1>Movie Drop Console</h1>
          </div>
          {isAuthed && (
            <button type="button" className="btn secondary" onClick={logout}>
              Sign out
            </button>
          )}
        </header>

        {!isAuthed ? (
          <form className="stack auth" onSubmit={login}>
            <label>
              Access key
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter admin access key"
                required
              />
            </label>
            <button type="submit" className="btn primary">
              Unlock
            </button>
          </form>
        ) : (
          <>
            <section className="metrics-row">
              <article className="metric-card">
                <p>Running</p>
                <strong>{stats.running}</strong>
              </article>
              <article className="metric-card">
                <p>Queued</p>
                <strong>{stats.queued}</strong>
              </article>
              <article className="metric-card">
                <p>Failed</p>
                <strong>{stats.failed}</strong>
              </article>
              <article className="metric-card">
                <p>Storage Free</p>
                <strong>{storage ? formatBytes(storage.free_bytes) : '...'}</strong>
              </article>
            </section>

            <div className="content-grid">
              <form className="stack surface" onSubmit={submitDownload}>
                <label>
                  1fichier link
                  <input
                    type="url"
                    placeholder="https://1fichier.com/?..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Destination preset
                  <div className="row">
                    <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
                      {presets.map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn secondary"
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
                  <div className="selected-target">
                    <span>Custom target:</span>
                    <code>{customTargetPath}</code>
                    <button type="button" className="btn ghost" onClick={() => setCustomTargetPath('')}>
                      Clear
                    </button>
                  </div>
                )}

                {showBrowser && (
                  <section className="browser">
                    <div className="browser-head">
                      <div className="row">
                        <button type="button" className="btn ghost" onClick={() => browsePath()}>
                          Root
                        </button>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => browseParentPath && browsePath(browseParentPath)}
                          disabled={!browseParentPath}
                        >
                          Up
                        </button>
                        <button type="button" className="btn ghost" onClick={() => setShowBrowser(false)}>
                          Close
                        </button>
                      </div>
                      <code className="path">{browseCurrentPath}</code>
                    </div>

                    <ul className="folder-list">
                      {browseDirectories.map((folder) => (
                        <li key={folder.path}>
                          <button type="button" className="folder-row" onClick={() => browsePath(folder.path)}>
                            <span className="folder-label">DIR</span>
                            <span className="folder-name">{folder.name}</span>
                            <span className="folder-path">{folder.path}</span>
                          </button>
                        </li>
                      ))}
                      {browseDirectories.length === 0 && <li className="folder-empty">No subfolders here.</li>}
                    </ul>

                    <div className="browser-actions">
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => {
                          setCustomTargetPath(browseCurrentPath);
                          setShowBrowser(false);
                        }}
                      >
                        Select this folder
                      </button>
                    </div>

                    <div className="row">
                      <input
                        placeholder="new-folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                      />
                      <button type="button" className="btn secondary" onClick={createFolder}>
                        Create folder
                      </button>
                    </div>
                  </section>
                )}

                <button type="submit" className="btn primary large">
                  Queue download
                </button>
              </form>

              <section className="jobs surface">
                <div className="jobs-head">
                  <h2>Recent Jobs</h2>
                  <button type="button" className="btn ghost" onClick={cleanJobs}>
                    Clean completed
                  </button>
                </div>

                <div className="toolbar">
                  <input
                    placeholder="Search file, target, link"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                  />
                  <div className="segmented">
                    {(['all', 'running', 'queued', 'success', 'failed', 'paused', 'canceled'] as JobFilter[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={`segmented-btn ${jobFilter === f ? 'active' : ''}`}
                        onClick={() => setJobFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredJobs.length === 0 && <p className="muted">No jobs for current filter.</p>}
                {filteredJobs.map((job) => (
                  <article key={job.id} className={`job-card ${job.status}`}>
                    <p className="job-status">{job.status.toUpperCase()}</p>
                    {job.file_name && <p className="job-file">{job.file_name}</p>}
                    <p className="job-url">{job.source_url}</p>
                    <p className="job-path">Target: {job.target_dir}</p>
                    <div className="progress-wrap">
                      <div className="progress-meta">
                        <span>{job.total_bytes ? `${job.progress_percent.toFixed(1)}%` : 'Streaming...'}</span>
                        <span>
                          {formatBytes(job.bytes_downloaded)}
                          {job.total_bytes ? ` / ${formatBytes(job.total_bytes)}` : ''}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(100, Math.max(0, job.progress_percent || 0))}%` }}
                        />
                      </div>
                    </div>
                    {job.saved_path && <p className="job-path">Saved: {job.saved_path}</p>}
                    {job.error_message && <p className="job-error">Error: {job.error_message}</p>}
                    <div className="job-actions">
                      {(job.status === 'running' || job.status === 'queued') && (
                        <>
                          <button type="button" className="btn ghost" onClick={() => pauseJob(job.id)}>
                            Pause
                          </button>
                          <button type="button" className="btn ghost" onClick={() => stopJob(job.id)}>
                            Stop
                          </button>
                        </>
                      )}
                      <button type="button" className="btn ghost" onClick={() => removeJob(job.id)}>
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </div>
          </>
        )}

        {error && <p className="error-banner">{error}</p>}
      </section>
    </main>
  );
}

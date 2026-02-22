import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  DownloadJob,
  DownloadStatus,
  FolderBrowseResponse,
  FolderEntry,
  FolderPreset,
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

function getPlexScanSummary(job: DownloadJob): string {
  if (job.plex_scan_status === 'success') {
    return 'Plex scan started';
  }
  if (job.plex_scan_status === 'failed') {
    return 'Plex scan failed';
  }
  if (job.plex_scan_status === 'requesting') {
    return 'Starting Plex scan...';
  }
  return 'Plex scan pending';
}

type NoticeKind = 'success' | 'warning';

interface UiNotice {
  id: string;
  kind: NoticeKind;
  message: string;
}

interface JobTelemetry {
  bytes: number;
  timestampMs: number;
  speedBps: number | null;
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

function formatSpeed(bytesPerSecond: number | null): string {
  if (!bytesPerSecond || bytesPerSecond <= 0) {
    return '—';
  }
  return `${formatBytes(bytesPerSecond)}/s`;
}

function formatEta(seconds: number | null): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) {
    return '—';
  }

  const rounded = Math.round(seconds);
  if (rounded < 60) {
    return `${rounded}s`;
  }
  if (rounded < 3600) {
    return `${Math.floor(rounded / 60)}m`;
  }
  if (rounded < 86400) {
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.round((rounded % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  const days = Math.floor(rounded / 86400);
  const hours = Math.round((rounded % 86400) / 3600);
  return `${days}d ${hours}h`;
}

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [accessKey, setAccessKey] = useState('');
  const [url, setUrl] = useState('');
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [presets, setPresets] = useState<FolderPreset[]>([]);
  const [selectedPresetPath, setSelectedPresetPath] = useState<string>('');
  const [customTargetPath, setCustomTargetPath] = useState<string>('');

  const [showBrowser, setShowBrowser] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [browseCurrentPath, setBrowseCurrentPath] = useState('');
  const [browseParentPath, setBrowseParentPath] = useState<string | null>(null);
  const [browseDirectories, setBrowseDirectories] = useState<FolderEntry[]>([]);

  const [jobSearch, setJobSearch] = useState('');
  const [notices, setNotices] = useState<UiNotice[]>([]);
  const [jobTelemetry, setJobTelemetry] = useState<Record<string, JobTelemetry>>({});
  const scanNoticeIdsRef = useRef<Set<string>>(new Set());

  const isAuthed = useMemo(() => Boolean(token), [token]);
  const presetByPath = useMemo(() => {
    const map = new Map<string, FolderPreset>();
    for (const preset of presets) {
      map.set(preset.path, preset);
    }
    return map;
  }, [presets]);
  const selectedPreset = selectedPresetPath ? presetByPath.get(selectedPresetPath) ?? null : null;
  const activeTarget = customTargetPath || selectedPresetPath;
  const activeTargetLabel = customTargetPath
    ? 'Custom folder'
    : selectedPreset?.label ?? (activeTarget ? 'Preset folder' : 'Select a folder');

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

  const pushNotice = (kind: NoticeKind, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotices((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setNotices((prev) => prev.filter((notice) => notice.id !== id));
    }, 7000);
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
        setSelectedPresetPath(presetResponse.presets[0]?.path ?? '');

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

  useEffect(() => {
    for (const job of jobs) {
      if (job.status !== 'success') {
        continue;
      }
      if (job.plex_scan_status !== 'success' && job.plex_scan_status !== 'failed') {
        continue;
      }
      if (!job.plex_scan_completed_at) {
        continue;
      }

      const completedAt = new Date(job.plex_scan_completed_at).getTime();
      if (Number.isNaN(completedAt) || Date.now() - completedAt > 60_000) {
        continue;
      }

      const key = `${job.id}:${job.plex_scan_status}`;
      if (scanNoticeIdsRef.current.has(key)) {
        continue;
      }
      scanNoticeIdsRef.current.add(key);

      const fileLabel = job.file_name || 'downloaded file';
      if (job.plex_scan_status === 'success') {
        pushNotice('success', `Plex scan launched for "${fileLabel}".`);
      } else {
        const details = job.plex_scan_message ? ` ${job.plex_scan_message}` : '';
        pushNotice('warning', `Download completed but Plex scan failed for "${fileLabel}".${details}`);
      }
    }
  }, [jobs]);

  useEffect(() => {
    setJobTelemetry((previous) => {
      const next: Record<string, JobTelemetry> = {};
      const fallbackNow = Date.now();

      for (const job of jobs) {
        const parsed = new Date(job.updated_at).getTime();
        const timestampMs = Number.isNaN(parsed) ? fallbackNow : parsed;
        const prior = previous[job.id];
        let speedBps = prior?.speedBps ?? null;

        if (job.status === 'running' && prior) {
          const deltaBytes = job.bytes_downloaded - prior.bytes;
          const deltaSeconds = (timestampMs - prior.timestampMs) / 1000;

          if (deltaBytes > 0 && deltaSeconds > 0.2) {
            const instantaneous = deltaBytes / deltaSeconds;
            speedBps = speedBps ? speedBps * 0.7 + instantaneous * 0.3 : instantaneous;
          } else if (deltaSeconds > 5 && deltaBytes <= 0 && speedBps) {
            speedBps *= 0.65;
          }
        } else if (job.status !== 'running') {
          speedBps = null;
        }

        next[job.id] = {
          bytes: job.bytes_downloaded,
          timestampMs,
          speedBps
        };
      }

      return next;
    });
  }, [jobs]);

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
    setPresets([]);
    setSelectedPresetPath('');
    setShowBrowser(false);
    setCustomTargetPath('');
    setStorage(null);
    setLastSyncedAt(null);
    setNotices([]);
    setJobTelemetry({});
    scanNoticeIdsRef.current.clear();
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

        {isAuthed && notices.length > 0 && (
          <aside className="notice-stack" aria-live="polite">
            {notices.map((notice) => (
              <article key={notice.id} className={`notice notice-${notice.kind}`}>
                <p>{notice.message}</p>
                <button
                  type="button"
                  className="notice-close"
                  onClick={() => setNotices((prev) => prev.filter((item) => item.id !== notice.id))}
                >
                  Dismiss
                </button>
              </article>
            ))}
          </aside>
        )}

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
              <form className="panel composer-panel" onSubmit={submitDownload}>
                <header className="panel-head">
                  <h2>New Download</h2>
                  <p className="panel-sub">Paste a 1fichier link and choose exactly where the file should land.</p>
                </header>

                <div className="active-destination">
                  <span>{activeTargetLabel}</span>
                  <code>{activeTarget || 'Select a folder'}</code>
                </div>

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
                    <select value={selectedPresetPath} onChange={(event) => setSelectedPresetPath(event.target.value)}>
                      {presets.length === 0 && <option value="">No preset available</option>}
                      {presets.map((preset) => (
                        <option key={preset.path} value={preset.path}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={async () => {
                        setShowBrowser(true);
                        await browsePath(customTargetPath || selectedPresetPath || undefined);
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
                    <p className="panel-sub">{filteredJobs.length} shown</p>
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

                  {filteredJobs.map((job) => {
                    const telemetry = jobTelemetry[job.id];
                    const speedBps = job.status === 'running' ? telemetry?.speedBps ?? null : null;
                    const remainingBytes =
                      typeof job.total_bytes === 'number' ? Math.max(0, job.total_bytes - job.bytes_downloaded) : null;
                    const etaSeconds =
                      job.status === 'running' && remainingBytes !== null && speedBps && speedBps > 0
                        ? remainingBytes / speedBps
                        : null;

                    return (
                      <article key={job.id} className={`job-card status-${job.status}`}>
                        <header className="job-top">
                          <p className="status-pill">{formatStatus(job.status)}</p>
                          <p className="job-time">{formatTime(job.updated_at)}</p>
                        </header>

                        {job.file_name && (
                          <p className="job-title" title={job.file_name}>
                            {job.file_name}
                          </p>
                        )}
                        {presetByPath.get(job.target_dir)?.label && (
                          <p className="job-destination">Preset: {presetByPath.get(job.target_dir)?.label}</p>
                        )}

                        <div className="progress-wrap">
                          <div className="progress-meta">
                            <span>{job.total_bytes ? `${job.progress_percent.toFixed(1)}%` : 'Streaming'}</span>
                            <span>
                              {formatBytes(job.bytes_downloaded)}
                              {job.total_bytes ? ` / ${formatBytes(job.total_bytes)}` : ''}
                            </span>
                          </div>
                          <div className={`progress-track status-${job.status}`}>
                            <div
                              className="progress-value"
                              style={{ width: `${Math.min(100, Math.max(0, job.progress_percent || 0))}%` }}
                            />
                          </div>
                          <div className="progress-submeta">
                            <span>Speed: {formatSpeed(speedBps)}</span>
                            <span>ETA: {formatEta(etaSeconds)}</span>
                          </div>
                        </div>

                        <p className={`plex-scan-pill scan-${job.plex_scan_status}`}>{getPlexScanSummary(job)}</p>
                        {job.plex_scan_message && <p className="plex-scan-note">{job.plex_scan_message}</p>}
                        {job.error_message && <p className="job-error">Error: {job.error_message}</p>}

                        <details className="job-details">
                          <summary>Show details</summary>
                          <div className="job-details-body">
                            <p className="job-target" title={job.source_url}>
                              Link: {job.source_url}
                            </p>
                            <p className="job-target" title={job.target_dir}>
                              Target: {job.target_dir}
                            </p>
                            {job.saved_path && (
                              <p className="job-target saved-path" title={job.saved_path}>
                                Saved: {job.saved_path}
                              </p>
                            )}
                          </div>
                        </details>

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
                    );
                  })}
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

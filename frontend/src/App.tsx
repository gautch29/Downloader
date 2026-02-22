import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DownloadJob, FolderBrowseResponse, FolderEntry, FolderPresetsResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api';

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

  const [presets, setPresets] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customTargetPath, setCustomTargetPath] = useState<string>('');

  const [showBrowser, setShowBrowser] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [browseCurrentPath, setBrowseCurrentPath] = useState('');
  const [browseParentPath, setBrowseParentPath] = useState<string | null>(null);
  const [browseDirectories, setBrowseDirectories] = useState<FolderEntry[]>([]);

  const isAuthed = useMemo(() => Boolean(token), [token]);
  const activeTarget = customTargetPath || selectedPreset;

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadInitialData = async () => {
      try {
        const [list, presetResponse, browse] = await Promise.all([
          api<DownloadJob[]>('/downloads', { method: 'GET' }, token),
          api<FolderPresetsResponse>('/folders/presets', { method: 'GET' }, token),
          api<FolderBrowseResponse>('/folders/browse', { method: 'GET' }, token)
        ]);

        setJobs(list);
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

    const poll = async () => {
      try {
        const list = await api<DownloadJob[]>('/downloads', { method: 'GET' }, token);
        setJobs(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    loadInitialData();
    const id = setInterval(poll, 5000);
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
      const list = await api<DownloadJob[]>('/downloads', { method: 'GET' }, token);
      setJobs(list);
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
  };

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
          <form className="stack" onSubmit={login}>
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
          <div className="content-grid">
            <form className="stack" onSubmit={submitDownload}>
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

              <button type="submit" className="btn primary">
                Queue download
              </button>
            </form>

            <section className="jobs">
              <h2>Recent Jobs</h2>
              {jobs.length === 0 && <p className="muted">No jobs yet.</p>}
              {jobs.map((job) => (
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
                </article>
              ))}
            </section>
          </div>
        )}

        {error && <p className="error-banner">{error}</p>}
      </section>
    </main>
  );
}

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DownloadJob, FolderBrowseResponse, FolderEntry, FolderPresetsResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api';

async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
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
  const effectiveTarget = customTargetPath || selectedPreset;

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
        body: JSON.stringify({ username, password })
      });
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      setPassword('');
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

    if (!effectiveTarget) {
      setError('Please select a destination folder.');
      return;
    }

    try {
      await api<DownloadJob>(
        '/downloads',
        {
          method: 'POST',
          body: JSON.stringify({ url, target_dir: effectiveTarget })
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
    setPresets([]);
    setSelectedPreset('');
    setCustomTargetPath('');
    setShowBrowser(false);
  };

  return (
    <main className="app-shell">
      <section className="panel">
        <header className="hero">
          <p className="eyebrow">Private automation</p>
          <h1>Plex Movie Drop</h1>
          <p className="subtitle">Paste a 1fichier link, choose destination folder, then auto-refresh Plex.</p>
        </header>

        {!isAuthed ? (
          <form className="grid" onSubmit={login}>
            <label>
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button type="submit">Sign In</button>
          </form>
        ) : (
          <>
            <form className="grid" onSubmit={submitDownload}>
              <label>
                1fichier URL
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
                <div className="destination-row">
                  <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
                    {presets.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ghost"
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
                <div className="custom-target-row">
                  <p className="current-path">Custom target: {customTargetPath}</p>
                  <button type="button" className="ghost" onClick={() => setCustomTargetPath('')}>
                    Use preset instead
                  </button>
                </div>
              )}

              {showBrowser && (
                <section className="browser-wrap">
                  <div className="browser-actions">
                    <button type="button" className="ghost" onClick={() => browsePath()}>
                      Root
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => browseParentPath && browsePath(browseParentPath)}
                      disabled={!browseParentPath}
                    >
                      Parent
                    </button>
                    <button type="button" className="ghost" onClick={() => setShowBrowser(false)}>
                      Close
                    </button>
                  </div>

                  <p className="current-path">Browsing: {browseCurrentPath}</p>

                  <div className="folder-grid">
                    {browseDirectories.map((folder) => (
                      <button
                        key={folder.path}
                        type="button"
                        className="folder-item"
                        onClick={() => browsePath(folder.path)}
                      >
                        {folder.name}
                      </button>
                    ))}
                  </div>

                  <div className="browser-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTargetPath(browseCurrentPath);
                        setShowBrowser(false);
                      }}
                    >
                      Select current folder
                    </button>
                  </div>

                  <div className="destination-row">
                    <input
                      placeholder="New folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                    <button type="button" className="ghost" onClick={createFolder}>
                      Create
                    </button>
                  </div>
                </section>
              )}

              <div className="actions">
                <button type="submit">Queue Download</button>
                <button type="button" className="ghost" onClick={logout}>
                  Sign Out
                </button>
              </div>
            </form>

            <div className="jobs">
              {jobs.length === 0 && <p className="empty">No jobs yet.</p>}
              {jobs.map((job) => (
                <article key={job.id} className={`job ${job.status}`}>
                  <p className="status">{job.status.toUpperCase()}</p>
                  <p className="url">{job.source_url}</p>
                  <p className="saved">Target: {job.target_dir}</p>
                  {job.saved_path && <p className="saved">Saved: {job.saved_path}</p>}
                  {job.error_message && <p className="error">Error: {job.error_message}</p>}
                </article>
              ))}
            </div>
          </>
        )}

        {error && <p className="error-banner">{error}</p>}
      </section>
    </main>
  );
}

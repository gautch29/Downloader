import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DownloadJob } from './types';

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

  const isAuthed = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const poll = async () => {
      try {
        const list = await api<DownloadJob[]>('/downloads', { method: 'GET' }, token);
        setJobs(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [token]);

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

    try {
      await api<DownloadJob>(
        '/downloads',
        {
          method: 'POST',
          body: JSON.stringify({ url })
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
  };

  return (
    <main className="app-shell">
      <section className="panel">
        <header className="hero">
          <p className="eyebrow">Private automation</p>
          <h1>Plex Movie Drop</h1>
          <p className="subtitle">Paste a 1fichier link, download straight into your movie folder, then auto-refresh Plex.</p>
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

export type DownloadStatus = 'queued' | 'running' | 'success' | 'failed';

export interface DownloadJob {
  id: string;
  source_url: string;
  saved_path: string | null;
  status: DownloadStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type DownloadStatus = 'queued' | 'running' | 'success' | 'failed' | 'paused' | 'canceled';

export interface DownloadJob {
  id: string;
  source_url: string;
  target_dir: string;
  file_name: string | null;
  saved_path: string | null;
  bytes_downloaded: number;
  total_bytes: number | null;
  progress_percent: number;
  status: DownloadStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderEntry {
  name: string;
  path: string;
}

export interface FolderBrowseResponse {
  current_path: string;
  parent_path: string | null;
  directories: FolderEntry[];
}

export interface FolderPresetsResponse {
  presets: string[];
}

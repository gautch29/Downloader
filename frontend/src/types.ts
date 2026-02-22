export type DownloadStatus = 'queued' | 'running' | 'success' | 'failed';

export interface DownloadJob {
  id: string;
  source_url: string;
  target_dir: string;
  saved_path: string | null;
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

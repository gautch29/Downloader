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
  plex_scan_status: 'not_requested' | 'requesting' | 'success' | 'failed';
  plex_scan_message: string | null;
  plex_scan_requested_at: string | null;
  plex_scan_completed_at: string | null;
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
  presets: FolderPreset[];
}

export interface FolderPreset {
  label: string;
  path: string;
}

export interface StorageStatus {
  path: string;
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
}

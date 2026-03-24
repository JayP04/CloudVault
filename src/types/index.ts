// ─── Database Row Types ─────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  auth_provider: "google" | "apple" | "email";
  created_at: string;
  last_login_at: string | null;
  is_active: boolean;
  storage_quota_bytes: number;
  storage_used_bytes: number;
  total_files: number;
  image_count: number;
  video_count: number;
  preferences: UserPreferences;
  updated_at: string;
};

export type UserPreferences = {
  theme: "light" | "dark" | "system";
  grid_density: "compact" | "comfortable" | "spacious";
  sort_order: "newest" | "oldest";
};

export type FileRecord = {
  id: string;
  owner_id: string;
  storage_key: string;
  thumbnail_key: string | null;
  original_filename: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  blur_hash: string | null;
  is_favorite: boolean;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  original_created_at: string | null;
  effective_date: string;
  uploaded_at: string;
  deleted_at: string | null;
};

export type Album = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  cover_file_id: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
};

export type AlbumItem = {
  id: string;
  album_id: string;
  file_id: string;
  sort_order: number;
  added_at: string;
};

export type SharedLink = {
  id: string;
  owner_id: string;
  token: string;
  link_type: "file" | "album";
  file_id: string | null;
  album_id: string | null;
  expires_at: string | null;
  password_hash: string | null;
  max_views: number | null;
  view_count: number;
  is_active: boolean;
  created_at: string;
};

export type ImportSource = {
  id: string;
  user_id: string;
  provider: "google_photos" | "icloud" | "dropbox" | "onedrive";
  provider_account_id: string | null;
  provider_email: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  is_connected: boolean;
  last_sync_at: string | null;
  created_at: string;
};

export type ImportJob = {
  id: string;
  user_id: string;
  source_id: string;
  status: "pending" | "running" | "paused" | "completed" | "failed";
  total_items: number | null;
  processed_items: number;
  failed_items: number;
  bytes_imported: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
};

// ─── API Types ──────────────────────────────────────────────────────────────

export type UploadRequestPayload = {
  filename: string;
  mime_type: string;
  file_size: number;
  exif_date: string | null;
  width: number | null;
  height: number | null;
  location_lat: number | null;
  location_lng: number | null;
};

export type UploadRequestResponse = {
  upload_url: string;
  file_id: string;
  storage_key: string;
  thumbnail_keys: {
    sm: string;
    md: string;
  };
};

export type UploadConfirmPayload = {
  file_id: string;
  storage_key: string;
  thumbnail_key: string | null;
  blur_hash: string | null;
  metadata: {
    original_filename: string;
    mime_type: string;
    file_size: number;
    width: number | null;
    height: number | null;
    original_created_at: string | null;
    effective_date: string;
    location_lat: number | null;
    location_lng: number | null;
  };
};

export type BatchUrlsPayload = {
  file_ids: string[];
  size: "sm" | "md" | "full";
};

export type BatchUrlsResponse = {
  urls: Record<string, string>;
};

export type PaginatedResponse<T> = {
  data: T[];
  cursor: string | null;
  has_more: boolean;
};

export type ApiError = {
  error: string;
  code?: string;
};

// ─── Component Props Types ──────────────────────────────────────────────────

export type TimelineView = "all" | "days" | "months" | "years";

export type FileWithUrl = FileRecord & {
  thumbnail_url?: string;
};

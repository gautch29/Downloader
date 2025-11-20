CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plex_url` text,
	`plex_token` text,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

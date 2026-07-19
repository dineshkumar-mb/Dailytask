CREATE TABLE `task_embeddings` (
	`task_id` text PRIMARY KEY NOT NULL,
	`embedding` text NOT NULL,
	`content_hash` text NOT NULL,
	`model` text DEFAULT 'text-embedding-004' NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_memories` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`embedding` text,
	`type` text NOT NULL,
	`importance` real DEFAULT 1 NOT NULL,
	`access_count` integer DEFAULT 0 NOT NULL,
	`last_accessed_at` integer,
	`source` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `semantic_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`query_hash` text NOT NULL,
	`query_embedding` text NOT NULL,
	`response` text NOT NULL,
	`hit_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`expires_at` integer NOT NULL
);

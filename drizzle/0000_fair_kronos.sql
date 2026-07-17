CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`type` text NOT NULL,
	`uri` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`sync_status` text DEFAULT 'LOCAL' NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`icon` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`sync_status` text DEFAULT 'LOCAL' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subtasks` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`completed_at` integer,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`sync_status` text DEFAULT 'LOCAL' NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`sync_status` text DEFAULT 'LOCAL' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_tags` (
	`task_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category_id` text,
	`priority` text DEFAULT 'Medium' NOT NULL,
	`due_date` integer,
	`reminder_date` integer,
	`estimated_minutes` integer,
	`actual_minutes` integer,
	`recurrence_frequency` text,
	`recurrence_interval` integer,
	`notes` text,
	`completed` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`completed_at` integer,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`sync_status` text DEFAULT 'LOCAL' NOT NULL,
	`device_id` text
);

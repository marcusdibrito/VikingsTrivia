CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`position` integer NOT NULL,
	`answer_text` text,
	`answer_number` integer,
	`correct` integer,
	`points_awarded` integer,
	`locked_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_answer_per_attempt_position` ON `answers` (`attempt_id`,`position`);--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`daily_game_id` text NOT NULL,
	`state` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`score` integer,
	`correct_count` integer,
	`pin_guess` integer,
	`pin_distance` integer,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`daily_game_id`) REFERENCES `daily_games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_attempt_per_player_game` ON `attempts` (`player_id`,`daily_game_id`);--> statement-breakpoint
CREATE TABLE `daily_game_questions` (
	`daily_game_id` text NOT NULL,
	`position` integer NOT NULL,
	`source_question_id` text NOT NULL,
	`snapshot` text NOT NULL,
	PRIMARY KEY(`daily_game_id`, `position`),
	FOREIGN KEY (`daily_game_id`) REFERENCES `daily_games`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `daily_games` (
	`id` text PRIMARY KEY NOT NULL,
	`game_date` text NOT NULL,
	`timezone` text DEFAULT 'America/New_York' NOT NULL,
	`host_name` text NOT NULL,
	`status` text NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_games_game_date_unique` ON `daily_games` (`game_date`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`device_token_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_device_token_hash_unique` ON `players` (`device_token_hash`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`canonical_answer` text NOT NULL,
	`accepted_answers` text NOT NULL,
	`format` text NOT NULL,
	`choices` text,
	`difficulty` integer NOT NULL,
	`points` integer NOT NULL,
	`era` text NOT NULL,
	`explanation` text NOT NULL,
	`source_url` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);

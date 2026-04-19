CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'spending' NOT NULL,
	`opening_balance` integer DEFAULT 0 NOT NULL,
	`opening_balance_as_of_month` text NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_savings_unique_idx` ON `accounts` (`role`) WHERE "accounts"."archived_at" IS NULL AND "accounts"."role" = 'savings';--> statement-breakpoint
CREATE INDEX `accounts_archived_idx` ON `accounts` (`archived_at`);--> statement-breakpoint
CREATE TABLE `expense_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month_id` text NOT NULL,
	`amount` integer NOT NULL,
	`label` text NOT NULL,
	`category` text,
	`source_account_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`month_id`) REFERENCES `months`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `expense_month_idx` ON `expense_items` (`month_id`);--> statement-breakpoint
CREATE INDEX `expense_account_idx` ON `expense_items` (`source_account_id`);--> statement-breakpoint
CREATE INDEX `expense_category_idx` ON `expense_items` (`category`);--> statement-breakpoint
CREATE TABLE `fixed_template_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`kind` text NOT NULL,
	`amount` integer NOT NULL,
	`label` text NOT NULL,
	`category` text,
	`account_id` integer NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `fixed_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `template_items_template_idx` ON `fixed_template_items` (`template_id`);--> statement-breakpoint
CREATE TABLE `fixed_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `income_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month_id` text NOT NULL,
	`amount` integer NOT NULL,
	`label` text NOT NULL,
	`destination_account_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`month_id`) REFERENCES `months`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`destination_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `income_month_idx` ON `income_items` (`month_id`);--> statement-breakpoint
CREATE INDEX `income_account_idx` ON `income_items` (`destination_account_id`);--> statement-breakpoint
CREATE TABLE `months` (
	`id` text(7) PRIMARY KEY NOT NULL,
	`note` text,
	`closed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `months_closed_idx` ON `months` (`closed_at`);
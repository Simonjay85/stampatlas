CREATE TABLE `blogArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(180) NOT NULL,
	`summary` varchar(500) NOT NULL,
	`bodyMarkdown` text NOT NULL,
	`cluster` varchar(80) NOT NULL,
	`status` enum('draft','in_review','published','archived') NOT NULL DEFAULT 'draft',
	`seoTitle` varchar(180) NOT NULL,
	`seoDescription` varchar(320) NOT NULL,
	`canonicalUrl` text,
	`sourceReferencesJson` text NOT NULL,
	`authorUserId` int,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`publishedByUserId` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blogArticles_id` PRIMARY KEY(`id`),
	CONSTRAINT `blogArticles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `blogArticles` ADD CONSTRAINT `blogArticles_authorUserId_users_id_fk` FOREIGN KEY (`authorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blogArticles` ADD CONSTRAINT `blogArticles_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blogArticles` ADD CONSTRAINT `blogArticles_publishedByUserId_users_id_fk` FOREIGN KEY (`publishedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `blog_article_status_published_idx` ON `blogArticles` (`status`,`publishedAt`);--> statement-breakpoint
CREATE INDEX `blog_article_cluster_published_idx` ON `blogArticles` (`cluster`,`publishedAt`);
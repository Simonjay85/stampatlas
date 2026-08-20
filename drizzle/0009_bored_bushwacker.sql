CREATE TABLE `identificationScans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topCandidateSlug` varchar(160),
	`candidateSlugs` text NOT NULL,
	`status` enum('reviewed','needs_research','dismissed') NOT NULL DEFAULT 'needs_research',
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `identificationScans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `identificationScans` ADD CONSTRAINT `identificationScans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `identification_scan_user_idx` ON `identificationScans` (`userId`,`createdAt`);
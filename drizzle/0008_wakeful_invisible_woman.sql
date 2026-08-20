CREATE TABLE `collectorProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`username` varchar(48) NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`bio` text,
	`avatarUrl` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collectorProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `collectorProfiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `collectorProfiles_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `albums` ADD `visibility` enum('private','public') DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `collectorProfiles` ADD CONSTRAINT `collectorProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `collector_profile_public_idx` ON `collectorProfiles` (`isPublic`,`username`);
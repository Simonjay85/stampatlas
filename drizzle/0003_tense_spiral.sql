CREATE TABLE `publishedExternalStamps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalStampRecordId` int NOT NULL,
	`slug` varchar(180) NOT NULL,
	`publishedByUserId` int,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publishedExternalStamps_id` PRIMARY KEY(`id`),
	CONSTRAINT `publishedExternalStamps_externalStampRecordId_unique` UNIQUE(`externalStampRecordId`),
	CONSTRAINT `publishedExternalStamps_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `publishedExternalStamps` ADD CONSTRAINT `pub_ext_record_fk` FOREIGN KEY (`externalStampRecordId`) REFERENCES `externalStampRecords`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publishedExternalStamps` ADD CONSTRAINT `pub_ext_user_fk` FOREIGN KEY (`publishedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `published_external_published_idx` ON `publishedExternalStamps` (`publishedAt`);

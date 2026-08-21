CREATE TABLE `externalStampMetadataHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalStampRecordId` int NOT NULL,
	`changedByUserId` int,
	`previousCountry` varchar(160),
	`nextCountry` varchar(160),
	`previousEraDecade` varchar(16),
	`nextEraDecade` varchar(16),
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `externalStampMetadataHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `momentCollectionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`momentCollectionId` int NOT NULL,
	`momentId` int NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `momentCollectionItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `moment_collection_item_unique` UNIQUE(`momentCollectionId`,`momentId`)
);
--> statement-breakpoint
CREATE TABLE `momentCollections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`coverMediaUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `momentCollections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `momentMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`momentId` int NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`mediaUrl` text NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`caption` varchar(280),
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `momentMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `momentTagAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`momentId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `momentTagAssignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `moment_tag_assignment_unique` UNIQUE(`momentId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `momentTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(60) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `momentTags_id` PRIMARY KEY(`id`),
	CONSTRAINT `moment_tag_user_name_unique` UNIQUE(`userId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `moments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`note` text NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`locationLabel` varchar(255),
	`mood` varchar(40),
	`visibility` enum('private','shared_link') NOT NULL DEFAULT 'private',
	`isFavorite` boolean NOT NULL DEFAULT false,
	`shareToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moments_id` PRIMARY KEY(`id`),
	CONSTRAINT `moments_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','reviewer','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `externalStampRecords` ADD `lastUpdatedByUserId` int;--> statement-breakpoint
ALTER TABLE `externalStampMetadataHistory` ADD CONSTRAINT `esth_record_fk` FOREIGN KEY (`externalStampRecordId`) REFERENCES `externalStampRecords`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `externalStampMetadataHistory` ADD CONSTRAINT `esth_user_fk` FOREIGN KEY (`changedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `momentCollectionItems` ADD CONSTRAINT `mci_collection_fk` FOREIGN KEY (`momentCollectionId`) REFERENCES `momentCollections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `momentCollectionItems` ADD CONSTRAINT `mci_moment_fk` FOREIGN KEY (`momentId`) REFERENCES `moments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `momentCollections` ADD CONSTRAINT `mcollections_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `momentMedia` ADD CONSTRAINT `mmedia_moment_fk` FOREIGN KEY (`momentId`) REFERENCES `moments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `momentTagAssignments` ADD CONSTRAINT `mtags_moment_fk` FOREIGN KEY (`momentId`) REFERENCES `moments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `momentTagAssignments` ADD CONSTRAINT `mtags_tag_fk` FOREIGN KEY (`tagId`) REFERENCES `momentTags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `momentTags` ADD CONSTRAINT `mtag_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moments` ADD CONSTRAINT `moments_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `metadata_history_record_changed_idx` ON `externalStampMetadataHistory` (`externalStampRecordId`,`changedAt`);--> statement-breakpoint
CREATE INDEX `moment_collection_position_idx` ON `momentCollectionItems` (`momentCollectionId`,`position`);--> statement-breakpoint
CREATE INDEX `moment_collections_user_updated_idx` ON `momentCollections` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `moment_media_moment_position_idx` ON `momentMedia` (`momentId`,`position`);--> statement-breakpoint
CREATE INDEX `moments_user_occurred_idx` ON `moments` (`userId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `moments_user_updated_idx` ON `moments` (`userId`,`updatedAt`);--> statement-breakpoint
ALTER TABLE `externalStampRecords` ADD CONSTRAINT `esr_last_updated_fk` FOREIGN KEY (`lastUpdatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `external_record_last_updated_idx` ON `externalStampRecords` (`lastUpdatedByUserId`,`updatedAt`);

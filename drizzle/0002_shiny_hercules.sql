CREATE TABLE `externalImportJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(64) NOT NULL,
	`query` varchar(500) NOT NULL,
	`status` enum('queued','completed','failed') NOT NULL DEFAULT 'queued',
	`requestedByUserId` int,
	`receivedCount` int NOT NULL DEFAULT 0,
	`stagedCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `externalImportJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `externalStampAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalStampRecordId` int NOT NULL,
	`providerAssetId` varchar(255) NOT NULL,
	`mediaUrl` text NOT NULL,
	`previewUrl` text,
	`mimeType` varchar(120),
	`creator` text,
	`attribution` text,
	`rightsLabel` varchar(255),
	`rightsUrl` text,
	`reuseStatus` enum('public_domain','cc_by','permission_granted','metadata_only','needs_review','blocked') NOT NULL DEFAULT 'needs_review',
	`sourceRetrievedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `externalStampAssets_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_asset_record_provider_unique` UNIQUE(`externalStampRecordId`,`providerAssetId`)
);
--> statement-breakpoint
CREATE TABLE `externalStampRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importJobId` int,
	`provider` varchar(64) NOT NULL,
	`sourceRecordId` varchar(255) NOT NULL,
	`canonicalUrl` text NOT NULL,
	`title` varchar(500) NOT NULL,
	`country` varchar(160),
	`issueDate` varchar(64),
	`denomination` varchar(80),
	`description` text,
	`reuseStatus` enum('public_domain','cc_by','permission_granted','metadata_only','needs_review','blocked') NOT NULL DEFAULT 'needs_review',
	`rightsLabel` varchar(255),
	`rightsUrl` text,
	`attribution` text,
	`reviewStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewNote` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`sourcePayload` text NOT NULL,
	`sourceRetrievedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `externalStampRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_record_provider_source_unique` UNIQUE(`provider`,`sourceRecordId`)
);
--> statement-breakpoint
ALTER TABLE `externalImportJobs` ADD CONSTRAINT `ext_job_user_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `externalStampAssets` ADD CONSTRAINT `ext_asset_record_fk` FOREIGN KEY (`externalStampRecordId`) REFERENCES `externalStampRecords`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `externalStampRecords` ADD CONSTRAINT `ext_record_job_fk` FOREIGN KEY (`importJobId`) REFERENCES `externalImportJobs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `externalStampRecords` ADD CONSTRAINT `ext_record_reviewer_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `external_jobs_provider_started_idx` ON `externalImportJobs` (`provider`,`startedAt`);--> statement-breakpoint
CREATE INDEX `external_record_review_idx` ON `externalStampRecords` (`reviewStatus`,`provider`);

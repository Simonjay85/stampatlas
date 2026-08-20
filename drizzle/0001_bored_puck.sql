CREATE TABLE `albumItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`albumId` int NOT NULL,
	`collectionItemId` int NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `albumItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `album_item_unique` UNIQUE(`albumId`,`collectionItemId`)
);
--> statement-breakpoint
CREATE TABLE `albums` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`coverStampSlug` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `albums_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collectionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stampSlug` varchar(160) NOT NULL,
	`condition` enum('Mint','Fine used','Used','FDC') NOT NULL DEFAULT 'Mint',
	`purchasePrice` decimal(10,2) NOT NULL DEFAULT '0',
	`acquiredAt` date NOT NULL,
	`notes` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collectionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `albumItems` ADD CONSTRAINT `albumItems_albumId_albums_id_fk` FOREIGN KEY (`albumId`) REFERENCES `albums`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `albumItems` ADD CONSTRAINT `albumItems_collectionItemId_collectionItems_id_fk` FOREIGN KEY (`collectionItemId`) REFERENCES `collectionItems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `albums` ADD CONSTRAINT `albums_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collectionItems` ADD CONSTRAINT `collectionItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `album_position_idx` ON `albumItems` (`albumId`,`position`);--> statement-breakpoint
CREATE INDEX `albums_user_updated_idx` ON `albums` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `collection_user_created_idx` ON `collectionItems` (`userId`,`createdAt`);
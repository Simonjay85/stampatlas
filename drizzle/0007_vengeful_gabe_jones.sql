ALTER TABLE `collectionItems` ADD `quantity` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `collectionItems` ADD `collectionStatus` enum('owned','wishlist','duplicate','swap') DEFAULT 'owned' NOT NULL;--> statement-breakpoint
ALTER TABLE `collectionItems` ADD `grade` enum('superb','very_fine','fine','average','damaged','ungraded') DEFAULT 'ungraded' NOT NULL;--> statement-breakpoint
ALTER TABLE `collectionItems` ADD `acquisitionSource` varchar(255);--> statement-breakpoint
ALTER TABLE `collectionItems` ADD `storageLocation` varchar(255);--> statement-breakpoint
ALTER TABLE `collectionItems` ADD `albumPage` int;--> statement-breakpoint
ALTER TABLE `collectionItems` ADD `customTags` text;--> statement-breakpoint
ALTER TABLE `collectionItems` ADD `frontImageUrl` text;--> statement-breakpoint
ALTER TABLE `collectionItems` ADD `backImageUrl` text;
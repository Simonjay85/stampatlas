ALTER TABLE `externalStampRecords` ADD `normalizedCountry` varchar(160);--> statement-breakpoint
ALTER TABLE `externalStampRecords` ADD `eraDecade` varchar(16);--> statement-breakpoint
ALTER TABLE `externalStampRecords` ADD `classificationMethod` enum('source_metadata','heuristic','unclassified') DEFAULT 'unclassified' NOT NULL;--> statement-breakpoint
ALTER TABLE `externalStampRecords` ADD `classificationConfidence` int DEFAULT 0 NOT NULL;
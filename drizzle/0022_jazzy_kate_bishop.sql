CREATE TABLE `crm_email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL DEFAULT 'geral',
	`subject` varchar(500) NOT NULL,
	`htmlContent` text NOT NULL,
	`variables` text,
	`isDefault` int NOT NULL DEFAULT 0,
	`active` int NOT NULL DEFAULT 1,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_workflow_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`triggerData` text NOT NULL,
	`success` int NOT NULL DEFAULT 1,
	`resultMessage` text,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_workflow_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_workflow_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerType` varchar(100) NOT NULL,
	`conditions` text NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`actionParams` text NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`priority` int NOT NULL DEFAULT 0,
	`executionCount` int NOT NULL DEFAULT 0,
	`lastExecutedAt` timestamp,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_workflow_rules_id` PRIMARY KEY(`id`)
);

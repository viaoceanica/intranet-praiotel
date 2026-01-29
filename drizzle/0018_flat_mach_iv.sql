CREATE TABLE `crm_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('chamada','email','reuniao','nota','tarefa_concluida') NOT NULL,
	`leadId` int,
	`opportunityId` int,
	`clientId` int,
	`subject` varchar(255) NOT NULL,
	`description` text,
	`outcome` varchar(100),
	`duration` int,
	`userId` int NOT NULL,
	`activityDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_campaign_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`leadId` int,
	`clientId` int,
	`status` enum('pendente','enviado','aberto','clicado','bounce','erro') NOT NULL DEFAULT 'pendente',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`bouncedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_campaign_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('email','newsletter','evento','webinar','outro') NOT NULL,
	`status` enum('rascunho','agendada','em_envio','enviada','cancelada') NOT NULL DEFAULT 'rascunho',
	`subject` varchar(255),
	`emailContent` text,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`totalRecipients` int NOT NULL DEFAULT 0,
	`sentCount` int NOT NULL DEFAULT 0,
	`openedCount` int NOT NULL DEFAULT 0,
	`clickedCount` int NOT NULL DEFAULT 0,
	`bouncedCount` int NOT NULL DEFAULT 0,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('proposta','contrato','apresentacao','outro') NOT NULL,
	`leadId` int,
	`opportunityId` int,
	`clientId` int,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` varchar(1000) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`previousVersionId` int,
	`uploadedById` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(255),
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`jobTitle` varchar(100),
	`source` varchar(100) NOT NULL,
	`status` enum('novo','contactado','qualificado','nao_qualificado','convertido') NOT NULL DEFAULT 'novo',
	`score` int NOT NULL DEFAULT 0,
	`budget` decimal(10,2),
	`timeline` varchar(100),
	`needs` text,
	`assignedToId` int,
	`convertedToClientId` int,
	`convertedToOpportunityId` int,
	`convertedAt` timestamp,
	`notes` text,
	`lastContactedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`leadId` int,
	`clientId` int,
	`value` decimal(10,2) NOT NULL,
	`probability` int NOT NULL DEFAULT 50,
	`stage` enum('prospeccao','qualificacao','proposta','negociacao','fechamento') NOT NULL DEFAULT 'prospeccao',
	`status` enum('aberta','ganha','perdida','cancelada') NOT NULL DEFAULT 'aberta',
	`assignedToId` int NOT NULL,
	`expectedCloseDate` date,
	`actualCloseDate` date,
	`lostReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_opportunity_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`fromStage` enum('prospeccao','qualificacao','proposta','negociacao','fechamento'),
	`toStage` enum('prospeccao','qualificacao','proposta','negociacao','fechamento') NOT NULL,
	`changedById` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_opportunity_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `crm_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('chamada','email','reuniao','follow_up','outro') NOT NULL,
	`leadId` int,
	`opportunityId` int,
	`clientId` int,
	`assignedToId` int NOT NULL,
	`status` enum('pendente','em_progresso','concluida','cancelada') NOT NULL DEFAULT 'pendente',
	`priority` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
	`dueDate` timestamp NOT NULL,
	`completedAt` timestamp,
	`reminderMinutes` int DEFAULT 30,
	`reminderSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_tasks_id` PRIMARY KEY(`id`)
);

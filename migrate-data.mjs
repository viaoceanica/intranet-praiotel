import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Ler .env para obter DATABASE_URL atual (Manus)
dotenv.config();

const SOURCE_URL = 'mysql://3cVh5zkX4ywvzHG.ac4e076b265a:4YmiWoN8iKgzncA317x8@gateway03.us-east-1.prod.aws.tidbcloud.com:4000/Ws6J3kt3aUuWjo2DPX89FU?ssl={"rejectUnauthorized":true}';
const TARGET_URL = 'mysql://viaoceanica:JUpcZ8-2a7D-@api.viaoceanica.com:3306/praiotel';

// Tabelas a migrar (por ordem para respeitar dependências)
const TABLES = [
  'users',
  'custom_roles',
  'clients',
  'clientEmails',
  'equipment',
  'serviceTypes',
  'slaConfig',
  'serviceTypeAlertThresholds',
  'prioritizationRules',
  'tickets',
  'ticketHistory',
  'attachments',
  'notifications',
  'password_reset_tokens',
  'priorityChangeLog',
  'response_templates',
  'system_settings',
  'quick_access',
  'user_menu_order',
  'user_audit_log',
  'internal_news',
  'announcements',
  'bulletin_messages',
  'bulletin_likes',
  'documents',
  'document_categories',
  'favorites',
  'tags',
  'knowledge_articles',
  'knowledge_categories',
  'article_comments',
  'article_reads',
  'article_tags',
  'email_logs',
  'commercial_clients',
  'crm_leads',
  'crm_opportunities',
  'crm_opportunity_history',
  'crm_activities',
  'crm_tasks',
  'crm_campaigns',
  'crm_campaign_contacts',
  'crm_documents',
  'crm_email_templates',
  'crm_settings',
  'crm_workflow_rules',
  'crm_workflow_logs',
];

async function migrateTable(source, target, table) {
  try {
    const [rows] = await source.execute(`SELECT * FROM \`${table}\``);
    if (rows.length === 0) {
      console.log(`  ⏭️  ${table}: vazia, a saltar`);
      return 0;
    }

    // Inserir em lotes de 100
    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const cols = Object.keys(batch[0]).map(c => `\`${c}\``).join(', ');
      const placeholders = batch.map(r => `(${Object.keys(r).map(() => '?').join(', ')})`).join(', ');
      const values = batch.flatMap(r => Object.values(r));
      await target.execute(
        `INSERT IGNORE INTO \`${table}\` (${cols}) VALUES ${placeholders}`,
        values
      );
      inserted += batch.length;
    }
    console.log(`  ✅ ${table}: ${inserted} registos migrados`);
    return inserted;
  } catch (e) {
    console.error(`  ❌ ${table}: ${e.message}`);
    return 0;
  }
}

async function main() {
  console.log('🔄 A iniciar migração de dados...\n');
  console.log('Origem:', SOURCE_URL?.replace(/:([^:@]+)@/, ':****@'));
  console.log('Destino:', TARGET_URL.replace(/:([^:@]+)@/, ':****@'));
  console.log('');

  const source = await mysql.createConnection(SOURCE_URL);
  const target = await mysql.createConnection(TARGET_URL);

  // Desativar verificação de chaves estrangeiras no destino
  await target.execute('SET FOREIGN_KEY_CHECKS = 0');

  let total = 0;
  for (const table of TABLES) {
    total += await migrateTable(source, target, table);
  }

  // Reativar verificação de chaves estrangeiras
  await target.execute('SET FOREIGN_KEY_CHECKS = 1');

  await source.end();
  await target.end();

  console.log(`\n✅ Migração concluída! Total de registos migrados: ${total}`);
}

main().catch(console.error);

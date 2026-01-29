import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { clients } from './drizzle/schema.js';
import { isNotNull } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🔍 Consultando clientes criados via CRM...\n');

const crmClients = await db.select().from(clients).where(isNotNull(clients.source));

console.log(`✅ Encontrados ${crmClients.length} clientes CRM:\n`);

crmClients.forEach((client, index) => {
  console.log(`${index + 1}. ${client.designation}`);
  console.log(`   Email: ${client.primaryEmail}`);
  console.log(`   NIF: ${client.nif}`);
  console.log(`   Source: ${client.source}`);
  console.log(`   Lead ID: ${client.leadId || 'N/A'}`);
  console.log(`   Criado em: ${client.createdAt}`);
  console.log('');
});

await connection.end();

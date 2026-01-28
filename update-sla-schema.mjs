import { drizzle } from 'drizzle-orm/mysql2';
import { slaConfig } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

const updates = [
  { priority: 'baixa', displayName: 'Baixa', isCustom: 0 },
  { priority: 'media', displayName: 'Média', isCustom: 0 },
  { priority: 'alta', displayName: 'Alta', isCustom: 0 },
  { priority: 'urgente', displayName: 'Urgente', isCustom: 0 },
];

for (const update of updates) {
  await db.update(slaConfig)
    .set({ displayName: update.displayName, isCustom: update.isCustom })
    .where(eq(slaConfig.priority, update.priority));
  console.log(\`Updated \${update.priority}\`);
}

console.log('SLA schema migration completed');
process.exit(0);

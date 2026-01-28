import { drizzle } from "drizzle-orm/mysql2";
import { slaConfig } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const defaultSlaConfig = [
  { priority: "urgente", responseTimeHours: 4, resolutionTimeHours: 24 },
  { priority: "alta", responseTimeHours: 24, resolutionTimeHours: 72 },
  { priority: "media", responseTimeHours: 48, resolutionTimeHours: 120 },
  { priority: "baixa", responseTimeHours: 72, resolutionTimeHours: 168 },
];

for (const config of defaultSlaConfig) {
  await db.insert(slaConfig).values(config).onDuplicateKeyUpdate({ set: config });
}

console.log("✅ Configurações SLA padrão inseridas com sucesso");
process.exit(0);

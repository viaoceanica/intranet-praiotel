import bcrypt from 'bcrypt';
import pg from 'pg';

const { Client } = pg;

// Obter DATABASE_URL do ambiente
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não encontrada');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  
  // Gerar hash para Admin@2024
  const passwordHash = await bcrypt.hash('Admin@2024', 10);
  
  // Atualizar ou inserir admin
  const result = await client.query(`
    INSERT INTO users (name, email, role, "passwordHash", active, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE
    SET "passwordHash" = $4, active = $5, "updatedAt" = NOW()
    RETURNING id, name, email, role
  `, ['Administrador', 'admin@praiotel.pt', 'admin', passwordHash, true]);
  
  console.log('Utilizador criado/atualizado:', result.rows[0]);
  
} catch (error) {
  console.error('Erro:', error.message);
} finally {
  await client.end();
}

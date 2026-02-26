import bcrypt from 'bcrypt';
import pg from 'pg';

const { Client } = pg;

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
  console.log('Conectado à base de dados');
  
  // Gerar hash para password de teste
  const passwordHash = await bcrypt.hash('Test@2024', 10);
  
  // Criar utilizador admin de teste
  const result = await client.query(`
    INSERT INTO users (name, email, role, "passwordHash", active, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE
    SET "passwordHash" = $4, active = $5, "updatedAt" = NOW()
    RETURNING id, name, email, role
  `, ['Admin Teste', 'test@praiotel.pt', 'admin', passwordHash, true]);
  
  console.log('✅ Utilizador criado/atualizado:', result.rows[0]);
  console.log('📧 Email: test@praiotel.pt');
  console.log('🔑 Password: Test@2024');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} finally {
  await client.end();
}

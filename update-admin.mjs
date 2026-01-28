import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { users } from "./drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function updateAdmin() {
  try {
    // Verificar se existe utilizador com id 1
    const existingUsers = await db.select().from(users).limit(5);
    console.log("Utilizadores existentes:", existingUsers.length);
    
    if (existingUsers.length > 0) {
      // Eliminar todos os utilizadores antigos
      await db.delete(users);
      console.log("✓ Utilizadores antigos eliminados");
    }
    
    // Criar novo admin com email
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("admin123", 10);
    
    await db.insert(users).values({
      email: "admin@praiotel.pt",
      passwordHash,
      name: "Administrador",
      role: "admin",
      active: 1,
    });
    
    console.log("✓ Utilizador admin atualizado com sucesso!");
    console.log("  Email: admin@praiotel.pt");
    console.log("  Password: admin123");
  } catch (error) {
    console.error("Erro:", error);
  }
  
  process.exit(0);
}

updateAdmin();

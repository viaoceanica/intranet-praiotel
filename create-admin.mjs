import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import { users } from "./drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function createAdmin() {
  const username = "admin";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      username,
      passwordHash,
      name: "Administrador",
      email: "admin@praiotel.pt",
      role: "admin",
      active: 1,
    });

    console.log("✓ Utilizador admin criado com sucesso!");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    console.log("\n⚠️  IMPORTANTE: Altere a password após o primeiro login!");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log("✓ Utilizador admin já existe");
    } else {
      console.error("Erro ao criar admin:", error);
    }
  }

  process.exit(0);
}

createAdmin();

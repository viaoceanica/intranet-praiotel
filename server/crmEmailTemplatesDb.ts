import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { crmEmailTemplates } from "../drizzle/schema";

// Variáveis dinâmicas disponíveis
export const AVAILABLE_VARIABLES = [
  { key: "nome", label: "Nome", description: "Nome do contacto/lead" },
  { key: "empresa", label: "Empresa", description: "Nome da empresa" },
  { key: "email", label: "Email", description: "Email do contacto" },
  { key: "telefone", label: "Telefone", description: "Telefone do contacto" },
  { key: "cargo", label: "Cargo", description: "Cargo/função do contacto" },
  { key: "vendedor", label: "Vendedor", description: "Nome do vendedor atribuído" },
  { key: "data_atual", label: "Data Atual", description: "Data de hoje" },
  { key: "nome_empresa", label: "Nome Empresa (Praiotel)", description: "Nome da empresa remetente" },
];

/**
 * Listar todos os templates
 */
export async function listTemplates(filters?: { category?: string; active?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const conditions = [];
  if (filters?.category) conditions.push(eq(crmEmailTemplates.category, filters.category));
  if (filters?.active !== undefined) conditions.push(eq(crmEmailTemplates.active, filters.active ? 1 : 0));

  let query = db.select().from(crmEmailTemplates);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return query.orderBy(desc(crmEmailTemplates.updatedAt));
}

/**
 * Obter template por ID
 */
export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(crmEmailTemplates)
    .where(eq(crmEmailTemplates.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Criar novo template
 */
export async function createTemplate(data: {
  name: string;
  description?: string;
  category?: string;
  subject: string;
  htmlContent: string;
  variables?: string[];
  createdById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db.insert(crmEmailTemplates).values({
    name: data.name,
    description: data.description || null,
    category: data.category || "geral",
    subject: data.subject,
    htmlContent: data.htmlContent,
    variables: data.variables ? JSON.stringify(data.variables) : null,
    createdById: data.createdById,
  });

  return Number((result as any).insertId);
}

/**
 * Atualizar template
 */
export async function updateTemplate(
  id: number,
  data: {
    name?: string;
    description?: string;
    category?: string;
    subject?: string;
    htmlContent?: string;
    variables?: string[];
    active?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.subject !== undefined) updateData.subject = data.subject;
  if (data.htmlContent !== undefined) updateData.htmlContent = data.htmlContent;
  if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables);
  if (data.active !== undefined) updateData.active = data.active ? 1 : 0;

  await db
    .update(crmEmailTemplates)
    .set(updateData)
    .where(eq(crmEmailTemplates.id, id));

  return true;
}

/**
 * Eliminar template
 */
export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db.delete(crmEmailTemplates).where(eq(crmEmailTemplates.id, id));
  return true;
}

/**
 * Substituir variáveis dinâmicas no conteúdo
 */
export function replaceVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

/**
 * Pré-visualizar template com dados de exemplo
 */
export function previewTemplate(
  subject: string,
  htmlContent: string
): { subject: string; htmlContent: string } {
  const sampleData: Record<string, string> = {
    nome: "João Silva",
    empresa: "Empresa Exemplo, Lda.",
    email: "joao.silva@exemplo.pt",
    telefone: "+351 912 345 678",
    cargo: "Diretor Comercial",
    vendedor: "Maria Santos",
    data_atual: new Date().toLocaleDateString("pt-PT"),
    nome_empresa: "Praiotel",
  };

  return {
    subject: replaceVariables(subject, sampleData),
    htmlContent: replaceVariables(htmlContent, sampleData),
  };
}

/**
 * Extrair variáveis usadas num template
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}

/**
 * Obter categorias de templates
 */
export async function getCategories(): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select({ category: crmEmailTemplates.category })
    .from(crmEmailTemplates)
    .groupBy(crmEmailTemplates.category);

  const categories = result.map((r) => r.category).filter(Boolean) as string[];
  // Adicionar categorias padrão se não existirem
  const defaults = ["geral", "vendas", "follow_up", "boas_vindas", "proposta"];
  for (const d of defaults) {
    if (!categories.includes(d)) categories.push(d);
  }
  return categories.sort();
}

import { getDb } from "./db";
import { responseTemplates, type InsertResponseTemplate } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function getAllTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(responseTemplates).orderBy(responseTemplates.category, responseTemplates.title);
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(responseTemplates).where(eq(responseTemplates.id, id)).limit(1);
  return result[0] || null;
}

export async function createTemplate(data: InsertResponseTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(responseTemplates).values(data);
}

export async function updateTemplate(id: number, data: Partial<InsertResponseTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(responseTemplates).set(data).where(eq(responseTemplates.id, id));
}

export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(responseTemplates).where(eq(responseTemplates.id, id));
}

export async function seedDefaultTemplates(userId: number) {
  const existing = await getAllTemplates();
  if (existing.length > 0) return; // Já existem templates

  const defaultTemplates = [
    {
      title: "Equipamento Reparado",
      content: "O equipamento foi reparado com sucesso e está pronto para utilização. Todos os testes foram realizados e o funcionamento está normal.",
      category: "Resolução",
      createdById: userId,
    },
    {
      title: "Aguarda Peça",
      content: "O equipamento está a aguardar a chegada de uma peça de substituição. Estimamos que a peça chegue dentro de 3-5 dias úteis. Entraremos em contacto assim que a peça chegar.",
      category: "Aguarda",
      createdById: userId,
    },
    {
      title: "Equipamento Substituído",
      content: "O equipamento foi substituído por um novo. O equipamento antigo será enviado para análise técnica. O novo equipamento está instalado e operacional.",
      category: "Resolução",
      createdById: userId,
    },
    {
      title: "Necessita Aprovação",
      content: "A reparação requer aprovação do cliente devido ao custo envolvido. Por favor, contacte-nos para discutir as opções disponíveis e orçamento.",
      category: "Pendente",
      createdById: userId,
    },
    {
      title: "Manutenção Preventiva Realizada",
      content: "Foi realizada manutenção preventiva no equipamento. Todos os componentes foram verificados e limpos. O equipamento está em perfeitas condições de funcionamento.",
      category: "Manutenção",
      createdById: userId,
    },
    {
      title: "Problema Não Reproduzido",
      content: "Não foi possível reproduzir o problema reportado. O equipamento foi testado extensivamente e está a funcionar normalmente. Se o problema voltar a ocorrer, por favor contacte-nos novamente.",
      category: "Resolução",
      createdById: userId,
    },
  ];

  for (const template of defaultTemplates) {
    await createTemplate(template);
  }
}

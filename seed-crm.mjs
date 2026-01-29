import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Seeding CRM data...");

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });

  try {
    // Criar leads de teste
    console.log("Creating leads...");
    
    const leads = [
      {
        name: "João Silva",
        email: "joao.silva@empresa.pt",
        phone: "+351 912 345 678",
        company: "Silva & Associados",
        source: "website",
        status: "novo",
        score: 60,
        notes: "Interessado em serviços de consultoria",
      },
      {
        name: "Maria Santos",
        email: "maria.santos@tech.pt",
        phone: "+351 913 456 789",
        company: "Tech Solutions",
        source: "referencia",
        status: "contactado",
        score: 75,
        notes: "Reunião agendada para próxima semana",
        lastContactedAt: new Date(),
      },
      {
        name: "Pedro Costa",
        email: "pedro.costa@startup.pt",
        phone: "+351 914 567 890",
        company: "Startup Inovadora",
        source: "linkedin",
        status: "qualificado",
        score: 85,
        notes: "Lead qualificado, pronto para conversão",
        lastContactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
      },
      {
        name: "Ana Rodrigues",
        email: "ana.rodrigues@comercio.pt",
        phone: "+351 915 678 901",
        company: "Comércio Digital",
        source: "google",
        status: "novo",
        score: 50,
        notes: "Preencheu formulário de contacto",
      },
      {
        name: "Carlos Ferreira",
        email: "carlos.ferreira@industria.pt",
        phone: "+351 916 789 012",
        company: "Indústria Moderna",
        source: "evento",
        status: "contactado",
        score: 70,
        notes: "Conheceu na feira de tecnologia",
        lastContactedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
      },
    ];

    for (const lead of leads) {
      await db.insert(schema.crmLeads).values(lead);
    }

    console.log(`✅ Created ${leads.length} leads`);

    // Criar oportunidades de teste
    console.log("Creating opportunities...");

    const opportunities = [
      {
        title: "Projeto de Consultoria - Silva & Associados",
        description: "Implementação de sistema de gestão",
        value: "15000.00",
        stage: "prospeccao",
        status: "aberta",
        probability: 30,
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias
        assignedToId: 1,
        notes: "Primeira reunião realizada",
      },
      {
        title: "Desenvolvimento de Aplicação - Tech Solutions",
        description: "Aplicação mobile para gestão de vendas",
        value: "25000.00",
        stage: "qualificacao",
        status: "aberta",
        probability: 50,
        expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 dias
        assignedToId: 1,
        notes: "Orçamento enviado",
      },
      {
        title: "Website E-commerce - Comércio Digital",
        description: "Plataforma de vendas online completa",
        value: "18000.00",
        stage: "proposta",
        status: "aberta",
        probability: 70,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        assignedToId: 1,
        notes: "Proposta em análise pelo cliente",
      },
      {
        title: "Sistema ERP - Indústria Moderna",
        description: "Implementação de ERP personalizado",
        value: "45000.00",
        stage: "negociacao",
        status: "aberta",
        probability: 80,
        expectedCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 dias
        assignedToId: 1,
        notes: "Negociação de valores em curso",
      },
      {
        title: "Consultoria Digital - Startup Inovadora",
        description: "Estratégia digital e marketing",
        value: "8000.00",
        stage: "fechamento",
        status: "aberta",
        probability: 90,
        expectedCloseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
        assignedToId: 1,
        notes: "Contrato em revisão final",
      },
    ];

    for (const opportunity of opportunities) {
      await db.insert(schema.crmOpportunities).values(opportunity);
    }

    console.log(`✅ Created ${opportunities.length} opportunities`);

    console.log("🎉 CRM seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding CRM data:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed();

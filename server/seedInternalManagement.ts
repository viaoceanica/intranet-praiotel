import * as internalManagementDb from "./internalManagementDb";

export async function seedInternalManagement(adminUserId: number) {
  console.log("🌱 A popular categorias e conteúdo de Gestão Interna...");

  // 1. Criar categorias de documentos
  const docCategories = [
    { name: "Recursos Humanos", description: "Documentos relacionados com RH", icon: "Users" },
    { name: "Técnico", description: "Manuais e documentação técnica", icon: "Wrench" },
    { name: "Administrativo", description: "Documentos administrativos e financeiros", icon: "FileText" },
  ];

  const docCategoryIds: Record<string, number> = {};
  for (const cat of docCategories) {
    const id = await internalManagementDb.createDocumentCategory(cat);
    docCategoryIds[cat.name] = id;
    console.log(`✓ Categoria de documento criada: ${cat.name}`);
  }

  // 2. Criar categorias de conhecimento
  const knowledgeCategories = [
    { name: "Tutoriais", description: "Guias passo-a-passo", icon: "BookOpen", displayOrder: 1 },
    { name: "Formação", description: "Materiais de formação", icon: "GraduationCap", displayOrder: 2 },
    { name: "FAQ", description: "Perguntas frequentes", icon: "HelpCircle", displayOrder: 3 },
  ];

  const knowledgeCategoryIds: Record<string, number> = {};
  for (const cat of knowledgeCategories) {
    const id = await internalManagementDb.createKnowledgeCategory(cat);
    knowledgeCategoryIds[cat.name] = id;
    console.log(`✓ Categoria de conhecimento criada: ${cat.name}`);
  }

  // 3. Criar notícias de exemplo
  const newsItems = [
    {
      title: "Bem-vindo à Intranet Praiotel",
      content: "Estamos felizes em apresentar a nova intranet da Praiotel! Aqui encontrará todas as ferramentas e informações necessárias para o seu dia-a-dia.\n\nExplore os diferentes menus para descobrir:\n- Sistema de tickets para suporte técnico\n- Gestão de clientes e equipamentos\n- Base de conhecimento com tutoriais\n- Documentos importantes da empresa\n\nBom trabalho!",
      authorId: adminUserId,
    },
    {
      title: "Nova Funcionalidade: Base de Conhecimento",
      content: "Temos o prazer de anunciar o lançamento da Base de Conhecimento!\n\nAgora pode aceder a tutoriais, materiais de formação e FAQ diretamente na intranet. Consulte regularmente para se manter atualizado sobre produtos e procedimentos.",
      authorId: adminUserId,
    },
  ];

  for (const news of newsItems) {
    await internalManagementDb.createNews(news);
    console.log(`✓ Notícia criada: ${news.title}`);
  }

  // 4. Criar acessos rápidos de exemplo
  const quickAccessItems = [
    { name: "Portal Praiotel", url: "https://praiotel.pt", icon: "ExternalLink", displayOrder: 1, createdById: adminUserId },
    { name: "Email Corporativo", url: "https://mail.google.com", icon: "Mail", displayOrder: 2, createdById: adminUserId },
    { name: "Tickets", url: "/tickets", icon: "Ticket", displayOrder: 3, createdById: adminUserId },
    { name: "Clientes", url: "/clients", icon: "Building2", displayOrder: 4, createdById: adminUserId },
  ];

  for (const access of quickAccessItems) {
    await internalManagementDb.createQuickAccess(access);
    console.log(`✓ Acesso rápido criado: ${access.name}`);
  }

  // 5. Criar anúncio de exemplo
  const announcement = {
    title: "Procedimentos de Segurança",
    content: "Lembramos a todos os colaboradores a importância de seguir os procedimentos de segurança:\n\n1. Nunca partilhe as suas credenciais de acesso\n2. Utilize passwords fortes e únicas\n3. Reporte imediatamente qualquer atividade suspeita\n4. Mantenha o software atualizado\n\nA segurança é responsabilidade de todos!",
    priority: "alta" as const,
    authorId: adminUserId,
  };

  await internalManagementDb.createAnnouncement(announcement);
  console.log(`✓ Anúncio criado: ${announcement.title}`);

  // 6. Criar artigos de conhecimento de exemplo
  const knowledgeArticles = [
    {
      title: "Como Criar um Novo Ticket",
      content: `# Como Criar um Novo Ticket

Para criar um novo ticket de suporte, siga estes passos:

## 1. Aceder ao Menu de Tickets
Clique em "Tickets" no menu lateral e depois em "Novo Ticket".

## 2. Preencher os Dados do Cliente
- Selecione o cliente da lista
- Se for um novo cliente, adicione-o primeiro através do menu "Clientes"

## 3. Descrever o Problema
- Escolha o tipo de problema (Hardware, Software, Rede, etc.)
- Descreva detalhadamente o problema
- Adicione anexos se necessário (fotos, logs, etc.)

## 4. Definir Prioridade
O sistema irá sugerir uma prioridade baseada nas regras configuradas, mas pode ajustá-la manualmente.

## 5. Submeter o Ticket
Clique em "Criar Ticket" para submeter. O técnico responsável será notificado automaticamente.`,
      categoryId: knowledgeCategoryIds["Tutoriais"],
      tags: "tickets,suporte,tutorial",
      authorId: adminUserId,
    },
    {
      title: "Gestão de Equipamentos",
      content: `# Gestão de Equipamentos

O sistema de gestão de equipamentos permite registar e acompanhar todos os equipamentos dos clientes.

## Adicionar Novo Equipamento
1. Vá ao menu "Clientes" > "Equipamentos"
2. Clique em "Novo Equipamento"
3. Preencha os dados: tipo, marca, modelo, número de série
4. Associe ao cliente correto

## Histórico de Manutenção
Cada equipamento mantém um histórico completo de:
- Tickets associados
- Intervenções realizadas
- Peças substituídas
- Datas de manutenção

## Alertas de Garantia
O sistema pode alertar quando a garantia de um equipamento está próxima do fim.`,
      categoryId: knowledgeCategoryIds["Tutoriais"],
      tags: "equipamentos,gestão,tutorial",
      authorId: adminUserId,
    },
    {
      title: "Formação: Sistema de SLA",
      content: `# Sistema de SLA (Service Level Agreement)

O sistema de SLA garante que os tickets são resolvidos dentro dos prazos acordados.

## Como Funciona
- Cada prioridade tem um tempo de resposta e resolução definido
- O sistema calcula automaticamente o prazo baseado na prioridade
- Alertas são enviados quando o prazo está próximo de expirar

## Prioridades Padrão
- **Urgente**: Resposta em 1h, Resolução em 4h
- **Alta**: Resposta em 2h, Resolução em 8h
- **Média**: Resposta em 4h, Resolução em 24h
- **Baixa**: Resposta em 8h, Resolução em 48h

## Monitorização
Os gestores podem acompanhar o cumprimento dos SLAs através do dashboard de estatísticas.`,
      categoryId: knowledgeCategoryIds["Formação"],
      tags: "sla,formação,prazos",
      authorId: adminUserId,
    },
    {
      title: "FAQ: Como Redefinir a Minha Password?",
      content: `# Como Redefinir a Minha Password?

Se esqueceu a sua password, siga estes passos:

## 1. Contacte o Administrador
Atualmente, apenas os administradores podem redefinir passwords. Contacte o administrador do sistema através de:
- Email interno
- Telefone
- Ticket de suporte

## 2. Verificação de Identidade
O administrador irá verificar a sua identidade antes de proceder à redefinição.

## 3. Nova Password
Receberá uma password temporária que deverá alterar no primeiro login.

## Dicas de Segurança
- Use passwords fortes (mínimo 8 caracteres)
- Combine letras maiúsculas, minúsculas, números e símbolos
- Não reutilize passwords de outros sistemas
- Altere a password regularmente`,
      categoryId: knowledgeCategoryIds["FAQ"],
      tags: "password,segurança,faq",
      authorId: adminUserId,
    },
    {
      title: "FAQ: Como Adicionar um Novo Cliente?",
      content: `# Como Adicionar um Novo Cliente?

Para adicionar um novo cliente ao sistema:

## Passo 1: Menu Clientes
Aceda ao menu "Clientes" na barra lateral.

## Passo 2: Novo Cliente
Clique no botão "Novo Cliente" no topo da página.

## Passo 3: Dados Obrigatórios
Preencha os seguintes campos obrigatórios:
- Nome do cliente
- Email de contacto
- Telefone

## Passo 4: Dados Opcionais
Pode também adicionar:
- Morada completa
- NIF
- Notas internas

## Passo 5: Emails Adicionais
Adicione emails adicionais se o cliente tiver múltiplos contactos.

## Passo 6: Guardar
Clique em "Guardar" para criar o cliente. Agora pode associar equipamentos e criar tickets para este cliente.`,
      categoryId: knowledgeCategoryIds["FAQ"],
      tags: "clientes,faq,tutorial",
      authorId: adminUserId,
    },
  ];

  for (const article of knowledgeArticles) {
    await internalManagementDb.createKnowledgeArticle(article);
    console.log(`✓ Artigo criado: ${article.title}`);
  }

  console.log("✅ Seed de Gestão Interna concluído com sucesso!");
}

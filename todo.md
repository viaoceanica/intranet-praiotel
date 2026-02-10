# Intranet Praiotel - TODO

## Autenticação Autónoma
- [ ] Criar schema de base de dados para utilizadores com username/password
- [ ] Implementar sistema de hash de passwords (bcrypt)
- [ ] Criar endpoints de login e logout
- [ ] Criar página de login
- [ ] Implementar middleware de autenticação

## Gestão de Utilizadores
- [x] Criar interface de listagem de utilizadores
- [x] Implementar criação de novos utilizadores
- [x] Implementar edição de utilizadores existentes
- [x] Implementar eliminação de utilizadores
- [x] Adicionar validações de formulários

## Gestão de Roles
- [x] Definir roles no schema (Admin, Gestor, Técnico, Visualizador)
- [x] Criar sistema de atribuição de roles
- [x] Implementar controlo de permissões por role
- [x] Criar interface de gestão de roles

## Sistema de Tickets
- [x] Criar schema de tickets com todos os campos necessários
- [x] Implementar criação de tickets
- [ ] Implementar edição de tickets
- [x] Implementar listagem de tickets
- [ ] Implementar visualização detalhada de tickets
- [x] Adicionar sistema de estados (Aberto/Em Progresso/Resolvido/Fechado)
- [x] Adicionar sistema de prioridades (Baixa/Média/Alta/Urgente)
- [x] Implementar atribuição de técnicos
- [x] Adicionar campo de localização (Ilha)

## Upload de Anexos
- [ ] Criar schema para anexos
- [ ] Implementar upload de ficheiros para S3
- [ ] Implementar visualização de anexos
- [ ] Adicionar suporte para múltiplos anexos por ticket

## Dashboard
- [ ] Criar dashboard com estatísticas gerais
- [ ] Adicionar gráficos de tickets por estado
- [ ] Adicionar gráficos de tickets por prioridade
- [ ] Mostrar tickets recentes
- [ ] Adicionar métricas de desempenho

## Filtros e Pesquisa
- [x] Implementar filtro por estado
- [x] Implementar filtro por prioridade
- [ ] Implementar filtro por técnico
- [ ] Implementar filtro por cliente
- [x] Implementar pesquisa por texto
- [ ] Adicionar ordenação de resultados

## Design e UI
- [x] Aplicar paleta de cores Praiotel (#F15A24, #2F2F2F, #F5F5F5)
- [x] Criar layout com sidebar de navegação
- [x] Implementar tema consistente em todos os componentes
- [x] Garantir responsividade mobile

## Testes
- [ ] Criar testes para autenticação
- [ ] Criar testes para gestão de utilizadores
- [ ] Criar testes para sistema de tickets
- [ ] Criar testes para upload de anexos

## Alterações Solicitadas
- [x] Alterar username para email no sistema de autenticação
- [x] Atualizar utilizador admin para usar email

## Novas Funcionalidades Solicitadas
- [x] Criar página de visualização detalhada de tickets
- [x] Implementar upload de anexos (fotos) nos tickets
- [x] Criar sistema de notas/comentários em tickets
- [x] Implementar histórico de alterações visível
- [x] Criar sistema de notificações para atribuições
- [x] Criar sistema de notificações para atualizações
- [x] Criar sistema de notificações para novos comentários

## Gestão de Clientes
- [x] Criar schema de clientes na base de dados
- [x] Criar schema de emails adicionais de clientes
- [x] Adicionar menu "Clientes" na sidebar
- [x] Criar página de listagem de clientes
- [x] Criar página de adicionar cliente
- [x] Implementar pesquisa por NIF, nome e email
- [x] Permitir adicionar múltiplos emails por cliente
- [x] Interligar tickets com tabela de clientes
- [x] Substituir campo clientName por relação com tabela clientes
- [x] Atualizar formulário de criação de tickets para usar dropdown de clientes

## Histórico de Tickets por Cliente
- [x] Adicionar query para obter tickets por clientId
- [x] Criar página separada de histórico de tickets do cliente
- [x] Mostrar lista de tickets do cliente com filtros
- [x] Adicionar estatísticas (total tickets, abertos, resolvidos, tempo médio)
- [x] Adicionar botão de histórico na listagem de clientes

## Dashboard com Métricas
- [x] Criar queries para estatísticas gerais
- [x] Implementar gráfico de tickets por estado
- [x] Implementar gráfico de tickets por prioridade
- [x] Implementar ranking de clientes com mais tickets
- [x] Mostrar tempo médio de resolução
- [x] Adicionar métricas principais (total, abertos, tempo médio, clientes ativos)
- [x] Biblioteca de gráficos recharts já incluída no template

## Filtros Avançados na Listagem de Tickets
- [x] Adicionar filtro por técnico atribuído
- [x] Adicionar filtro por cliente específico
- [x] Adicionar filtro por localização (ilha)
- [x] Adicionar filtro por intervalo de datas
- [x] Implementar combinação de múltiplos filtros
- [x] Adicionar botão de limpar filtros

## Sistema de SLA (Service Level Agreement)
- [x] Criar tabela de configuração de SLA por prioridade
- [x] Definir prazos de resposta padrão (urgente: 4h, alta: 24h, média: 48h, baixa: 72h)
- [x] Calcular tempo decorrido desde criação do ticket
- [x] Adicionar alertas visuais quando ticket ultrapassa SLA
- [x] Mostrar indicador de SLA na listagem de tickets
- [ ] Adicionar métricas de cumprimento de SLA no dashboard
- [ ] Criar página de configuração de SLA (apenas Admin)

## Página de Configuração de SLA (Admin)
- [x] Criar página de configuração de SLA acessível apenas por Admin
- [x] Formulário para editar prazos de resposta e resolução por prioridade
- [x] Validações (tempo de resolução > tempo de resposta)
- [x] Adicionar item no menu de navegação (apenas visível para Admin)

## Métricas de Cumprimento de SLA no Dashboard
- [x] Adicionar card de percentagem de tickets dentro do SLA
- [x] Criar gráfico de cumprimento de SLA (dentro vs fora)
- [x] Mostrar tempo médio de violação de SLA
- [x] Adicionar ranking de técnicos por cumprimento de SLA
- [ ] Filtro de período para métricas de SLA

## Notificações Automáticas de SLA
- [x] Criar job/verificação periódica de tickets próximos do limite SLA
- [x] Enviar notificação quando ticket atinge 80% do tempo SLA
- [x] Enviar notificação quando SLA é violado
- [x] Notificar técnico atribuído
- [x] Adicionar tipo de notificação específico para SLA (sla_warning, sla_breached)

## Gestão de Equipamentos
- [x] Criar schema de equipamentos (marca, modelo, número de série, localização, cliente)
- [x] Criar interface de listagem de equipamentos
- [x] Implementar criação de novos equipamentos
- [x] Implementar edição de equipamentos
- [x] Adicionar pesquisa por número de série, marca, modelo
- [x] Criar histórico de intervenções por equipamento
- [x] Campo de equipamento crítico com priorização automática
- [x] Adicionar menu "Equipamentos" na sidebar
- [x] Mostrar estatísticas de equipamento (total tickets, última intervenção)

## Sistema de Priorização Automática
- [x] Criar tabela de regras de priorização
- [x] Implementar deteção de clientes VIP
- [x] Criar lista de equipamentos críticos
- [x] Implementar análise de palavras-chave na descrição
- [x] Criar algoritmo de ajuste automático de prioridade
- [x] Adicionar histórico de alterações de prioridade
- [x] Criar interface de configuração de regras (Admin)
- [x] Notificar quando prioridade é ajustada automaticamente
- [x] Integrar priorização automática na criação de tickets

## Dashboard de Técnicos
- [x] Criar vista personalizada para técnicos
- [x] Mostrar apenas tickets atribuídos ao técnico logado
- [x] Badges visuais de estado e prioridade
- [x] Acesso rápido aos detalhes dos tickets

## Integração de Equipamentos nos Tickets
- [x] Adicionar campo equipmentId (opcional) ao schema de tickets
- [x] Criar endpoint para listar equipamentos por clientId
- [x] Atualizar formulário de criação de ticket com dropdown de equipamentos
- [x] Filtrar equipamentos dinamicamente quando cliente é selecionado
- [x] Manter campo texto "equipment" como fallback quando não há equipamento registado
- [x] Atualizar formulário de edição de ticket com mesma funcionalidade
- [ ] Mostrar nome do equipamento na listagem e detalhes de tickets

## Reorganização do Menu
- [x] Mover "Configuração SLA" para sub-menu de Tickets
- [x] Criar estrutura de menu expansível para Tickets
- [x] Atualizar navegação no PraiotelLayout

## Gestão de Prioridades (SLA Config)
- [x] Manter 4 prioridades base (baixa, media, alta, urgente) editáveis
- [x] Permitir admin criar novas prioridades personalizadas
- [x] Permitir admin eliminar prioridades personalizadas (não as 4 base)
- [x] Adicionar campo de nome personalizado para novas prioridades
- [x] Atualizar schema para suportar prioridades dinâmicas
- [ ] Atualizar dropdowns de tickets para incluir prioridades personalizadas

## Correções
- [x] Corrigir erro de tags <a> aninhadas na página /sla-config

## Reorganização do Menu (Continuação)
- [x] Mover "Priorização Automática" para sub-menu de Tickets

## Correções de Rotas
- [ ] Verificar e corrigir erro 404 na rota /admin

## Correções de Layout
- [x] Corrigir falta de sidebar na página de priorização

## Reorganização do Menu (Equipamentos)
- [x] Mover "Equipamentos" para sub-menu de Clientes

## Correções de Layout (Continuação)
- [x] Corrigir falta de sidebar na página de equipamentos
- [x] Corrigir falta de sidebar na página de formulário de equipamento
- [x] Corrigir falta de sidebar na página de histórico de equipamento

## Dropdowns Dinâmicos de Prioridade
- [x] Carregar prioridades da base de dados em NewTicket
- [x] Carregar prioridades da base de dados em TicketDetail
- [x] Atualizar todos os componentes que usam prioridades hardcoded

## Breadcrumbs de Navegação
- [x] Criar componente Breadcrumbs reutilizável
- [x] Adicionar breadcrumbs em TicketDetail
- [x] Adicionar breadcrumbs em ClientForm
- [x] Adicionar breadcrumbs em EquipmentForm/EquipmentHistory

## Sistema de Notificações por Email (ADIADO)
- [ ] Pesquisar e escolher serviço de email (ex: Resend, SendGrid)
- [ ] Criar templates de email para atribuição de tickets
- [ ] Criar templates de email para atualizações de tickets
- [ ] Criar templates de email para alertas de SLA
- [ ] Integrar envio de emails nos endpoints relevantes
- [ ] Adicionar configuração de preferências de notificações por utilizador

## Correção de Navegação na Sidebar
- [x] Investigar erro de expansão de submenus
- [x] Corrigir lógica de estado de expansão
- [x] Testar navegação em todos os menus
- [x] Implementar expansão automática baseada na rota atual (useEffect com pathname)

## Coluna de Equipamento na Listagem de Tickets
- [x] Adicionar coluna "Equipamento" na tabela de tickets
- [x] Mostrar nome do equipamento (marca + modelo + N/S)
- [x] Adicionar badge visual para equipamentos críticos
- [x] Atualizar query para incluir dados do equipamento

## Página de Estatísticas por Técnico
- [x] Criar schema/queries para estatísticas de técnicos
- [x] Criar página de estatísticas por técnico
- [x] Mostrar tickets resolvidos por técnico
- [x] Mostrar tempo médio de resolução por técnico
- [x] Mostrar taxa de cumprimento de SLA por técnico
- [x] Adicionar comparação com média da equipa
- [x] Adicionar menu na sidebar para acesso às estatísticas

## Reorganização do Menu de Estatísticas
- [x] Mover "Estatísticas" para sub-menu de Tickets

## Autocomplete de Clientes no Novo Ticket
- [x] Criar endpoint de pesquisa de clientes por nome, NIF ou email
- [x] Implementar componente de autocomplete com resultados em tempo real
- [x] Substituir Select por campo de pesquisa com autocomplete
- [x] Testar pesquisa por nome, NIF e email

## Autocomplete de Equipamentos no Novo Ticket
- [x] Implementar autocomplete de equipamentos filtrado por cliente selecionado
- [x] Mostrar apenas equipamentos do cliente atual
- [x] Permitir pesquisa por marca, modelo ou número de série
- [x] Testar funcionalidade com cliente com equipamentos

## Botão de Atalho "Novo Equipamento" na Página de Novo Ticket
- [x] Criar modal de novo equipamento
- [x] Adicionar botão ao lado do campo de pesquisa de equipamentos
- [x] Implementar lógica de criação de equipamento via modal
- [x] Atualizar lista de equipamentos após criação
- [x] Testar funcionalidade completa

## Edição Rápida de Tickets na Listagem
- [x] Adicionar botão de edição rápida na listagem de tickets
- [x] Criar modal inline com campos de estado, prioridade e técnico
- [x] Implementar mutation de atualização rápida
- [x] Atualizar lista após edição sem recarregar página
- [x] Testar funcionalidade completa

## Sistema de Templates de Resposta
- [x] Criar schema de templates de resposta na base de dados
- [ ] Criar interface de gestão de templates (Admin/Gestor)
- [x] Implementar dropdown de templates na área de comentários
- [x] Permitir inserção rápida de template no campo de texto
- [x] Adicionar templates padrão (ex: "Equipamento reparado", "Aguarda peça")
- [x] Testar funcionalidade em página de detalhes de ticket

## Interface de Gestão de Templates de Resposta
- [x] Criar página de gestão de templates (acessível para Admin/Gestor)
- [x] Implementar listagem de templates existentes
- [x] Adicionar formulário de criação de novos templates
- [x] Implementar edição de templates existentes
- [x] Implementar eliminação de templates
- [x] Adicionar validações (nome e conteúdo obrigatórios)
- [x] Adicionar menu na sidebar para acesso à gestão de templates

## Filtro de Período nas Estatísticas
- [x] Adicionar dropdown de período na página de estatísticas
- [x] Implementar opções pré-definidas (último mês, trimestre, semestre, ano, tudo)
- [x] Atualizar queries para filtrar por intervalo de datas
- [x] Testar filtro com diferentes períodos

## Sistema de Notificações em Tempo Real
- [x] Criar componente de notificações com polling automático
- [x] Implementar badge de contador de notificações não lidas
- [x] Criar dropdown de notificações com lista de alertas
- [x] Implementar marcação de notificações como lidas
- [x] Adicionar tipos de notificação (novo ticket, comentário, atualização, SLA)
- [x] Integrar notificações no header do PraiotelLayout
- [x] Testar sistema completo de notificações

## Sub-menu de Roles em Utilizadores
- [x] Criar página de gestão de roles
- [x] Adicionar sub-menu "Roles" em Utilizadores
- [x] Implementar listagem de utilizadores por role
- [x] Adicionar descrição de permissões por role
- [x] Testar navegação e visualização

## Gatilhos Automáticos de Notificações
- [x] Criar função auxiliar para enviar notificações
- [x] Implementar gatilho de notificação ao atribuir ticket
- [x] Implementar gatilho de notificação ao adicionar comentário
- [x] Implementar gatilho de notificação ao mudar estado do ticket
- [x] Criar funções de alerta e violação de SLA
- [x] Testar todos os gatilhos de notificação

## Sistema de Roles Personalizados
- [x] Criar schema de roles personalizados na base de dados
- [x] Criar schema de permissões granulares
- [x] Implementar queries para CRUD de roles personalizados
- [x] Criar interface de gestão de roles (criar, editar, eliminar)
- [x] Implementar seletor de permissões configuráveis
- [x] Proteger roles padrão contra eliminação
- [x] Integrar roles personalizados no select de utilizadores
- [x] Testar criação, edição e eliminação de roles
- [x] Testar atribuição de roles personalizados a utilizadores

## Controlo de Acesso Baseado em Permissões (RBAC)
- [x] Criar função auxiliar getUserPermissions() no backend
- [x] Criar middleware requirePermission() para endpoints tRPC
- [x] Implementar hook usePermissions() no frontend
- [x] Criar endpoint auth.getPermissions para carregar permissões
- [x] Estrutura base de RBAC implementada e pronta para expansão
- [ ] Aplicar restrições em todos os endpoints (expansão futura)
- [ ] Controlar visibilidade de botões/menus no frontend (expansão futura)

## Menu de Gestão Interna
- [x] Criar menu "Gestão Interna" na sidebar
- [x] Adicionar estrutura de sub-menus expansível

## 1. Painel Inicial
- [x] Criar schema de notícias internas (título, conteúdo, data, autor)
- [x] Criar schema de acessos rápidos (nome, URL, ícone, ordem)
- [x] Implementar CRUD de notícias internas
- [x] Implementar CRUD de acessos rápidos
- [x] Criar página de Painel Inicial
- [x] Mostrar últimas notícias com paginação
- [x] Mostrar grid de acessos rápidos
- [x] Adicionar permissões (todos podem ver, admin/gestor podem criar/editar)

## 2. Área de Comunicação
- [x] Criar schema de anúncios gerais (título, conteúdo, data, autor, prioridade)
- [x] Criar schema de mural de mensagens (mensagem, autor, data, anexos)
- [x] Implementar CRUD de anúncios gerais
- [x] Implementar CRUD de mensagens do mural
- [x] Criar página de Anúncios Gerais
- [x] Criar página de Mural de Mensagens
- [ ] Adicionar sistema de comentários em anúncios (funcionalidade futura)
- [x] Adicionar reações/likes em mensagens do mural
- [x] Adicionar permissões adequadas

## 3. Gestão de Documentos
- [x] Criar schema de categorias de documentos (nome, descrição, ícone)
- [x] Criar schema de documentos (nome, categoria, ficheiro S3, tamanho, tipo, autor, data)
- [x] Implementar upload de documentos para S3
- [x] Implementar download de documentos
- [x] Criar página de Gestão de Documentos
- [x] Implementar organização por categorias (RH, Técnico, Administrativo)
- [x] Adicionar pesquisa de documentos por nome
- [x] Adicionar filtro por categoria
- [x] Mostrar informações do ficheiro (tamanho, tipo, data upload)
- [x] Adicionar permissões (todos podem ver/download, admin/gestor podem upload)

## 4. Base de Conhecimento
- [x] Criar schema de artigos de conhecimento (título, conteúdo, categoria, tags, autor, data)
- [x] Criar schema de categorias de conhecimento (Tutoriais, Formação, FAQ)
- [x] Implementar CRUD de artigos de conhecimento
- [x] Criar página de Base de Conhecimento
- [x] Implementar visualização por categorias (Tutoriais, Formação, FAQ)
- [x] Adicionar pesquisa de artigos por título e conteúdo
- [x] Adicionar sistema de tags para melhor organização
- [x] Adicionar contador de visualizações
- [x] Adicionar permissões (todos podem ver, admin/gestor podem criar/editar)

## Melhorias de Gestão Interna
- [x] Adicionar interface de upload de documentos no frontend
- [x] Criar categorias pré-definidas para documentos (RH, Técnico, Administrativo)
- [x] Criar categorias pré-definidas para conhecimento (Tutoriais, Formação, FAQ)
- [x] Popular base de dados com conteúdo de exemplo
- [x] Implementar notificações push automáticas para anúncios urgentes
- [x] Testar upload de documentos com diferentes tipos de ficheiros
- [x] Verificar envio de notificações ao criar anúncio urgente

## Melhorias Avançadas de Gestão Interna
- [x] Instalar e configurar TipTap (editor rich-text)
- [x] Integrar TipTap na criação/edição de artigos de conhecimento
- [x] Criar schema de favoritos (userId, itemType, itemId)
- [x] Implementar backend de favoritos (adicionar, remover, listar)
- [x] Adicionar botão de favoritos em artigos e documentos
- [x] Criar página "Os Meus Favoritos"
- [x] Criar dashboard de analytics de Gestão Interna
- [x] Mostrar artigos mais vistos
- [x] Mostrar documentos mais descarregados
- [x] Calcular taxa de leitura de anúncios
- [x] Testar todas as funcionalidades

## Melhorias Finais de Gestão Interna
- [x] Adicionar botão de favoritos na página de Base de Conhecimento
- [x] Adicionar botão de favoritos na página de Gestão de Documentos
- [x] Criar schema de comentários (articleId, userId, comment, createdAt)
- [x] Implementar backend de comentários (criar, listar, eliminar)
- [x] Adicionar secção de comentários na visualização de artigos
- [x] Testar sistema de favoritos integrado
- [x] Testar sistema de comentários

## Melhorias Avançadas da Base de Conhecimento
- [x] Implementar notificações para autor quando artigo recebe comentário
- [x] Implementar notificações para participantes quando há novos comentários
- [x] Adicionar filtros avançados (categoria + tags + data)
- [x] Adicionar ordenação múltipla (recentes, mais vistos, mais comentados)
- [x] Criar interface de pesquisa avançada
- [x] Testar sistema de notificações de comentários
- [x] Testar pesquisa avançada com filtros e ordenação

## Sistema de Indicadores de Artigos Não Lidos
- [x] Criar schema de leituras de artigos (userId, articleId, readAt)
- [x] Implementar backend para marcar artigo como lido
- [x] Implementar backend para verificar se artigo foi lido
- [x] Adicionar badge "Novo" em artigos publicados nos últimos 7 dias
- [x] Marcar automaticamente artigo como lido ao visualizar página de detalhes
- [x] Mostrar indicador visual de artigos não lidos na listagem
- [x] Testar sistema de marcação de leitura

## Bugs Reportados
- [x] Corrigir erro de hooks do React na página de DocumentManagement (/documents)
- [x] Corrigir erro React #310 (useEffect) na versão publicada da página /documents

## Melhorias de Produção e Monitorização
- [x] Criar guia de testes de produção
- [x] Investigar e implementar monitorização de erros (Sentry ou similar)
- [x] Configurar captura automática de erros em produção
- [x] Documentar processo de monitorização

- [x] Corrigir erro React #310 (hooks condicionais) na página /knowledge-base em produção

## Melhorias de Ordenação da Base de Conhecimento
- [x] Verificar e melhorar ordenação por data de criação
- [x] Verificar e melhorar ordenação por popularidade (visualizações)
- [x] Adicionar opções de ordenação ascendente/descendente
- [x] Testar todas as opções de ordenação

## Interface de Gestão de Categorias de Documentos
- [x] Criar página de gestão de categorias de documentos
- [x] Adicionar botão "Gerir Categorias" na página de Gestão de Documentos (apenas para admin)
- [x] Implementar formulário de criação de categoria (nome, descrição, ícone)
- [x] Implementar listagem de categorias existentes
- [x] Adicionar funcionalidade de edição de categoria
- [x] Adicionar funcionalidade de eliminação de categoria (com validação se tem documentos)
- [x] Adicionar endpoints CRUD no backend para categorias
- [x] Testar criação, edição e eliminação de categorias

## Interface de Gestão de Categorias de Conhecimento
- [x] Criar página de gestão de categorias de conhecimento
- [x] Adicionar botão "Gerir Categorias" na página de Base de Conhecimento (apenas para admin)
- [x] Implementar formulário de criação de categoria (nome, descrição, ícone)
- [x] Implementar listagem de categorias existentes
- [x] Adicionar funcionalidade de edição de categoria
- [x] Adicionar funcionalidade de eliminação de categoria (com validação se tem artigos)
- [x] Adicionar endpoints CRUD no backend para categorias de conhecimento
- [x] Testar criação, edição e eliminação de categorias

## Sistema de Tags para Artigos de Conhecimento
- [x] Criar schema de tags (id, name, color)
- [x] Criar schema de relacionamento artigo-tags (articleId, tagId)
- [x] Implementar CRUD de tags no backend
- [x] Adicionar endpoint para associar/desassociar tags de artigos
- [x] Criar interface de gestão de tags (página dedicada)
- [ ] Adicionar seletor de tags no formulário de criação/edição de artigos (funcionalidade futura)
- [ ] Mostrar tags nos cards de artigos (funcionalidade futura)
- [ ] Adicionar filtro por tags na pesquisa avançada (funcionalidade futura)
- [x] Implementar pesquisa de artigos por múltiplas tags (backend pronto)
- [ ] Adicionar página de visualização de artigos por tag (funcionalidade futura)
- [x] Testar sistema completo de tags

- [ ] Corrigir comportamento dos sub-menus da sidebar (devem permanecer abertos ao navegar nas páginas correspondentes)

## Bug: Menus da Sidebar Não Respondem a Cliques
- [x] Menu Gestão Interna não fecha quando clicado
- [x] Outros menus (Tickets, Clientes) não abrem quando clicados
- [x] Corrigir lógica de expansão para permitir toggle manual e expansão automática

## Bug: Clicar no Menu Principal Não Navega
- [x] Ao clicar em menu principal com sub-itens (ex: Tickets), apenas expande/colapsa mas não navega para a página
- [x] Adicionar navegação ao clicar no menu principal mantendo funcionalidade de toggle

## Módulo CRM - Desenvolvimento Completo

### Fase 1: Fundação - Schema e Estrutura Base
- [x] Criar schema de base de dados para leads
- [x] Criar schema de base de dados para oportunidades
- [x] Criar schema de base de dados para campanhas de marketing
- [x] Criar schema de base de dados para tarefas CRM
- [x] Criar schema de base de dados para interações/atividades
- [x] Criar schema de base de dados para documentos CRM
- [x] Criar schema de base de dados para configurações CRM (SMTP, lead scoring)
- [x] Adicionar menu "CRM" na sidebar com sub-itens
- [x] Criar estrutura de rotas para módulo CRM
- [x] Criar páginas base (layouts) para CRM

### Fase 2: Gestão de Leads
- [x] Criar página de listagem de leads com filtros
- [x] Implementar CRUD completo de leads
- [x] Adicionar estados do lead (novo, contactado, qualificado, não_qualificado, convertido)
- [x] Implementar lead scoring manual
- [x] Criar formulário de qualificação de lead
- [x] Implementar conversão de lead para oportunidade
- [ ] Adicionar histórico de interações ao perfil do lead (Fase 4)
- [x] Implementar atribuição de leads a vendedores

### Fase 3: Gestão de Oportunidades
- [ ] Criar página de listagem de oportunidades
- [x] Implementar CRUD completo de oportunidades (backend)
- [ ] Criar pipeline visual (Kanban drag-and-drop)
- [x] Implementar fases personalizáveis do pipeline (backend - moveStage)
- [x] Adicionar gestão de valores e probabilidades (backend)
- [ ] Criar página de detalhes da oportunidade (visão 360º)
- [x] Implementar conversão de oportunidade para cliente (backend)
- [x] Adicionar previsão de vendas (sales forecasting - backend getStats)

### Fase 4: Tarefas e Calendário
- [ ] Criar sistema de tarefas associadas a leads/oportunidades
- [ ] Implementar calendário integrado
- [ ] Adicionar lembretes e notificações de tarefas
- [ ] Criar visualização de agenda diária/semanal/mensal
- [ ] Implementar tipos de tarefas (chamada, reunião, email, follow-up)
- [ ] Adicionar funcionalidade de agendamento rápido

### Fase 5: Campanhas de Marketing
- [ ] Criar menu "Configurações CRM" para SMTP
- [ ] Implementar formulário de configuração de email
- [ ] Criar CRUD de campanhas de marketing
- [ ] Implementar segmentação de contactos para campanhas
- [ ] Criar editor de templates de email
- [ ] Adicionar funcionalidade de envio de campanhas
- [ ] Implementar rastreamento de métricas (aberturas, cliques)
- [ ] Criar página de análise de campanhas

### Fase 6: Análise e Relatórios
- [ ] Criar dashboard CRM principal
- [ ] Implementar widgets de métricas (leads, oportunidades, conversões)
- [ ] Adicionar gráficos de pipeline de vendas
- [ ] Criar relatórios de desempenho de vendedores
- [ ] Implementar relatórios de campanhas
- [ ] Adicionar exportação de relatórios (PDF, CSV, Excel)
- [ ] Criar visualizações de funil de vendas

### Fase 7: Automação
- [ ] Implementar motor de regras para automação
- [ ] Criar workflows automáticos (triggers, condições, ações)
- [ ] Adicionar lead scoring automático
- [ ] Implementar atribuição automática de leads
- [ ] Criar notificações automáticas
- [ ] Adicionar encaminhamento automático de tarefas

### Fase 8: Gestão de Documentos CRM
- [ ] Criar sistema de upload de documentos associados a leads/oportunidades
- [ ] Implementar controlo de versões
- [ ] Adicionar templates de documentos (propostas, contratos)
- [ ] Criar gerador de documentos a partir de templates
- [ ] Implementar permissões de acesso a documentos

### Fase 9: Roles e Permissões
- [ ] Criar roles personalizados (Vendedor, Gestor Vendas, Marketing)
- [ ] Implementar permissões por role
- [ ] Adicionar gestão de territórios de vendas
- [ ] Criar hierarquia de vendedores

### Testes e Validação
- [ ] Criar testes unitários para procedures CRM
- [ ] Testar fluxo completo Lead → Oportunidade → Cliente
- [ ] Validar automações e notificações
- [ ] Testar envio de campanhas de email
- [ ] Validar relatórios e dashboards

## Bug: Sidebar Não Aparece nas Páginas CRM
- [x] Páginas CRM não estão a usar PraiotelLayout
- [x] Atualizar CrmDashboard.tsx para usar PraiotelLayout
- [x] Atualizar Leads.tsx para usar PraiotelLayout
- [x] Atualizar Opportunities.tsx para usar PraiotelLayout
- [x] Atualizar Tasks.tsx para usar PraiotelLayout
- [x] Atualizar Campaigns.tsx para usar PraiotelLayout
- [x] Atualizar Reports.tsx para usar PraiotelLayout
- [x] Atualizar Settings.tsx para usar PraiotelLayout
- [x] Testar navegação em todas as páginas CRM

## Interface Kanban para Oportunidades
- [x] Instalar biblioteca @dnd-kit (core, sortable, utilities)
- [x] Criar componente KanbanBoard base
- [x] Implementar colunas do pipeline (5 fases)
- [x] Criar cards de oportunidade com valor/probabilidade
- [x] Implementar drag-and-drop entre colunas
- [x] Integrar com trpc.crmOpportunities.moveStage
- [x] Adicionar formulário de criação/edição de oportunidade
- [x] Testar drag-and-drop no browser (visual confirmado)

## Integração Clientes-CRM
- [x] Estender schema da tabela clients com campos CRM (source, leadId)
- [x] Executar db:push para aplicar alterações
- [x] Atualizar crmLeadsDb.convertLeadToClient para criar registo em clients
- [x] Atualizar crmOpportunitiesDb.convertOpportunityToClient
- [ ] Adicionar query para listar clientes com origem CRM (opcional)
- [ ] Testar conversão lead → cliente (requer dados de teste)
- [ ] Testar conversão oportunidade → cliente (requer dados de teste)

## Dashboard CRM com Dados Reais
- [x] Atualizar CrmDashboard.tsx para consumir trpc.crmLeads.getStats
- [x] Adicionar consumo de trpc.crmOpportunities.getStats
- [x] Substituir valores hardcoded por dados reais
- [x] Adicionar gráficos de pipeline com dados reais
- [x] Testar dashboard com dados vazios e com dados

## Teste de Fluxo Completo CRM
- [x] Criar script de seed com leads de teste (5 leads inseridos)
- [x] Criar oportunidades de teste (5 oportunidades inseridas)
- [x] Testar listagem de leads no browser (todos visíveis com badges)
- [x] Testar pipeline Kanban no browser (5 colunas com oportunidades)
- [ ] Testar conversão lead → oportunidade (com UI implementada)
- [ ] Testar conversão oportunidade → cliente (com UI implementada)
- [ ] Validar rastreabilidade (source, leadId) na tabela clients via SQL

## Botões de Conversão CRM
- [x] Adicionar botão "Converter em Oportunidade" nos cards de leads qualificados
- [x] Criar dialog de conversão lead → oportunidade com formulário pré-preenchido
- [x] Integrar com trpc.crmLeads.convertToOpportunity
- [x] Adicionar botão "Converter em Cliente" nos cards de oportunidades (fase Fechamento)
- [x] Criar dialog de conversão oportunidade → cliente com formulário
- [x] Integrar com trpc.crmOpportunities.convertToClient
- [ ] Testar conversões no browser e validar rastreabilidade (requer teste manual)

## Sistema de Histórico de Atividades
- [x] Criar backend de atividades (crmActivitiesDb.ts com queries)
- [x] Adicionar procedures tRPC para atividades (create, list, update, delete)
- [x] Criar componente ActivityTimeline.tsx reutilizável
- [x] Criar componente NewActivityDialog.tsx reutilizável
- [x] Integrar botão "Registar Atividade" na página Leads.tsx
- [x] Integrar botão "Registar Atividade" na página Opportunities.tsx
- [ ] Testar criação de atividade no browser (requer teste manual)
- [ ] Testar visualização de timeline ordenada por data (requer teste manual)

## Página de Tarefas CRM
- [x] Criar backend de tarefas (crmTasksDb.ts com queries)
- [x] Adicionar procedures tRPC para tarefas (create, list, update, delete, complete)
- [x] Criar interface de listagem de tarefas com filtros
- [x] Implementar formulário de criação/edição de tarefas
- [x] Adicionar filtros por status, prioridade, tipo, data de vencimento
- [x] Implementar marcação de tarefas como concluídas
- [ ] Adicionar vista de tarefas por calendário/agenda
- [x] Testar funcionalidades no browser

## Melhorias Sistema de Tarefas CRM
- [x] Implementar vista de calendário mensal para tarefas
- [x] Adicionar funcionalidade drag-and-drop para reagendar tarefas no calendário
- [x] Criar sistema de notificações automáticas de lembretes
- [x] Implementar job/worker para verificar tarefas com lembretes pendentes
- [x] Adicionar botão "Criar Tarefa" nos cards de Leads
- [x] Adicionar botão "Criar Tarefa" nos cards de Oportunidades
- [x] Pré-preencher leadId/opportunityId ao criar tarefa a partir de Lead/Oportunidade
- [x] Testar vista de calendário no browser
- [x] Testar drag-and-drop de tarefas
- [x] Testar criação rápida de tarefas a partir de Leads/Oportunidades
- [x] Testar sistema de notificações de lembretes

## Relatórios de Produtividade de Tarefas
- [x] Criar queries de análise de tarefas (por utilizador, período, tipo, prioridade)
- [x] Adicionar procedures tRPC para métricas de produtividade
- [x] Criar página de Relatórios com dashboard de métricas
- [x] Implementar gráficos de distribuição (por tipo, prioridade, estado)
- [x] Adicionar gráfico de conclusão de tarefas ao longo do tempo
- [x] Implementar ranking de utilizadores por produtividade
- [x] Adicionar filtros de período (última semana, mês, trimestre, ano)
- [x] Testar relatórios no browser

## Sistema de Tarefas Recorrentes
- [x] Adicionar campos de recorrência ao schema (isRecurring, recurrencePattern, recurrenceInterval)
- [x] Criar worker para processar tarefas recorrentes
- [x] Implementar lógica de criação automática de novas instâncias
- [x] Adicionar UI de configuração de recorrência no formulário de tarefas
- [x] Implementar opções de recorrência (diária, semanal, mensal)
- [x] Adicionar indicador visual de tarefas recorrentes na listagem
- [x] Testar criação e repetição automática de tarefas recorrentes

## Dashboard Pessoal "As Minhas Tarefas"
- [x] Criar queries de tarefas pessoais filtradas por utilizador autenticado
- [x] Adicionar procedures tRPC para estatísticas pessoais
- [x] Criar página "As Minhas Tarefas" com layout de dashboard
- [x] Implementar widget de estatísticas pessoais (total, concluídas, pendentes, atrasadas)
- [x] Adicionar widget de progresso semanal/mensal
- [x] Implementar lista de tarefas prioritárias do dia
- [x] Adicionar widget de tarefas próximas do vencimento
- [x] Implementar gráfico de produtividade pessoal
- [x] Adicionar filtros rápidos (hoje, esta semana, este mês)
- [x] Adicionar link de navegação no menu CRM
- [x] Testar dashboard no browser

## Ações Rápidas no Dashboard "As Minhas Tarefas"
- [x] Adicionar botões de ação inline nas listas de tarefas (concluir, editar, eliminar)
- [x] Implementar ação de marcar tarefa como concluída com um clique
- [x] Adicionar dialog de edição rápida de tarefa
- [x] Implementar confirmação de eliminação de tarefa
- [x] Adicionar feedback visual (toasts) para todas as ações
- [x] Implementar atualização otimista das listas após ações
- [x] Testar ações rápidas no browser

## Drag-and-Drop de Tarefas entre Estados
- [x] Instalar biblioteca @dnd-kit para drag-and-drop
- [x] Criar layout de colunas Kanban (Pendente, Em Progresso, Concluída)
- [x] Implementar drag-and-drop entre colunas
- [x] Adicionar atualização automática de estado ao soltar tarefa
- [x] Adicionar feedback visual durante o arrasto
- [x] Testar funcionalidade no browser

## Página de Campanhas CRM
- [x] Criar schema de campanhas no banco de dados (crm_campaigns, crm_campaign_contacts)
- [x] Adicionar campos: name, type, status, startDate, endDate, targetAudience, message, subject
- [x] Criar backend de campanhas (crmCampaignsDb.ts com queries)
- [x] Adicionar procedures tRPC para campanhas (create, list, update, delete, send)
- [x] Criar interface de listagem de campanhas com filtros
- [x] Implementar formulário de criação/edição de campanhas
- [x] Adicionar segmentação de público-alvo (por status de lead, tags, região)
- [x] Implementar envio de emails em massa
- [x] Adicionar dashboard de métricas (enviados, abertos, cliques, conversões)
- [x] Implementar tracking de abertura e cliques
- [x] Testar funcionalidades no browser

## Correção: Campo de Seleção de Cliente em Novo Ticket
- [x] Investigar erro "Nenhum cliente encontrado" no campo de seleção de cliente
- [x] Verificar query de clientes no backend
- [x] Corrigir query para buscar clientes da tabela correta
- [x] Testar seleção de cliente no formulário de novo ticket

## Correção: Erro toLowerCase ao Selecionar Cliente
- [x] Investigar erro "Cannot read properties of undefined (reading 'toLowerCase')"
- [x] Adicionar verificação de null/undefined nos campos de filtro
- [x] Testar seleção de cliente no browser

## Melhorias Formulário de Novo Ticket
- [x] Implementar validação em tempo real de campos obrigatórios
- [x] Adicionar feedback visual de erros antes do submit
- [x] Criar botão "Novo Cliente" no dropdown de seleção
- [x] Implementar dialog de criação rápida de cliente
- [x] Auto-completar localização ao selecionar cliente
- [x] Auto-completar contacto ao selecionar cliente
- [x] Testar funcionalidades no browser

## Correção: Pesquisa Dinâmica de Clientes no Novo Ticket
- [x] Investigar por que a query de clientes não está a retornar resultados
- [x] Verificar se trpc.clients.list está a funcionar corretamente
- [x] Corrigir lógica de pesquisa dinâmica para mostrar resultados conforme se escreve
- [x] Testar pesquisa de clientes no browser

## Histórico de Tickets e Notificações
- [x] Criar query backend para buscar últimos 5 tickets do cliente
- [x] Adicionar procedure tRPC para histórico de tickets
- [ ] Implementar widget de histórico de tickets no formulário de novo ticket
- [ ] Criar sistema de notificações ao técnico atribuído
- [ ] Enviar notificação ao criar ticket com técnico atribuído
- [ ] Testar histórico e notificações no browser

## Melhorias no Sistema de Tickets - Histórico e Notificações
- [x] Implementar widget de histórico de tickets do cliente no formulário de novo ticket
- [x] Mostrar últimos 5 tickets do cliente selecionado com status, prioridade e data
- [x] Criar query tRPC tickets.recentByClient para buscar histórico
- [x] Sistema de notificações automáticas ao técnico atribuído já implementado
- [x] Notificações enviadas quando ticket é criado e atribuído
- [x] Criar dados de teste (5 tickets para cliente Hotel Exemplo)
- [x] Criar utilizador de teste (admin@praiotel.pt / admin123)

## Sistema de Anexos de Ficheiros para Tickets
- [x] Verificar schema de anexos existente na base de dados
- [x] Criar procedures tRPC para upload e listagem de anexos
- [x] Implementar upload de ficheiros para S3 no backend
- [x] Criar componente de upload de ficheiros no formulário de novo ticket
- [x] Adicionar visualização de anexos na página de detalhes do ticket
- [x] Permitir download de anexos
- [x] Adicionar validação de tipos de ficheiro (imagens, PDFs, documentos)
- [x] Adicionar validação de tamanho máximo de ficheiro
- [x] Testar upload e visualização no browser

## Barra de Logotipos no Rodapé
- [x] Fazer upload da imagem BARRA_ACORES_PRR.png para S3
- [x] Adicionar componente de rodapé no layout principal
- [x] Testar visualização em diferentes tamanhos de ecrã

## Correção da Visualização do Rodapé
- [x] Verificar se rodapé está visível no browser
- [x] Diagnosticar problema de renderização (rodapé não estava no PraiotelLayout)
- [x] Implementar correção no layout (adicionar rodapé ao PraiotelLayout com flexbox)
- [x] Testar em diferentes páginas (Dashboard, Tickets, Clientes)
- [ ] Confirmar que logotipos aparecem corretamente

## Ajuste do Tamanho da Barra de Logotipos
- [x] Reduzir tamanho da imagem da barra em 50% no PraiotelLayout
- [x] Reduzir tamanho da imagem da barra em 50% no DashboardLayout
- [x] Testar visualização no browser

## Barra de Logotipos na Página de Login
- [x] Adicionar barra de logotipos abaixo do formulário de login
- [x] Testar visualização no browser

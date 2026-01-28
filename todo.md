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

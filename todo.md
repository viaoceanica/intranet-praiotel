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

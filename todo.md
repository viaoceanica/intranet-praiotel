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

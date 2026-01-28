# Guia de Testes de Produção - Intranet Praiotel

Este documento descreve os testes essenciais a realizar após cada publicação para garantir que todas as funcionalidades críticas estão operacionais em produção.

## 1. Autenticação e Acesso

### 1.1 Login
- [ ] Aceder a https://my.praiotel.pt
- [ ] Inserir credenciais válidas
- [ ] Verificar redirecionamento para dashboard após login bem-sucedido
- [ ] Confirmar que o nome do utilizador aparece no cabeçalho

### 1.2 Permissões
- [ ] Testar com utilizador normal: verificar que não vê opções de administração
- [ ] Testar com administrador: verificar acesso completo a todas as funcionalidades
- [ ] Testar com gestor: verificar permissões intermédias

## 2. Menu de Gestão Interna

### 2.1 Painel Inicial
- [ ] Aceder a "Gestão Interna" → "Painel Inicial"
- [ ] Verificar que as notícias internas são apresentadas
- [ ] Verificar que os acessos rápidos são clicáveis
- [ ] Testar criação de nova notícia (apenas admin/gestor)
- [ ] Testar criação de novo acesso rápido (apenas admin/gestor)

### 2.2 Área de Comunicação

#### Anúncios Gerais
- [ ] Aceder a "Gestão Interna" → "Anúncios Gerais"
- [ ] Verificar listagem de anúncios
- [ ] Criar novo anúncio com prioridade "urgente" (admin/gestor)
- [ ] Confirmar que notificação automática é enviada
- [ ] Verificar badges de prioridade (urgente, normal, baixa)

#### Mural de Mensagens
- [ ] Aceder a "Gestão Interna" → "Mural de Mensagens"
- [ ] Criar nova mensagem
- [ ] Adicionar like a uma mensagem
- [ ] Remover like de uma mensagem
- [ ] Verificar contador de likes atualizado

### 2.3 Gestão de Documentos
- [ ] Aceder a "Gestão Interna" → "Gestão de Documentos"
- [ ] **CRÍTICO**: Verificar que a página carrega sem erro React
- [ ] Testar pesquisa de documentos
- [ ] Filtrar por categoria (Todos, RH, Técnico, Administrativo)
- [ ] Carregar novo documento (admin/gestor, máx 10MB)
- [ ] Fazer download de documento existente
- [ ] Adicionar documento aos favoritos (clicar estrela)
- [ ] Remover documento dos favoritos
- [ ] Verificar que estrela muda de cor conforme estado

### 2.4 Base de Conhecimento
- [ ] Aceder a "Gestão Interna" → "Base de Conhecimento"
- [ ] Verificar listagem de artigos
- [ ] Verificar badge "Novo" em artigos recentes (< 7 dias)
- [ ] Verificar indicador visual de artigos não lidos (borda azul)
- [ ] Testar pesquisa avançada:
  - [ ] Pesquisa por termo
  - [ ] Filtro por categoria
  - [ ] Filtro por tags
  - [ ] Filtro por intervalo de datas
  - [ ] Ordenação (Mais recentes, Mais vistos, Mais comentados)
- [ ] Clicar num artigo para abrir detalhes
- [ ] **CRÍTICO**: Verificar que página de detalhes carrega sem erro
- [ ] Verificar que artigo é marcado como lido automaticamente
- [ ] Adicionar artigo aos favoritos
- [ ] Adicionar comentário ao artigo
- [ ] Verificar que notificação é enviada ao autor
- [ ] Adicionar segundo comentário (outro utilizador)
- [ ] Verificar que notificação é enviada aos participantes
- [ ] Eliminar comentário próprio
- [ ] Criar novo artigo com editor rich-text (admin/gestor)
- [ ] Testar formatação: negrito, itálico, títulos, listas, links

### 2.5 Os Meus Favoritos
- [ ] Aceder a "Gestão Interna" → "Os Meus Favoritos"
- [ ] Verificar que artigos e documentos favoritados aparecem
- [ ] Clicar para aceder a artigo/documento
- [ ] Remover favorito e verificar atualização

### 2.6 Analytics de Gestão Interna
- [ ] Aceder a "Gestão Interna" → "Analytics" (apenas admin/gestor)
- [ ] Verificar estatísticas gerais:
  - [ ] Total de artigos
  - [ ] Total de documentos
  - [ ] Total de anúncios
  - [ ] Taxa de leitura
- [ ] Verificar ranking de artigos mais vistos
- [ ] Verificar ranking de documentos mais descarregados

## 3. Sistema de Tickets (Funcionalidades Existentes)

### 3.1 Criação e Gestão
- [ ] Criar novo ticket
- [ ] Atribuir ticket a técnico
- [ ] Adicionar comentário a ticket
- [ ] Alterar estado do ticket
- [ ] Verificar cálculo de SLA

### 3.2 Notificações
- [ ] Verificar notificação ao criar ticket
- [ ] Verificar notificação ao atribuir ticket
- [ ] Verificar notificação ao adicionar comentário

## 4. Gestão de Clientes

- [ ] Aceder a "Clientes"
- [ ] Criar novo cliente
- [ ] Editar cliente existente
- [ ] Pesquisar cliente
- [ ] Verificar listagem de tickets associados

## 5. Gestão de Utilizadores

- [ ] Aceder a "Utilizadores" (apenas admin)
- [ ] Criar novo utilizador
- [ ] Editar utilizador existente
- [ ] Alterar função de utilizador (admin, gestor, user)
- [ ] Desativar utilizador

## 6. Testes de Performance

- [ ] Verificar tempo de carregamento da página inicial (< 3 segundos)
- [ ] Verificar tempo de resposta ao criar ticket (< 2 segundos)
- [ ] Verificar tempo de upload de documento (< 5 segundos para 5MB)
- [ ] Testar navegação entre páginas (transições suaves)

## 7. Testes de Responsividade

- [ ] Testar em desktop (1920x1080)
- [ ] Testar em tablet (768x1024)
- [ ] Testar em mobile (375x667)
- [ ] Verificar menu lateral responsivo
- [ ] Verificar tabelas com scroll horizontal em mobile

## 8. Testes de Segurança

- [ ] Tentar aceder a página de admin sem permissões
- [ ] Verificar que utilizador normal não vê botões de admin
- [ ] Tentar editar conteúdo de outro utilizador
- [ ] Verificar que sessão expira após inatividade

## Checklist de Publicação

Antes de considerar a publicação bem-sucedida, confirmar:

- [ ] Todos os testes críticos (marcados com **CRÍTICO**) passaram
- [ ] Não há erros no console do browser
- [ ] Não há erros 404 em recursos (imagens, CSS, JS)
- [ ] Todas as notificações estão a ser enviadas corretamente
- [ ] Sistema de favoritos funciona em todas as páginas
- [ ] Sistema de comentários funciona corretamente
- [ ] Pesquisa avançada retorna resultados esperados
- [ ] Upload e download de documentos funcionam
- [ ] Editor rich-text salva formatação corretamente

## Registo de Testes

| Data | Versão | Testador | Resultado | Observações |
|------|--------|----------|-----------|-------------|
| 28/01/2026 | 4c5e3c8c | - | Pendente | Correção erro React #310 |

## Contactos em Caso de Erro

- **Erro crítico em produção**: Fazer rollback imediato para versão anterior
- **Erro não crítico**: Documentar no GitHub Issues e corrigir na próxima versão
- **Dúvidas**: Consultar documentação técnica no README.md do projeto

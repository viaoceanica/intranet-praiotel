# Requisitos do Módulo CRM - Intranet Praiotel

## Análise dos Documentos Recebidos

### Proforma FP2025/157 - Via Oceânica
**12 Funcionalidades Principais:**

1. **Gestão de Contactos** - Centralização e organização de todos os contactos (clientes, leads, parceiros)
2. **Gestão de Leads** - Acompanhamento dos potenciais clientes ao longo do ciclo de vendas
3. **Automação de Marketing** - Criação e gestão de campanhas de marketing automatizadas (e-mails, newsletters)
4. **Gestão de Oportunidades de Venda** - Identificação, seguimento e análise de oportunidades de negócio
5. **Gestão de Tarefas e Calendário** - Agendamento de reuniões, lembretes e atividades integrados num calendário
6. **Análise de Vendas e Relatórios** - Relatórios detalhados sobre desempenho de vendas e produtividade
7. **Gestão de Pipeline de Vendas** - Visualização do processo de vendas em todas as fases do funil
8. **Integração com E-mail** - Sincronização com contas de e-mail
9. **Automação de Fluxo de Trabalho** - Definição de regras e automatização de tarefas repetitivas
10. **Base de Conhecimento** - Repositório de informações úteis (FAQ, guias, artigos)
11. **Segmentação de Clientes** - Classificação dos contactos em grupos específicos
12. **Gestão de Documentos** - Armazenamento e partilha de documentos importantes (propostas, contratos)

### Especificações Técnicas Detalhadas

#### 2.1. Gestão de Contactos (Customer 360 View)
- CRUD completo para contactos (clientes, leads, parceiros)
- Perfil unificado com visão 360º: histórico de interações, transações, e-mails, documentos
- Deteção e fusão de contactos duplicados

#### 2.2. Gestão de Leads
- Acompanhamento do ciclo de vida (captura, qualificação, nutrição, conversão)
- **AI-Powered Lead Scoring**: Pontuação automática baseada em dados demográficos e comportamentais
- Atribuição automática de leads a vendedores com base em regras

#### 2.3. Automação de Marketing
- Criação e gestão de campanhas de e-mail com templates personalizáveis
- Segmentação avançada de contactos
- Rastreamento de métricas (aberturas, cliques, conversões)
- A/B Testing para otimização

#### 2.4. Gestão de Oportunidades de Venda
- CRUD de oportunidades associadas a contactos com valor estimado
- **Sales Forecasting**: Previsão de vendas baseada em dados históricos
- **Predictive Analytics**: Análise preditiva para identificar oportunidades com maior probabilidade de fecho

#### 2.5. Gestão de Tarefas e Calendário
- Calendário integrado com agendamento de reuniões, tarefas e lembretes
- Sincronização bidirecional com calendários externos (Google Calendar, Outlook)
- Notificações inteligentes e personalizáveis

#### 2.6. Análise e Relatórios
- Geração de relatórios detalhados (vendas, produtividade)
- Dashboards personalizáveis por perfil de utilizador
- Exportação de relatórios (PDF, CSV, Excel)
- **Customer Sentiment Analysis**: Análise de sentimento a partir de interações

#### 2.7. Pipeline de Vendas
- Visualização gráfica (Kanban/Funil)
- Funcionalidade drag-and-drop entre fases
- Definição de fases e critérios de transição personalizáveis

#### 2.8. Automação de Fluxos de Trabalho
- Motor de regras para automatizar tarefas (triggers, condições, ações)
- **Approval Workflows**: Fluxos de aprovação para descontos, propostas
- **Automated Case Routing**: Encaminhamento automático de pedidos de suporte

#### 2.10. Gestão de Documentos
- Armazenamento de ficheiros associados a contactos, oportunidades
- Controlo de versões e permissões de acesso
- Geração de documentos a partir de templates (propostas, contratos)

## Pontos Importantes

### ⚠️ Não Duplicar
- **Clientes**: Já existe tabela e gestão de clientes na intranet
- **Utilizadores**: Sistema de utilizadores já implementado

### 🔄 Integrar/Complementar
- Usar tabela de clientes existente como base para contactos CRM
- Integrar com sistema de utilizadores para atribuição de leads/oportunidades
- Aproveitar sistema de notificações existente
- Integrar com gestão de documentos existente

## Próximos Passos - Abordagem por Etapas

### Fase 1: Fundação (Schema e Estrutura Base)
- Criar schema de base de dados para CRM (leads, oportunidades, campanhas, tarefas)
- Adicionar menu "CRM" na sidebar
- Criar estrutura de rotas e páginas base

### Fase 2: Gestão de Leads
- CRUD de leads
- Estados do lead (novo, contactado, qualificado, convertido, perdido)
- Atribuição de leads a vendedores
- Conversão de lead para cliente

### Fase 3: Gestão de Oportunidades
- CRUD de oportunidades
- Pipeline visual (Kanban)
- Fases personalizáveis
- Valores e previsões

### Fase 4: Tarefas e Calendário
- Sistema de tarefas associadas a leads/oportunidades
- Calendário integrado
- Lembretes e notificações

### Fase 5: Campanhas de Marketing
- Criação de campanhas
- Segmentação de contactos
- Templates de e-mail
- Métricas de interação

### Fase 6: Análise e Relatórios
- Dashboard CRM
- Relatórios de vendas
- Métricas de desempenho
- Exportação de dados

### Fase 7: Automação
- Motor de regras
- Workflows automáticos
- Lead scoring automático
- Encaminhamento automático

### Fase 8: Funcionalidades Avançadas (AI/ML)
- Lead scoring com IA
- Previsão de vendas
- Análise preditiva
- Análise de sentimento

## Questões Iniciais

Antes de começar, preciso esclarecer:

1. **Prioridades**: Qual a ordem de prioridade das funcionalidades? Todas são necessárias na primeira versão?

2. **Integração com Clientes**: Os "contactos" do CRM devem ser uma extensão da tabela de clientes existente ou uma tabela separada?

3. **Leads vs Clientes**: Como distinguir um lead de um cliente? Um lead convertido torna-se automaticamente um cliente na tabela existente?

4. **E-mail**: Para automação de marketing, já tem serviço de e-mail configurado (ex: SendGrid, Resend)?

5. **Calendário**: Pretende sincronização real com Google Calendar/Outlook ou apenas calendário interno?

6. **Funcionalidades AI/ML**: As funcionalidades de IA (lead scoring, previsão de vendas, análise de sentimento) são prioritárias ou podem ser implementadas numa fase posterior?

7. **Permissões**: Que roles devem ter acesso ao CRM? Apenas vendedores e gestores ou também técnicos?

8. **Documentos**: Deve usar o sistema de gestão de documentos existente ou criar um específico para o CRM?

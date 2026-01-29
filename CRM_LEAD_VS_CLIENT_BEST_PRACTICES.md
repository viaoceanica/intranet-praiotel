# Melhores Práticas: Leads vs Clientes em CRM

## Resumo da Pesquisa

Com base nas melhores práticas da indústria, aqui está a estrutura recomendada para distinguir Leads, Oportunidades e Clientes no sistema CRM.

## Definições

### 1. **Lead (Potencial Cliente)**
Um lead é uma pessoa ou empresa que demonstrou interesse inicial no produto ou serviço, mas ainda não foi qualificada. Leads estão no **topo do funil de vendas**.

**Características:**
- Interesse baixo ou desconhecido em comprar
- Informação básica capturada (nome, email, telefone, origem)
- Não qualificado - precisa ser validado
- Adquirido através de atividades de marketing (formulários, eventos, anúncios)

**Exemplo:** Um visitante do site preenche um formulário para descarregar um catálogo de produtos.

### 2. **Oportunidade (Opportunity)**
Uma oportunidade é um lead qualificado que demonstrou alta intenção de compra e está pronto para avançar no processo de vendas. Oportunidades estão no **meio-fundo do funil**.

**Características:**
- Alta intenção de compra
- Qualificado através de critérios específicos
- Informação detalhada capturada (orçamento, timeline, necessidades)
- Atribuído a um vendedor
- Discussões sobre preços, prazos e requisitos

**Exemplo:** O mesmo visitante participa num webinar, solicita informação de preços e partilha o seu timeline de implementação.

### 3. **Cliente (Customer)**
Um cliente é uma oportunidade que foi convertida com sucesso - realizou uma compra e tem um relacionamento comercial ativo com a empresa.

**Características:**
- Compra realizada
- Contrato ativo ou histórico de transações
- Relacionamento comercial estabelecido
- Gestão de pós-venda e suporte

## Processo de Conversão

### Lead → Oportunidade

**Critérios de Qualificação (quando converter):**

1. ✅ **Intenção de Compra** - Expressou interesse claro em comprar
2. ✅ **Orçamento** - Discutiu ou revelou capacidade financeira
3. ✅ **Timeline** - Tem prazo definido para tomar decisão
4. ✅ **Fit do Produto** - O produto/serviço resolve a necessidade
5. ✅ **Stakeholders** - Identificou ou reuniu com decisores-chave

**Ações:**
- Atribuir a um vendedor específico
- Criar registo de oportunidade com valor estimado
- Mover para pipeline de vendas (Kanban)
- Iniciar acompanhamento ativo

### Oportunidade → Cliente

**Critérios de Conversão:**

1. ✅ **Proposta Aceite** - Cliente aceitou proposta comercial
2. ✅ **Contrato Assinado** - Acordo formalizado
3. ✅ **Pagamento Recebido** - Primeira transação concluída
4. ✅ **Serviço Ativado** - Produto/serviço em uso

**Ações:**
- Criar registo de cliente na tabela de clientes
- Transferir histórico de interações
- Iniciar processo de onboarding
- Ativar suporte pós-venda

## Estrutura de Dados Recomendada

### Tabela: Leads
```
- id
- nome
- email
- telefone
- empresa
- cargo
- origem (formulário, evento, anúncio, referência)
- estado (novo, contactado, qualificado, não_qualificado, convertido)
- pontuação (lead scoring 0-100)
- data_criacao
- data_ultima_interacao
- notas
```

### Tabela: Oportunidades
```
- id
- lead_id (referência)
- titulo
- valor_estimado
- probabilidade (%)
- fase (prospecção, qualificação, proposta, negociação, fechamento)
- vendedor_id (utilizador atribuído)
- data_criacao
- data_fecho_prevista
- data_fecho_real
- estado (aberta, ganha, perdida)
- notas
```

### Tabela: Clientes (existente - estender)
```
- id (já existe)
- lead_id (adicionar - referência ao lead original)
- oportunidade_id (adicionar - referência à oportunidade que converteu)
- ... (campos existentes)
- data_primeira_compra (adicionar)
- valor_total_vendas (adicionar)
- estado_cliente (ativo, inativo, churn)
```

## Estados do Lead

1. **Novo** - Lead acabou de entrar no sistema
2. **Contactado** - Primeira tentativa de contacto realizada
3. **Qualificado** - Passou nos critérios de qualificação
4. **Não Qualificado** - Não passa nos critérios (arquivar)
5. **Convertido** - Transformado em oportunidade

## Fases da Oportunidade (Pipeline)

1. **Prospecção** - Contacto inicial, descoberta de necessidades
2. **Qualificação** - Validação de orçamento, timeline, fit
3. **Proposta** - Apresentação de solução e proposta comercial
4. **Negociação** - Discussão de termos, preços, condições
5. **Fechamento** - Assinatura de contrato e conversão em cliente

## Automação Recomendada

### Lead Scoring Automático
Atribuir pontos baseados em:
- **Comportamento**: Visitas ao site (+5), Download de material (+10), Participação em webinar (+20)
- **Demografia**: Cargo de decisão (+15), Empresa de tamanho adequado (+10), Indústria-alvo (+10)
- **Engajamento**: Abertura de emails (+5), Resposta a emails (+15), Pedido de reunião (+30)

**Threshold:** Lead com 50+ pontos → Notificar vendedor para qualificação

### Conversão Automática
- Lead qualificado com pontuação 70+ → Criar oportunidade automaticamente
- Oportunidade em "Fechamento" + Contrato assinado → Converter em cliente

### Notificações
- Lead novo → Notificar equipa de vendas
- Lead sem contacto há 7 dias → Lembrete automático
- Oportunidade sem atualização há 14 dias → Alerta ao gestor
- Oportunidade em risco (timeline expirado) → Notificação urgente

## Implementação na Intranet Praiotel

### Decisões Tomadas

1. **Contactos CRM = Extensão de Clientes**
   - Tabela de clientes existente será a base
   - Adicionar campos para distinguir leads/oportunidades/clientes
   - Permitir criação de contactos novos que ainda não são clientes

2. **Fluxo:**
   ```
   Lead (novo contacto) → Oportunidade (qualificado) → Cliente (convertido)
   ```

3. **Permissões:**
   - Fase inicial: Apenas Admin
   - Fase futura: Roles personalizados (Vendedor, Gestor Vendas, Marketing)

4. **Documentos:**
   - Sistema específico para CRM (propostas, contratos, apresentações)
   - Separado da gestão de documentos gerais da intranet

5. **Configurações:**
   - Menu "Configurações CRM" para configurar SMTP de email marketing
   - Configurações de lead scoring
   - Definição de fases do pipeline
   - Templates de email

## Próximos Passos

Implementar em fases conforme plano:
1. Schema de base de dados (leads, oportunidades, campanhas, tarefas)
2. CRUD de Leads com estados
3. Conversão Lead → Oportunidade
4. Pipeline visual (Kanban)
5. Sistema de tarefas
6. Campanhas de marketing
7. Relatórios e análises
8. Automação e IA (fase posterior)

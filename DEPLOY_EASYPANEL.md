# Deploy no Easypanel - Intranet Praiotel

Este guia explica como fazer deploy da aplicação Intranet Praiotel no Easypanel usando o GitHub.

## Pré-requisitos

1. Conta no Easypanel
2. Repositório GitHub com o código da aplicação
3. Base de dados MySQL/TiDB configurada
4. Variáveis de ambiente do sistema Manus

## Passos para Deploy

### 1. Criar Novo Projeto no Easypanel

1. Aceda ao painel do Easypanel
2. Clique em "Create Project"
3. Selecione "GitHub" como fonte
4. Conecte o repositório `intranet-praiotel`
5. Selecione a branch principal (geralmente `main` ou `master`)

### 2. Configurar Build

- **Build Method**: Docker
- **Dockerfile Path**: `Dockerfile` (na raiz do projeto)
  - **Nota**: O Easypanel pode ser case-sensitive. Se encontrar erro "dockerfile not found", tente:
    - `Dockerfile` (com D maiúsculo - padrão)
    - `dockerfile` (minúsculas - se o sistema for case-sensitive)
- **Context**: `.` (raiz do projeto)
- **Auto Deploy**: Ativado (para deploy automático em cada push)

### 3. Configurar Variáveis de Ambiente

#### Variáveis de Build (Build Args)

Estas variáveis são necessárias durante o build do frontend (Vite). Configure-as na secção "Build Arguments" do Easypanel:

```
VITE_APP_ID=<seu_app_id>
VITE_APP_LOGO=<url_do_logo>
VITE_APP_TITLE=Intranet Praiotel
VITE_OAUTH_PORTAL_URL=<url_oauth_portal>
VITE_ANALYTICS_ENDPOINT=<endpoint_analytics>
VITE_ANALYTICS_WEBSITE_ID=<website_id>
VITE_FRONTEND_FORGE_API_KEY=<api_key_frontend>
VITE_FRONTEND_FORGE_API_URL=<api_url_frontend>
```

#### Variáveis de Runtime

Estas variáveis são necessárias durante a execução da aplicação. Configure-as na secção "Environment Variables":

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<mysql_connection_string>
JWT_SECRET=<secret_aleatorio_seguro>
OAUTH_SERVER_URL=<url_servidor_oauth>
OWNER_OPEN_ID=<owner_open_id>
OWNER_NAME=<nome_do_proprietario>
BUILT_IN_FORGE_API_URL=<api_url>
BUILT_IN_FORGE_API_KEY=<api_key>
```

**Nota importante sobre variáveis Manus**: Se estiver a usar o sistema Manus, estas variáveis já estão configuradas automaticamente no ambiente Manus. Para deploy externo no Easypanel, você precisará copiar os valores do painel Manus (Settings > Secrets).

### 4. Configurar Base de Dados

#### Opção A: Usar Base de Dados Manus (Recomendado)

Se já tem o projecto no Manus:
1. Aceda ao painel Manus > Database
2. Nas configurações (ícone de engrenagem no canto inferior esquerdo), copie a **Connection String**
3. Cole na variável `DATABASE_URL` no Easypanel
4. **Importante**: Ative SSL na connection string adicionando `?ssl={"rejectUnauthorized":true}` no final

Exemplo:
```
mysql://usuario:password@host:3306/database?ssl={"rejectUnauthorized":true}
```

#### Opção B: Criar Nova Base de Dados no Easypanel

1. No painel do Easypanel, vá em "Databases"
2. Clique em "Create Database"
3. Selecione "MySQL"
4. Copie a connection string gerada
5. Cole na variável `DATABASE_URL`

**Formato da connection string:**
```
mysql://usuario:password@host:3306/database_name
```

### 5. Migrações da Base de Dados

As migrações **NÃO** são executadas automaticamente no arranque. Você precisa executá-las manualmente após o primeiro deploy:

1. Após o deploy bem-sucedido, aceda ao terminal do container no Easypanel
2. Execute o comando:
   ```bash
   pnpm db:push
   ```
3. Aguarde a conclusão das migrações

**Importante**: Execute `pnpm db:push` sempre que houver alterações no schema da base de dados.

### 6. Configurar Domínio

1. No painel do projeto, vá em "Domains"
2. Adicione o seu domínio personalizado
3. Configure os registos DNS conforme indicado pelo Easypanel:
   - **Tipo A**: Aponte para o IP fornecido
   - **Tipo CNAME**: Aponte para o hostname fornecido
4. Ative SSL/TLS automático (Let's Encrypt)

### 7. Deploy

1. Clique em "Deploy" ou faça push para o repositório GitHub
2. Aguarde o build completar (pode demorar 5-10 minutos no primeiro deploy)
3. Verifique os logs para confirmar que não há erros
4. Aceda ao domínio configurado para testar

## Healthcheck

A aplicação inclui um endpoint `/health` que o Easypanel usa para monitorizar o estado:

```
GET https://seu-dominio.com/health
```

**Resposta esperada**: `200 OK`

O healthcheck está configurado no Dockerfile para verificar a cada 30 segundos.

## Estrutura do Projeto

```
intranet-praiotel/
├── client/              # Frontend React + Vite
│   ├── src/
│   └── public/
├── server/              # Backend Express + tRPC
│   ├── _core/          # Core do servidor
│   ├── routers.ts      # Rotas tRPC
│   └── db.ts           # Queries da base de dados
├── drizzle/            # Schema e migrações
├── shared/             # Código partilhado
├── storage/            # Helpers de S3
├── Dockerfile          # Configuração Docker
├── .dockerignore       # Ficheiros a ignorar no build
└── package.json        # Dependências e scripts
```

## Troubleshooting

### Build falha com "failed to read dockerfile: no such file or directory"
- **Causa**: O Easypanel está configurado para procurar o ficheiro com nome diferente
- **Solução**: 
  1. No Easypanel, verifique o campo "Dockerfile Path"
  2. Tente estas variações:
     - `Dockerfile` (com D maiúsculo)
     - `dockerfile` (minúsculas)
  3. Certifique-se que o "Context" está definido como `.` (raiz do projeto)

### Build falha com "pnpm: command not found"
- **Causa**: Corepack não está ativado
- **Solução**: O Dockerfile já inclui `corepack enable`. Verifique que está a usar a imagem `node:20-alpine`

### Build falha com "Cannot find module 'wouter'"
- **Causa**: Patches não foram copiados
- **Solução**: O Dockerfile já copia a pasta `patches`. Verifique que o `.dockerignore` não está a excluí-la

### Aplicação não inicia (Exit Code 1)
- **Causa**: Variáveis de ambiente em falta ou incorretas
- **Solução**: 
  1. Verifique os logs no Easypanel
  2. Confirme que todas as variáveis de ambiente estão configuradas
  3. Verifique especialmente `DATABASE_URL` e `JWT_SECRET`

### Erro 502 Bad Gateway
- **Causa**: Aplicação não está a escutar na porta correta
- **Solução**: 
  1. Verifique que `PORT=3000` está configurado
  2. Confirme que o healthcheck está a responder
  3. Verifique os logs para erros de arranque

### Erro de conexão à base de dados
- **Causa**: Connection string incorreta ou SSL não configurado
- **Solução**:
  1. Verifique o formato da connection string
  2. Para TiDB/Manus, adicione `?ssl={"rejectUnauthorized":true}`
  3. Teste a conexão manualmente usando um cliente MySQL

### Migrações não aplicadas
- **Causa**: `pnpm db:push` não foi executado
- **Solução**:
  1. Aceda ao terminal do container
  2. Execute `pnpm db:push`
  3. Verifique os logs para confirmar sucesso

### Assets não carregam (404)
- **Causa**: Ficheiros não foram copiados corretamente no build
- **Solução**: O Dockerfile copia `dist/`, `server/`, `drizzle/`, `shared/` e `storage/`. Verifique que o build do Vite está a gerar os assets corretamente.

## Rollback

Para fazer rollback para uma versão anterior:

1. No painel do Easypanel, vá em "Deployments"
2. Selecione o deployment anterior que estava funcional
3. Clique em "Redeploy"
4. Aguarde o processo completar

## Monitorização

O Easypanel oferece ferramentas integradas de monitorização:

- **Logs em tempo real**: Aceda à tab "Logs" para ver output do servidor
- **Métricas de recursos**: CPU, memória e disco em "Metrics"
- **Healthcheck status**: Indicador visual do estado da aplicação
- **Histórico de deployments**: Lista de todos os deploys com timestamps

### Alertas Recomendados

Configure alertas para:
- Healthcheck failures (3 falhas consecutivas)
- CPU > 80% por mais de 5 minutos
- Memória > 90% por mais de 5 minutos
- Downtime > 2 minutos

## Performance e Otimização

### Build Multi-Stage

O Dockerfile usa build multi-stage para optimizar:
1. **Base**: Configuração comum
2. **Deps**: Instalação de dependências
3. **Builder**: Build da aplicação
4. **Runner**: Imagem final mínima

Isto resulta numa imagem final de ~200MB (vs ~1GB sem optimização).

### Cache de Dependências

O Easypanel faz cache das layers do Docker. Para aproveitar:
- Evite alterar `package.json` desnecessariamente
- Use `pnpm install --frozen-lockfile` (já configurado)

### Recursos Recomendados

Para produção:
- **CPU**: 1 vCPU (mínimo) / 2 vCPU (recomendado)
- **RAM**: 512MB (mínimo) / 1GB (recomendado)
- **Disco**: 2GB (mínimo) / 5GB (recomendado)

## Segurança

### Boas Práticas Implementadas

✅ **Usuário não-root**: O container roda como `appuser`  
✅ **Secrets via ENV**: Credenciais nunca no código  
✅ **SSL/TLS**: Certificado automático via Let's Encrypt  
✅ **Healthcheck**: Monitorização contínua do estado  
✅ **Build mínimo**: Apenas ficheiros necessários em produção

### Checklist de Segurança

Antes de ir para produção:

- [ ] `JWT_SECRET` é uma string aleatória forte (mínimo 32 caracteres)
- [ ] `DATABASE_URL` usa SSL (`?ssl={"rejectUnauthorized":true}`)
- [ ] Todas as variáveis `VITE_*` estão configuradas
- [ ] Domínio tem SSL/TLS ativado
- [ ] Firewall configurado (se aplicável)
- [ ] Backups da base de dados configurados

## Suporte

### Documentação Oficial

- **Easypanel**: https://easypanel.io/docs
- **Manus**: https://help.manus.im

### Problemas Comuns

Se encontrar problemas não listados neste guia:
1. Verifique os logs no Easypanel (tab "Logs")
2. Teste localmente com Docker: `docker build -t praiotel-test .`
3. Consulte a documentação do Easypanel
4. Contacte o suporte do Easypanel ou Manus

## Atualizações

Para atualizar a aplicação:

1. Faça push das alterações para o repositório GitHub
2. O Easypanel fará deploy automático (se configurado)
3. Ou clique manualmente em "Deploy" no painel
4. Aguarde o build completar
5. Verifique os logs para confirmar sucesso

**Nota**: Se houver alterações no schema da base de dados, execute `pnpm db:push` após o deploy.

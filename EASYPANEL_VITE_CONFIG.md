# Configuração de Variáveis VITE no Easypanel

## ⚠️ Problema Identificado

O erro `TypeError: Failed to construct 'URL': Invalid URL` acontece porque as variáveis de ambiente `VITE_*` não foram configuradas corretamente no Easypanel. Estas variáveis precisam ser definidas como **Build Arguments**, não apenas como variáveis de runtime.

---

## 📋 Diferença Entre Build Arguments e Environment Variables

### Build Arguments (--build-arg)
- Usadas **durante o build** da imagem Docker
- Necessárias para variáveis `VITE_*` porque o Vite compila o frontend em tempo de build
- Os valores são "embutidos" no código JavaScript compilado

### Environment Variables
- Usadas **durante a execução** do container
- Necessárias para variáveis de backend (DATABASE_URL, JWT_SECRET, etc.)
- Os valores são lidos em runtime pelo servidor Node.js

---

## 🔧 Passo-a-Passo: Configurar no Easypanel

### 1. Aceder às Configurações do Serviço

1. No painel do Easypanel, clique no seu projeto **intra-praiotel**
2. Clique na aba **"Services"** ou **"App"**
3. Clique em **"Settings"** ou **"Configure"**

### 2. Adicionar Build Arguments

Procure a secção **"Build"** ou **"Build Arguments"** e adicione as seguintes variáveis:

```
VITE_APP_TITLE=Intranet Praiotel
VITE_APP_LOGO=https://cdn.manus.space/user-upload/2tvrCaJBV8I6gabDLa4YCL/BARRA_ACORES_PRR-1739798095862.png
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=seu_frontend_api_key_aqui
VITE_APP_ID=seu_app_id_aqui
VITE_ANALYTICS_WEBSITE_ID=seu_analytics_id_aqui
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
```

**⚠️ IMPORTANTE:** Se não tiver os valores reais para `VITE_FRONTEND_FORGE_API_KEY`, `VITE_APP_ID` e `VITE_ANALYTICS_WEBSITE_ID`, pode usar valores temporários:

```
VITE_FRONTEND_FORGE_API_KEY=temp_key_replace_later
VITE_APP_ID=temp_app_id
VITE_ANALYTICS_WEBSITE_ID=temp_analytics_id
```

### 3. Adicionar Environment Variables (Runtime)

Na secção **"Environment Variables"** ou **"Env"**, adicione:

```
DATABASE_URL=mysql://seu_usuario:sua_senha@seu_host:4000/seu_database?ssl={"rejectUnauthorized":true}
JWT_SECRET=seu_jwt_secret_seguro_aqui
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=seu_owner_open_id
OWNER_NAME=Seu Nome
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=seu_backend_api_key_aqui
NODE_ENV=production
```

**📝 Nota:** O `DATABASE_URL` deve ser a string de conexão completa fornecida pelo TiDB Cloud.

### 4. Rebuild e Deploy

1. Após adicionar todas as variáveis, clique em **"Save"** ou **"Update"**
2. Clique em **"Rebuild"** ou **"Redeploy"** para forçar um novo build
3. Aguarde o build completar (pode demorar 2-3 minutos)
4. Acesse https://my.praiotel.pt/ para verificar se o erro foi corrigido

---

## 🧪 Como Testar Se Funcionou

Após o rebuild, acesse https://my.praiotel.pt/ e:

1. ✅ **Sucesso:** A página de login aparece sem erros
2. ❌ **Ainda com erro:** Verifique os logs do build no Easypanel para ver se as variáveis foram aplicadas

### Ver Logs do Build

No Easypanel:
1. Clique no serviço **intra-praiotel**
2. Clique na aba **"Logs"** ou **"Build Logs"**
3. Procure por linhas que mostram as variáveis VITE sendo usadas durante o build

---

## 🔍 Troubleshooting

### Erro persiste após configurar variáveis

1. **Verifique se usou Build Arguments (não Environment Variables) para VITE_***
   - As variáveis `VITE_*` DEVEM estar em Build Arguments
   - Variáveis sem `VITE_` vão em Environment Variables

2. **Limpe o cache do build**
   - No Easypanel, procure opção "Clear Build Cache" ou "Clean Build"
   - Faça rebuild após limpar o cache

3. **Verifique os logs do browser**
   - Abra https://my.praiotel.pt/
   - Pressione F12 para abrir DevTools
   - Vá para a aba "Console"
   - Procure por erros relacionados a URLs ou variáveis undefined

### Como obter os valores reais das variáveis Manus

Se estiver a usar o sistema de autenticação e APIs do Manus:

1. **VITE_APP_ID** e **VITE_FRONTEND_FORGE_API_KEY**
   - Estas são fornecidas pelo Manus quando cria uma aplicação OAuth
   - Se não tiver, pode desativar temporariamente a autenticação OAuth

2. **Alternativa: Desativar OAuth temporariamente**
   - Edite o código para usar apenas login local (email/password)
   - Remova dependências de variáveis Manus
   - Isto requer alterações no código (posso ajudar se necessário)

---

## 📞 Próximos Passos

Após configurar as variáveis e fazer rebuild:

1. ✅ Verifique se o site carrega sem erros
2. ✅ Teste o login com as credenciais: `admin@praiotel.pt` / `admin123`
3. ✅ Execute as migrações da base de dados (se ainda não fez):
   ```bash
   # No terminal do container no Easypanel
   pnpm db:push
   ```

---

## 📚 Referências

- [Documentação Vite - Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Build Arguments](https://docs.docker.com/engine/reference/commandline/build/#build-arg)
- Ficheiro `DEPLOY_EASYPANEL.md` no projeto para mais detalhes

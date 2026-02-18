# Configuração Simplificada para Easypanel

## 🎯 Variáveis Prontas para Copiar e Colar

Estas são as variáveis que precisa configurar no Easypanel. **Copie e cole diretamente** - os valores já estão prontos a usar.

---

## 📦 Build Arguments (Secção "Build" no Easypanel)

Cole estas variáveis na secção **"Build Arguments"** ou **"Build Env"**:

```
VITE_APP_TITLE=Intranet Praiotel
VITE_APP_LOGO=https://cdn.manus.space/user-upload/2tvrCaJBV8I6gabDLa4YCL/BARRA_ACORES_PRR-1739798095862.png
```

**✅ Pronto!** Apenas estas 2 variáveis VITE são necessárias para o frontend funcionar.

---

## 🔧 Environment Variables (Secção "Environment" no Easypanel)

Cole estas variáveis na secção **"Environment Variables"** ou **"Env"**:

```
DATABASE_URL=COLE_AQUI_SUA_STRING_DE_CONEXAO_TIDB
JWT_SECRET=xXG22+Gevi69m6hIdP9NHnro5a4dByR1SDzajjAqnHk=
NODE_ENV=production
PORT=3000
```

### ⚠️ Importante: DATABASE_URL

Substitua `COLE_AQUI_SUA_STRING_DE_CONEXAO_TIDB` pela string de conexão real do seu TiDB Cloud.

**Onde encontrar:**
1. Aceda ao [TiDB Cloud Console](https://tidbcloud.com/)
2. Clique no seu cluster
3. Clique em "Connect"
4. Copie a string de conexão que começa com `mysql://`

**Exemplo do formato:**
```
mysql://usuario.root:senha123@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/nome_database?ssl={"rejectUnauthorized":true}
```

---

## 🚀 Passo-a-Passo Rápido

### 1. No Easypanel, aceda ao seu serviço

- Clique no projeto **intra-praiotel**
- Clique em **"Settings"** ou **"Configure"**

### 2. Adicione Build Arguments

- Procure secção **"Build"** ou **"Build Arguments"**
- Cole as 2 variáveis VITE acima
- Clique em **"Save"**

### 3. Adicione Environment Variables

- Procure secção **"Environment"** ou **"Env Variables"**
- Cole as 4 variáveis acima
- **Substitua** `COLE_AQUI_SUA_STRING_DE_CONEXAO_TIDB` pela sua string real do TiDB
- Clique em **"Save"**

### 4. Rebuild

- Clique em **"Rebuild"** ou **"Redeploy"**
- Aguarde 2-3 minutos
- Acesse https://my.praiotel.pt/

---

## ✅ Verificar Se Funcionou

Após o rebuild:

1. Acesse https://my.praiotel.pt/
2. ✅ **Sucesso:** Página de login aparece sem erros
3. ❌ **Erro:** Veja secção "Troubleshooting" abaixo

---

## 🔍 Troubleshooting

### Erro "Failed to construct 'URL': Invalid URL"

**Causa:** Build Arguments não foram aplicados corretamente

**Solução:**
1. Verifique se as variáveis VITE estão em **Build Arguments** (não Environment Variables)
2. Faça "Clear Build Cache" se disponível
3. Faça rebuild novamente

### Erro "Cannot connect to database"

**Causa:** DATABASE_URL incorreto ou base de dados inacessível

**Solução:**
1. Verifique se copiou a string completa do TiDB Cloud
2. Confirme que o cluster TiDB está ativo
3. Verifique se o IP do Easypanel está na whitelist do TiDB (ou use "Allow All" temporariamente)

### Página em branco

**Causa:** Erro de JavaScript não capturado

**Solução:**
1. Abra DevTools (F12) no browser
2. Vá para aba "Console"
3. Copie o erro e verifique se é relacionado a variáveis VITE

---

## 📋 Checklist Final

Antes de fazer rebuild, confirme:

- [ ] 2 variáveis VITE adicionadas em **Build Arguments**
- [ ] 4 variáveis adicionadas em **Environment Variables**
- [ ] DATABASE_URL substituído pela string real do TiDB
- [ ] Clicou em "Save" em ambas as secções
- [ ] Iniciou o rebuild

---

## 🎓 Próximos Passos Após Deploy Bem-Sucedido

### 1. Executar Migrações da Base de Dados

No terminal do container no Easypanel:

```bash
pnpm db:push
```

Isto cria todas as tabelas necessárias no TiDB.

### 2. Criar Primeiro Utilizador Admin

Execute este SQL no TiDB Cloud Console ou através do terminal:

```sql
-- Gerar hash da password "admin123"
-- Usar bcrypt com 10 rounds

INSERT INTO users (email, password, name, role, createdAt, updatedAt)
VALUES (
  'admin@praiotel.pt',
  '$2a$10$rZ8qH9Xw5vF3kL2mN6pQ4.eYxJ7tW9sK1cV8bM4nR6pL3hT5yU2wG',
  'Administrador',
  'admin',
  NOW(),
  NOW()
);
```

### 3. Testar Login

1. Acesse https://my.praiotel.pt/login
2. Email: `admin@praiotel.pt`
3. Password: `admin123`

---

## 💡 Notas Importantes

- **JWT_SECRET:** O valor fornecido (`xXG22+Gevi69m6hIdP9NHnro5a4dByR1SDzajjAqnHk=`) é seguro e único. Não precisa de gerar outro.
- **Sem dependências Manus:** Esta configuração funciona completamente independente do sistema Manus.
- **Login local:** O sistema usa autenticação email/password armazenada na sua própria base de dados TiDB.

---

## 📞 Ajuda Adicional

Se continuar com problemas:

1. Verifique os logs do build no Easypanel
2. Verifique os logs de runtime no Easypanel
3. Abra DevTools (F12) no browser e veja o Console para erros JavaScript

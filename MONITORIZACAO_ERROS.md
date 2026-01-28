# Sistema de Monitorização de Erros - Intranet Praiotel

## Visão Geral

O sistema captura automaticamente erros do frontend e envia para o backend. Erros críticos geram notificações automáticas.

## Componentes

### ErrorBoundary (Frontend)
- Localização: client/src/components/ErrorBoundary.tsx
- Captura erros React não tratados
- Envia detalhes para backend automaticamente
- Apresenta UI amigável ao utilizador

### Endpoint de Logging (Backend)
- Localização: server/routers.ts → system.logError
- Recebe e processa erros do frontend
- Notifica proprietário em erros críticos (TypeError, ReferenceError)

## Integração com Sentry (Recomendado)

Para produção, recomenda-se integrar com Sentry:

1. Instalar: pnpm add @sentry/react @sentry/tracing
2. Configurar DSN em variáveis de ambiente
3. Inicializar no main.tsx e server/index.ts

## Boas Práticas

- Use try-catch para código assíncrono (ErrorBoundary não captura)
- Classifique erros por severidade (Critical, Error, Warning, Info)
- Configure alertas para novos tipos de erro
- Monitore taxa de erro e tempo de resolução

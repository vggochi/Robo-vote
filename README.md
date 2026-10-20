# ROBO VOTE — Clube de Robótica

**Slogan:** Sua escolha move o futuro.

Projeto educacional de eleição simulada, criado com HTML, CSS e JavaScript puro para demonstrar PWA, Service Worker, Cache API, IndexedDB, notificações e estratégias de carregamento.

> **Aviso:** esta versão é uma demonstração local. Não é uma eleição oficial. As operações não são enviadas a um servidor, não devem ser tratadas como votos reais e não oferecem garantias de integridade eleitoral.

## Funcionalidades

- Interface responsiva com candidatos e propostas fictícias.
- Registro de escolha simulada com confirmação.
- Fila local usando IndexedDB (com fallback para localStorage).
- Indicador de conexão e quantidade de operações pendentes.
- Tentativa de processamento local quando a conexão retorna.
- Service Worker com instalação, cache de recursos, interceptação `fetch`, fallback e limpeza de versões antigas.
- Notificação local solicitada pelo usuário e tratamento de `push` no Service Worker.
- PWA Manifest.
- Preload do CSS principal e prefetch da página de resultados.
- Layout com suporte a `prefers-reduced-motion`.

## Como executar

O Service Worker só funciona em contexto seguro: `localhost` ou HTTPS. Não abra `index.html` diretamente por `file://`.

### Opção A — Python

Na pasta do projeto, execute:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000`.

### Opção B — Node.js

Se tiver Node.js instalado, execute:

```bash
npx serve .
```

Use a URL local informada pelo comando.

## Como testar offline

1. Abra o site em `localhost` e aguarde o Service Worker terminar a instalação.
2. No Chrome, abra DevTools → **Application** → **Service Workers** e confirme que `sw.js` está ativo.
3. Em **Application → Cache Storage**, confira `robo-vote-v1` e os recursos do app shell.
4. Abra o site uma vez online para preencher o cache.
5. Em DevTools → **Network**, marque **Offline**.
6. Atualize a página. A interface e os recursos essenciais devem continuar disponíveis.
7. Clique em escolher candidatura e confirme. A contagem de pendentes deve aumentar.
8. Volte para **Online**. A aplicação tenta processar as operações pendentes na simulação local.
9. Em DevTools → **Application → Storage → IndexedDB**, confira o banco `robo-vote-db`, com stores `pending` e `synced`.
10. Clique no ícone de notificações e conceda permissão para testar a notificação local.

## Estratégia de cache

- **Cache First** para CSS, JavaScript, SVG, imagens e manifest: prioriza recursos locais e reduz dependência da rede.
- **Network First** para navegações: tenta obter a versão atual e recorre ao cache quando a rede falha.
- **Fallback offline**: a navegação tenta a URL em cache, depois a página inicial e, por último, a página `offline.html`.

A lista de `APP_SHELL` é pré-cacheada durante `install`. Quando o cache muda de versão, o evento `activate` remove caches antigos.

## Fila offline e sincronização

A operação é guardada no IndexedDB com status `pending`. Quando há conexão, o código de demonstração move o registro para `synced` e atualiza a interface. Isso **simula** o ciclo de sincronização, mas não envia dados para um backend. O Background Sync é tentado quando o navegador oferece suporte; o evento `online` também aciona uma tentativa.

Em um cenário com servidor real, seria necessário criar um endpoint HTTPS, enviar as operações com `fetch`, validar os dados no servidor, tratar reenvios idempotentes e só marcar uma operação como sincronizada após confirmação real do servidor. Background Sync não é suportado em todos os navegadores.

## Notificações

O botão solicita permissão ao usuário e exibe uma notificação local. O Service Worker também inclui handlers `push` e `notificationclick`. **Push real não está configurado**: isso exigiria um servidor de aplicação, assinatura/subscrição Push, chaves VAPID e um provedor push. O fluxo local é a simulação didática prevista no enunciado.

## Preload, prefetch e DNS-prefetch

- `preload` é usado para `/css/style.css`, recurso local essencial para a primeira renderização.
- `prefetch` aponta para `/resultados.html`, uma navegação provável após votar; é de baixa prioridade e o navegador pode decidir não executá-lo.
- `dns-prefetch` não foi incluído porque esta versão não depende de um domínio externo para recursos críticos. Não seria útil adicionar uma dica para um domínio que o app não usa. Se uma fonte ou API externa for adicionada, reavaliar e medir no DevTools.

## Evidências para a entrega

Adicione capturas reais em `evidencias/`, por exemplo:
- `01-service-worker.png`
- `02-cache-storage.png`
- `03-offline-home.png`
- `04-pending-vote.png`
- `05-indexeddb.png`
- `06-notification.png`
- `07-network-performance.png`
- `08-lighthouse-before-after.png`

As imagens não estão pré-preenchidas: capture-as durante a execução real para que sejam evidências válidas.

## Limitações conhecidas

- Dados e resultados são locais a cada navegador/dispositivo.
- Não há autenticação, servidor ou base de dados compartilhada.
- O voto pode ser removido pelo usuário ao limpar os dados do navegador.
- O estado “sincronizado” significa apenas processado na simulação local, não confirmado por servidor.
- Notificações dependem do suporte do navegador e de permissão explícita.
- Para testar recursos de PWA/Service Worker, use `localhost` ou HTTPS.

## Estrutura

```text
robo-vote/
├── index.html
├── resultados.html
├── offline.html
├── manifest.json
├── sw.js
├── css/style.css
├── js/app.js
├── js/database.js
├── assets/logo.svg
├── evidencias/
└── README.md
```

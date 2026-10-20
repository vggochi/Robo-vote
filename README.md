# ROBO VOTE — Clube de Robótica

**Slogan:** Sua escolha move o futuro.

**Equipe 4 — Armagedom**
- Emanuele
- Giovanna
- João Victor Corrêa
- Valentina

## Objetivo

Desenvolver uma aplicação web de eleição simulada que permita aos usuários conhecer candidatos e suas propostas, registrar escolhas fictícias e consultar resultados, mantendo as funcionalidades essenciais disponíveis mesmo quando a conexão com a internet estiver instável ou indisponível. O projeto tem como finalidade demonstrar, na prática, a aplicação de tecnologias web modernas, como Progressive Web Apps (PWA), Service Worker, Cache API, IndexedDB, notificações e estratégias de otimização de carregamento. Além disso, busca evidenciar como o armazenamento local e o processamento de operações pendentes podem contribuir para a continuidade de uso em ambientes offline.

## Decisões técnicas

O projeto foi desenvolvido com **HTML, CSS e JavaScript puro**, sem frameworks, para demonstrar diretamente o funcionamento das tecnologias utilizadas.

- **PWA e Web App Manifest:** permitem que a aplicação seja instalável e apresente características semelhantes às de um aplicativo, incluindo informações de nome, ícones e configuração de exibição.
- **Service Worker:** intercepta requisições, gerencia o cache dos recursos essenciais e permite que a aplicação continue acessível mesmo sem conexão com a internet.
- **Cache API:** armazena arquivos como HTML, CSS, JavaScript, imagens e outros recursos necessários para carregar a interface offline.
- **Estratégias de cache:** utiliza *Cache First* para recursos estáticos e *Network First* para navegações, com uma página de fallback para situações em que a rede está indisponível.
- **IndexedDB:** armazena localmente as operações realizadas, organizando-as em filas de pendências e registros processados. O `localStorage` é utilizado como alternativa caso o IndexedDB não esteja disponível.
- **Fila de operações offline:** permite registrar escolhas simuladas sem conexão e identificá-las como pendentes, realizando o processamento local quando a conectividade retorna. Esse processamento é uma simulação didática, não uma sincronização real com servidor.
- **Background Sync e evento `online`:** permitem tentar processar as operações pendentes quando a conexão retorna, conforme o suporte do navegador.
- **Notificações:** utiliza a API de notificações do navegador para informar o usuário, mediante autorização. O Service Worker também possui suporte a eventos de push, embora o envio de notificações push reais não esteja configurado.
- **Preload, Prefetch e DNS-prefetch:** aplica `preload` para antecipar o carregamento do CSS principal e `prefetch` para um possível acesso futuro à página de resultados. O `dns-prefetch` não foi incluído porque a aplicação não depende de domínios externos para seus recursos essenciais.
- **Responsividade e acessibilidade:** utiliza CSS responsivo e respeita a preferência `prefers-reduced-motion`, reduzindo animações para usuários que assim configurarem o dispositivo.

## Vídeo no Youtube
https://youtu.be/BNTTuh5NBIQ

### Limitações da demonstração

A aplicação é exclusivamente educacional e não representa um sistema eleitoral oficial. As operações são armazenadas e processadas localmente, sem envio para um servidor ou compartilhamento de resultados entre dispositivos. Portanto, o estado de operação processada não significa confirmação por um backend, e os dados podem ser perdidos se o armazenamento do navegador for apagado. Uma versão com sincronização real exigiria uma API segura, validação no servidor, controle de duplicidade e confirmação das operações recebidas.

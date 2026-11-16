# Radar Green Lab PRO 📡⚽

Aplicativo web para iPhone com agenda de futebol, resultados, filtros por competição, favoritos e frequências históricas de gols quando os dados estiverem disponíveis.

## Publicar pelo GitHub Pages
1. No repositório, abra **Settings** → **Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Em **Branch**, escolha `main` e `/ (root)` e toque em **Save**.
4. Após a publicação, o endereço será parecido com: `https://pinopresentes-bit.github.io/radar-green-lab/`
5. Abra o link publicado no Safari do iPhone e toque em **Compartilhar** → **Adicionar à Tela de Início**.

## Recursos
- Calendário de várias ligas nacionais e internacionais
- Placar e status ao vivo, quando a fonte oferece
- Filtros: todos / ao vivo / próximos / encerrados / favoritos
- Atualização a cada 60 segundos com a página aberta
- Histórico amostral de gols e ambas marcam (até cinco jogos por time) quando disponível
- Painel de pré-sinais de estudo, com até seis partidas futuras priorizadas pela frequência histórica
- Destaques dinâmicos para partidas futuras da Liga das Nações
- Nova tentativa de dados históricos após falhas temporárias
- Consulta de escalações e reservas quando disponíveis na ESPN (não constitui confirmação oficial)
- Estatísticas por equipe em análise individual: chutes, chutes no alvo, escanteios e faltas
- Alguns números individuais exibidos quando o jogo/atleta possui dados na ESPN
- Calculadora manual para odds decimais e taxa de equilíbrio teórico (não é previsão de chance)
- Atualização das estatísticas do jogo aberto a cada ciclo de atualização com o aplicativo em primeiro plano

- Painel do jogo com contagem até a partida e botão de verificação manual de escalações e estatísticas
- Os mercados individuais mostram quando faltam titulares, além de identificar histórico individual indisponível
- Campos estatísticos não publicados são tratados como ausentes, não como zero

- Verificação de versão do aplicativo: indica atualizações de código e oferece botão para carregar a nova versão
- Atalhos no detalhe da partida para escalações, estatísticas e cotação manual
- Radar ao vivo por partida, com placar, minuto, chutes, chutes no alvo e escanteios quando disponíveis
- Hipóteses de observação para gol e escanteios no primeiro tempo, gols no segundo tempo e escanteios totais, sujeitas a dados suficientes
- Avisos de novas hipóteses no painel, com opt-in, apenas enquanto a página estiver aberta. Não são notificações push e não confirmam apostas

- Monitor de escalações pré-jogo para até 4 partidas iniciando nas próximas 2 horas, com consultas da ESPN no máximo a cada 5 minutos por jogo (com página aberta).
- Mostra os estados: sem titulares, parcial, 11 titulares por equipe ou falha da fonte. Escalações da ESPN não substituem confirmação oficial.
- Avisos de escalações disponíveis opcionalmente **dentro da página**; sem notificações quando o aplicativo está fechado.

## Importante
- A fonte é a interface pública **não oficial** da ESPN. Cobertura, CORS, estabilidade e atualização não são garantidos. Sem resposta, o aplicativo exibirá aviso em vez de inventar resultados.
- Este é um projeto experimental, não um sistema de monitoramento ininterrupto. **Não envia notificações com o app fechado.**
- Não acessa casas de apostas, contas de usuários, pagamentos, odds em tempo real ou escalações oficiais. É possível inserir uma odd manualmente para estudo matemático; a ferramenta **não valida uma entrada nem estima chance real**. Frequências históricas **não garantem resultados**.
- A publicação pelo GitHub Pages é pública: não adicione dados particulares ou chaves de API nos arquivos.

Versão inicial criada para uso em smartphones.
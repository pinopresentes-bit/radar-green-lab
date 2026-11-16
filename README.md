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

## Importante
- A fonte é a interface pública **não oficial** da ESPN. Cobertura, CORS, estabilidade e atualização não são garantidos. Sem resposta, o aplicativo exibirá aviso em vez de inventar resultados.
- Este é um projeto experimental, não um sistema de monitoramento ininterrupto. **Não envia notificações com o app fechado.**
- Não acessa apostas, odds, contas de usuários, pagamentos ou escalações oficiais. Frequências históricas **não garantem resultados**.
- A publicação pelo GitHub Pages é pública: não adicione dados particulares ou chaves de API nos arquivos.

Versão inicial criada para uso em smartphones.
# Plano operacional Green Lab PRO — 17/11/2026

## Preferências do usuário
- Cobrir futebol do Brasil e do mundo: Brasileirão, Libertadores, Sul-Americana, copas, seleções e ligas internacionais.
- Priorizar a apresentação de **até três partidas** para que o usuário monte suas próprias estratégias. Não forçar três quando os dados não sustentarem.
- Mercados: +1,5/+2,5 gols, menos de 4,5, ambas marcam, gol no 1º tempo, escanteios no 1º tempo, escanteios totais, chutes no alvo, marcador e assistência.
- Cada mercado precisa de linha explícita, amostra, fonte, horário de coleta, riscos e status de validação.
- Titular provável NÃO é titular oficialmente confirmado. Não declarar jogador validado sem confirmação oficial e dados individuais suficientes.
- Separar: (a) sem dados, (b) critério estatístico não atingido, (c) estudo histórico, (d) sinal analisado, (e) resultado pós-jogo.
- Não inferir escanteios por período a partir do total; nunca transformar dado ausente em zero.
- Registrar sinais com timestamp ANTES do início e conferir acertos/erros após o término, separando apostas do usuário de sinais emitidos pelo radar.
- Nunca afirmar lucro, garantia de GREEN ou odds consultadas sem verificação. O usuário realiza as apostas manualmente.

## Prioridades técnicas
1. Auditar cobertura de escanteios 1º/2º tempo e exibir diagnóstico de cobertura por equipe; integrar fonte adicional somente com acesso permitido e esquema verificado.
2. Validar escalações com proveniência e estado (provável/confirmada/indisponível).
3. Selecionar até 3 partidas com melhor qualidade de dados e mercados justificáveis; exibir motivo de rejeição das demais.
4. Persistir histórico auditável de sinais pré-jogo, odds informadas manualmente quando houver, resultado e desempenho por mercado.
5. Conferir correspondência de nomes de equipes/competições com plataformas, sem presumir equivalência não verificada.

## Limites atuais
- O app atual consulta dados ESPN públicos não oficiais. Sofascore/Flashscore não estão integrados automaticamente.
- Atualizações no app aberto não equivalem a notificações push em segundo plano.
- Este arquivo registra requisitos e NÃO significa que as funcionalidades acima já foram implementadas ou testadas.

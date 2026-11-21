# Green Lab PRO — novas estratégias para implementação (21/11/2026)

Origem: estratégias enviadas pelo usuário em capturas de tela da casa de apostas. **Não são sinais validados nem dados históricos auditados.**

## Mercado A: escanteios nos primeiros 10 minutos
- Estudar separadamente +0,5 e +1,5 escanteios no intervalo 00:00–09:59 (respeitar a regra específica da casa).
- Buscar eventos reais minuto a minuto dos últimos 5–10 jogos de cada equipe, distinguindo casa/fora, escanteios a favor e contra, denominador e fonte.
- Não inferir os primeiros 10 minutos a partir de escanteios do primeiro tempo ou da partida.
- Sem eventos verificáveis suficientes: mostrar `SEM DADO CONFIÁVEL — NÃO VALIDADO`; não emitir sinal.
- Exibir frequência observada, incerteza, odd verificada e probabilidade implícita, sem confundir frequência histórica com probabilidade preditiva.

## Mercado B: marcador de gol
- Confirmar titularidade oficial, minutos recentes, gols, finalizações no alvo, pênaltis e função ofensiva; incluir desfalques e adversário.
- Se titularidade não oficial, classificar como provável, citando fonte; não liberar sinal individual.
- Verificar regra de substituição da casa.

## Mercado C: jogador marca OU dá assistência
- Usar últimos 5–10 jogos com gols, assistências, minutos, criação de chances e função tática.
- Confirmar disponibilidade/titularidade, definição de assistência e regras da casa.
- Nomes nas capturas (Haaland, Manzambi, Palmer, Nusa, Camello, Matanovic) são **exemplos de mercados**, não recomendações automáticas.

## Mercado D: múltiplas e combinadas
- Calcular produto das odds verificadas e probabilidade implícita bruta; sinalizar correlação e risco cumulativo.
- Cada seleção deve passar na validação individual antes de aparecer como candidata à combinação.
- Nunca priorizar odd alta em detrimento de dados verificáveis; nunca automatizar aposta.
- Não considerar capturas de odds como cotação em tempo real.

## UI / auditoria
- Mostrar: mercado exato, intervalo, linha, amostra n/N, fonte e horário, casa/fora, titulares confirmados/prováveis, confiança, risco e estado (preliminar/não validado/validado).
- Separar escanteios 0–10', escanteios 1º tempo e escanteios totais.
- Registrar sinais emitidos antes da partida e resultados GREEN/RED/VOID, incluindo sinais perdedores; não computar apostas feitas parcialmente pelo usuário como acertos automáticos do robô.
- Não inventar odds, estatísticas, escalações ou fontes.
- Critérios de aceite: testes de intervalos 0–10', ausência de eventos, linhas asiáticas e odds, titularidade não oficial, dados atrasados, correlação de múltiplas e resultados.

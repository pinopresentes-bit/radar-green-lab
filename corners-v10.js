"use strict";
// Green Lab v10: análises históricas de escanteios em fontes públicas da ESPN.
// Este módulo complementa o app v9 sem alterar sua lógica de jogos e escalações.
(function(){
 const MAX_GAMES=10;
 const fmt=x=>x===null?"—":Number(x).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});
 const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
 const med=a=>{if(!a.length)return null;const v=[...a].sort((x,y)=>x-y);const k=Math.floor(v.length/2);return v.length%2?v[k]:(v[k-1]+v[k])/2};
 const freq=(rows,field,lines)=>lines.map(v=>"mais de "+fmt(v)+": "+rows.filter(r=>r[field]>v).length+"/"+rows.length).join(" · ");
 const summaryUrl=(g,id)=>"https://site.api.espn.com/apis/site/v2/sports/soccer/"+encodeURIComponent(g.code)+"/summary?event="+encodeURIComponent(id);
 const seasonUrl=(g,t)=>"https://site.api.espn.com/apis/site/v2/sports/soccer/"+encodeURIComponent(g.code)+"/teams/"+encodeURIComponent(t.id)+"/schedule?season="+new Date(g.start).getUTCFullYear();
 const historyCache=new Map();
 const fetched=new Map();
 function periodForCorner(p){
  const n=p?.period?.number??p?.period?.value??p?.period;
  if(n!==undefined&&n!==null&&n!==""){const v=String(n).trim().toLowerCase();if(["1","first","firsthalf","first-half","1st","period1"].includes(v))return 1;if(["2","second","secondhalf","second-half","2nd","period2"].includes(v))return 2;}
  // Sem período explícito, minuto 45+ não comprova segundo tempo.
  return null;
 }
 function splitCornerPeriods(summary,total){
  // Total zero não comprova a existência de uma linha do tempo completa.
  // Sem eventos verificáveis, não transformar ausência de dados em zero.
  if(total===0)return null;
  const feeds=[summary?.plays,summary?.keyEvents,summary?.details?.plays,summary?.details?.keyEvents,summary?.commentary?.plays,summary?.commentary?.events,summary?.commentary?.items,summary?.commentary,summary?.details?.commentary,summary?.details?.commentary?.plays];
  for(const feed of feeds){
   if(!Array.isArray(feed))continue;
   const events=feed.filter(p=>{
    const t=[p?.type?.slug,p?.type?.text,p?.type?.name,typeof p?.type==="string"?p.type:"",p?.description,p?.text].filter(Boolean).join(" ").toLowerCase();
    return /(^|[\s_-])corner(?:[\s_-]?kick)?($|[\s_-])/.test(t);
   });
   // Caso haja evento ausente, repetido ou minuto duvidoso, não estimar a divisão.
   if(events.length!==total)continue;
   const parts=events.map(periodForCorner);
   if(parts.some(p=>p!==1&&p!==2))continue;
   return {first:parts.filter(x=>x===1).length,second:parts.filter(x=>x===2).length};
  }
  return null;
 }
 function matchVenue(raw,team){
  const sides=raw?.competitions?.[0]?.competitors||[];
  const me=sides.find(s=>String(s.team?.id)===String(team.id));
  const other=sides.find(s=>String(s.team?.id)!==String(team.id));
  return {venue:me?.homeAway==="home"?"casa":me?.homeAway==="away"?"fora":"não informado",opponentName:other?.team?.shortDisplayName||other?.team?.displayName||"Adversário"};
 }
 async function tenMatches(game,team){
  const key=game.code+":"+game.id+":"+team.id;
  if(!historyCache.has(key))historyCache.set(key,(async()=>{
   let original=[];
   try{original=(await api(seasonUrl(game,team))).events||[]}catch{}
   // Placar de liga como segunda consulta da mesma ESPN, não segunda fonte independente.
   if(matchHistory(original,game,team).length<MAX_GAMES){
    try{original=[...original,...await leagueSchedule(game)]}catch{}
   }
   const events=new Map(original.filter(x=>x?.id).map(x=>[String(x.id),x]));
   return matchHistory([...events.values()],game,team).slice(0,MAX_GAMES).map(x=>({...x,...matchVenue(events.get(x.id),team)}));
  })().catch(()=>[]));
  return historyCache.get(key);
 }
 async function cornerRecord(game,team,match){
  const key=(match.code||game.code)+":"+match.id+":"+team.id;
  if(!fetched.has(key))fetched.set(key,(async()=>{
   const payload=await getEventSummary(match.code||game.code,match.id);
   const total=payload?getCornerTotals(payload,team.id):null;
   if(!total)return null;
   const split=splitCornerPeriods(payload,total.total);
   return {...match,...total,first:split?.first??null,second:split?.second??null};
  })().catch(()=>null));
  return fetched.get(key);
 }
 async function inspectTeam(game,team){
  const matches=await tenMatches(game,team);
  const records=await mapWithLimit(matches,4,m=>cornerRecord(game,team,m));
  return {available:records.filter(Boolean),checked:matches.length};
 }
 function study(name,rows,key,lines){
  const valid=rows.filter(x=>Number.isInteger(x[key]));
  if(!valid.length)return name+": sem dados verificáveis.";
  const vals=valid.map(x=>x[key]);
  return name+" ("+valid.length+" jogos): média "+fmt(avg(vals))+"; mediana "+fmt(med(vals))+"; "+freq(valid,key,lines);
 }
 function byTeam(name,rows){
  if(!rows.length)return name+": sem registros válidos.";
  return name+" ("+rows.length+" jogos): cobrados média "+fmt(avg(rows.map(x=>x.own)))+"; cedidos média "+fmt(avg(rows.map(x=>x.opponent)))+"; cobrou 4+ em "+rows.filter(x=>x.own>=4).length+"/"+rows.length+" e 5+ em "+rows.filter(x=>x.own>=5).length+"/"+rows.length;
 }
 function historyRows(game,team,result){
  let markup='<div class="corner-row"><strong>'+esc(team.name)+'</strong> · '+result.available.length+'/'+result.checked+' partidas com escanteios publicados (até 10)</div>';
  if(!result.available.length)return markup+'<div class="corner-row">Esta competição não disponibilizou registros completos para a amostra.</div>';
  markup+=result.available.map(x=>'<div class="corner-row"><strong>'+esc(dateTime(x.date))+' · '+esc(x.venue)+' contra '+esc(x.opponentName)+'</strong><div>Cobrados: '+x.own+' · Cedidos: '+x.opponent+' · Total: '+x.total+' · 1ºT: '+(x.first===null?"—":x.first)+' · 2ºT: '+(x.second===null?"—":x.second)+'</div><small>— significa divisão não comprovada</small> · <a target="_blank" rel="noopener noreferrer" href="'+esc(summaryUrl(game,x.id))+'">Fonte ESPN</a></div>').join("");
  return markup;
 }
 function panel(){
  let h='<div class="panel" id="cornersPanel"><h3>🚩 Escanteios • histórico de até 10 jogos</h3><p>Para 1º e 2º tempos, só mostrar valores quando todos os eventos de canto e seus períodos forem verificáveis. Não dividir por dois o total da partida.</p>';
  const boxes=[
   ["first","⏱️ Escanteios no 1º tempo"],
   ["second","⏱️ Escanteios no 2º tempo"],
   ["total","🚩 Escanteios em 90 minutos"],
   ["team","🏟️ Escanteios a favor e contra"],
   ["venue","🏠 Mandante em casa / visitante fora"],
   ["most","⚖️ Equipe que mais cobrou escanteios"]
  ];
  h+=boxes.map(x=>'<div class="market-check"><div class="market-top"><b>'+x[1]+'</b><span class="market-state" id="corner-'+x[0]+'-status">Buscando</span></div><p id="corner-'+x[0]+'-data">Consultando amostras e cobertura da fonte…</p></div>').join("");
  h+='<details class="market-check"><summary><b>📅 Ver os jogos e conferir a fonte</b></summary><div class="corner-rows" id="corner-history">Buscando resultados…</div></details>';
  h+='<p class="corner-source" id="corner-source">Fonte: ESPN não oficial. Os dados não são cruzados automaticamente com Sofascore ou FootyStats.</p>';
  h+='<p class="mini-disclaimer">Média e frequência histórica não equivalem a probabilidade nem validam aposta. “Sem dados” não significa zero. Informação sujeita a cobertura e atraso.</p></div>';
  return h;
 }
 async function update(game){
  const key=preKey(game),set=(id,status,message)=>{
   const badge=$("corner-"+id+"-status"),text=$("corner-"+id+"-data");
   if(badge)badge.textContent=status;
   if(text)text.textContent=message;
  };
  const [h,a]=await Promise.all([inspectTeam(game,game.home),inspectTeam(game,game.away)]);
  if(active!==key)return;
  const H=h.available,A=a.available;
  if($("corner-history"))$("corner-history").innerHTML=historyRows(game,game.home,h)+historyRows(game,game.away,a);
  if($("corner-source"))$("corner-source").textContent="Consultado em "+dateTime(new Date())+" (Brasília). Fonte: ESPN não oficial, links para as partidas acima. Nenhuma outra base foi checada automaticamente.";
  const coverage=game.home.name+" "+H.length+"/"+h.checked+"; "+game.away.name+" "+A.length+"/"+a.checked+". ";
  if(!H.length||!A.length){
   ["first","second","total","team","venue","most"].forEach(s=>set(s,"Insuficiente",coverage+"Pelo menos uma equipe ficou sem partidas com totais confirmados."));
   return;
  }
  const quality=H.length>=5&&A.length>=5?"Histórico disponível":"Amostra curta — NÃO VALIDADO";
  set("total",quality,coverage+study(game.home.name,H,"total",[6.5,7.5,8.5,9.5,10.5])+". "+study(game.away.name,A,"total",[6.5,7.5,8.5,9.5,10.5])+". São frequências de jogos separados, não da partida futura.");
  set("team",quality,byTeam(game.home.name,H)+". "+byTeam(game.away.name,A)+".");
  const homeAtHome=H.filter(x=>x.venue==="casa"),awayAway=A.filter(x=>x.venue==="fora");
  set("venue",homeAtHome.length>=3&&awayAway.length>=3?"Recorte disponível":"Poucos jogos por mando",byTeam(game.home.name+" em casa",homeAtHome)+". "+byTeam(game.away.name+" fora",awayAway)+".");
  set("most",quality,game.home.name+" liderou em cantos "+H.filter(x=>x.own>x.opponent).length+"/"+H.length+" jogos; "+game.away.name+" liderou "+A.filter(x=>x.own>x.opponent).length+"/"+A.length+". Empates não contam como liderança.");
  for(const field of ["first","second"]){
   const home=H.filter(r=>Number.isInteger(r[field])),away=A.filter(r=>Number.isInteger(r[field]));
   const state=home.length>=5&&away.length>=5?"Eventos conferidos":"Cobertura insuficiente";
   const info="Eventos completos de "+(field==="first"?"1º":"2º")+" tempo: "+game.home.name+" "+home.length+"/"+H.length+" e "+game.away.name+" "+away.length+"/"+A.length+". ";
   set(field,state,info+(home.length>=5&&away.length>=5?study(game.home.name,home,field,[2.5,3.5,4.5])+". "+study(game.away.name,away,field,[2.5,3.5,4.5])+". ":"SEM DADO CONFIÁVEL — NÃO VALIDADO. ")+"Se a fonte mostrar somente o total de 90 minutos, a divisão por período fica indisponível.");
  }
 }
 // Funções anteriores eram chamadas ao abrir o detalhe. Sobrescrevê-las sem
 // mexer no restante do app mantém os demais módulos da versão 9 intactos.
 cornerMarketPanel=panel;
 updateCornerPanel=update;
})();
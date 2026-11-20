/* Green Lab PRO v13: eight-field assembled study, no automatic bet */
(()=>{
"use strict";
const section=document.createElement("section");section.className="signalhub";section.id="assembledHub";
section.innerHTML='<div class="signalhead"><div><span class="eyebrow">🧩 GREEN LAB • SINAL MONTADO</span><h2>Qual mercado analisar?</h2></div><span class="signalstatus" id="assembledStatus">Montando</span></div><p>Gols, escanteios, ambas marcam e jogadores em um só lugar. <strong>Sem aposta validada e sem odds verificadas.</strong></p><label id="assembledPicker" hidden>Escolher jogo<select id="assembledGame" style="width:100%;font-size:16px"></select></label><div id="assembledContent"><div class="empty">Analisando histórico...</div></div>';
(document.getElementById("finalHub")||document.getElementById("notice"))?.insertAdjacentElement("afterend",section);
const style=document.createElement("style");
style.textContent='#assembledContent .am-card{background:#10291b;border:1px solid #467958;border-radius:12px;padding:13px;margin:10px 0}#assembledContent .am-card h3{font-size:15px;color:#e5d39d;line-height:1.5;margin:6px 0}#assembledContent .am-rows{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}#assembledContent .am-row{border-top:1px solid #3d6046;padding:9px 0;display:flex;flex-direction:column;gap:4px}#assembledContent .am-row strong{font-size:11px;color:#f3f8ee}#assembledContent .am-value{font-size:12px;font-weight:850;color:#9afaaf;line-height:1.5}#assembledContent .am-value.off{color:#bbcfbd}#assembledContent .am-row small{font-size:10px;line-height:1.5;color:#b8cfbd}#assembledContent .am-cta{background:#7febae;color:#0b2517;font-size:12px;font-weight:850;border:0;border-radius:8px;padding:11px;margin-top:11px}#assembledContent .am-warning{border:1px solid #746b3d;border-radius:8px;background:#293422;padding:9px;font-size:11px;color:#f7d9a1;line-height:1.5;margin:10px 0}#assembledContent .am-footer{font-size:10px;color:#b5cfba;line-height:1.5;margin-top:9px}@media(max-width:460px){#assembledContent .am-rows{grid-template-columns:1fr}}';
document.head.append(style);
const studies=new Map(),rosters=new Map();
const toRow=(name,value,reason,yes)=>'<div class="am-row"><strong>'+esc(name)+'</strong><span class="am-value'+(yes?'':' off')+'">'+esc(value)+'</span><small>'+esc(reason)+'</small></div>';
const picker=document.getElementById("assembledGame");
let selectedKey="", menu="";
picker.addEventListener("change",()=>{selectedKey=picker.value;render()});
function candidate(){
 const now=Date.now();
 const games=preCandidates().filter(g=>Date.parse(g.start)>now).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 const options=games.map(g=>'<option value="'+esc(preKey(g))+'">'+esc(dateTime(g.start)+" · "+g.home.name+" × "+g.away.name)+'</option>').join("");
 if(menu!==options){picker.innerHTML=options;menu=options}
 document.getElementById("assembledPicker").hidden=games.length<2;
 let game=games.find(g=>preKey(g)===selectedKey);
 if(!game){
  selectedKey="";
  game=games.find(g=>Date.parse(g.start)-now>=1800000 && Date.parse(g.start)-now<=7200000)||games[0];
 }
 if(game)picker.value=preKey(game);
 return game;
}
function hMarket(h,a,rule,min,market){
 const p=h.filter(rule).length,q=a.filter(rule).length,ready=h.length>=5&&a.length>=5;
 const ok=ready&&p>=min&&q>=min;
 return {ok,value:ok?"🟡 "+market:ready?"⚪ Critério não atingido":"⏳ Histórico insuficiente",explain:p+"/"+h.length+" jogos do mandante e "+q+"/"+a.length+" do visitante. Não é probabilidade de acerto."};
}
function cornerPick(h,a,type,lines){
 if(h.length<5||a.length<5)return null;
 for(const t of [...lines].reverse()){
  const p=h.filter(x=>x[type]>t).length,q=a.filter(x=>x[type]>t).length;
  if(p>=Math.ceil(h.length*.75)&&q>=Math.ceil(a.length*.75))return {label:"Mais de "+t.toFixed(1).replace(".",",")+" escanteios",info:p+"/"+h.length+" e "+q+"/"+a.length+" jogos da amostra."};
 }
 return null;
}
function minutePeriod(p){
 const v=String(p?.period?.number??p?.period?.value??p?.period??"").trim().toLowerCase();
 if(["1","first","firsthalf","first-half","1st","period1"].includes(v))return 1;
 if(["2","second","secondhalf","second-half","2nd","period2"].includes(v))return 2;
 // Minuto de jogo sozinho não comprova o período (45+ acréscimos, reinícios etc.).
 // Sem período explícito da fonte, não gerar linha de escanteios do 1º tempo.
 return null;
}
function firstCorners(s,tot){
 if(!s||tot===null)return null;
 for(const list of [s?.plays,s?.keyEvents,s?.details?.plays,s?.details?.keyEvents,s?.commentary?.plays,s?.commentary?.events,s?.commentary?.items,s?.commentary]){
  if(!Array.isArray(list))continue;
  const found=list.filter(p=>/corner(?:-|\s*)kick|(?:^|\s)corner(?:\s|$)/.test([p?.type?.text,p?.type?.slug,p?.description,p?.text].filter(Boolean).join(" ").toLowerCase()));
  if(found.length!==tot)continue;
  const halves=found.map(minutePeriod);
  if(halves.some(x=>x!==1&&x!==2))continue;
  return halves.filter(x=>x===1).length;
 }
 return null;
}
function addStat(players,p,teamId){
 const k=String(teamId)+":"+normTeam(p.name);if(!p.name)return;
 if(!players[k])players[k]={name:p.name,goal:{n:0,total:0,hits:0},assist:{n:0,total:0,hits:0},shot:{n:0,total:0,hits:0}};
 for(const [type,aliases] of [["goal",["goals","goal"]],["assist",["goalAssists","assists","assist"]],["shot",["shotsOnTarget","shotsOnGoal","shots on target"]]]){
  const v=statNumber(p.stats,aliases);
  if(v===null||v<0||v>60||!Number.isFinite(v))continue;
  const entry=players[k][type];entry.n++;entry.total+=v;if(v>0)entry.hits++;
 }
}
function pickPlayer(d,r,kind){
 if(!d?.done||!r?.home||!r?.away)return null;
 if(r.home.starters?.length!==11||r.away.starters?.length!==11)return null;
 const names=[...r.home.starters.map(x=>String(r.homeTeamId)+":"+normTeam(x.name)),...r.away.starters.map(x=>String(r.awayTeamId)+":"+normTeam(x.name))];
 const eligible=[...new Set(names)].map(k=>d.players[k]).filter(x=>{
  const m=x?.[kind];return m?.n>=5&&(kind==="shot"?m.hits>=4&&m.hits/m.n>=0.65:kind==="assist"?m.hits>=3&&m.hits/m.n>=0.5:m.hits>=2&&m.hits/m.n>=0.3);
 }).sort((a,b)=>b[kind].hits/b[kind].n-a[kind].hits/a[kind].n||b[kind].total-a[kind].total);
 return eligible[0]||null;
}
function render(){
 const status=document.getElementById("assembledStatus"),out=document.getElementById("assembledContent");
 if(!state.loaded){status.textContent="Carregando";return}
 const g=candidate();
 if(!g){status.textContent="Sem pré-jogo";out.innerHTML='<div class="empty">Nenhuma partida futura entre as competições consultadas. Confira os estudos ao vivo abaixo.</div>';return}
 const key=preKey(g),d=studies.get(key);
 if(!d)loadStudy(g);
 const h=d?.home||[],a=d?.away||[],r=rosters.get(key);
 const one=hMarket(h,a,x=>x.total>=2,4,"Mais de 1,5 gols");
 const two=hMarket(h,a,x=>x.total>=3,4,"Mais de 2,5 gols");
 const both=hMarket(h,a,x=>x.btts,3,"Ambas marcam: SIM");
 const bothNo=hMarket(h,a,x=>!x.btts,3,"Ambas marcam: NÃO");
 // BTTS SIM/NÃO são alternativas excludentes: não destacar ambas como sinais simultâneos.
 const bttsConflict=both.ok&&bothNo.ok;
 if(bttsConflict){both.ok=false;bothNo.ok=false;both.value="⚪ Inconclusivo — SIM e NÃO sem predominância";bothNo.value="⚪ Inconclusivo — alternativas conflitantes";both.explain+=" As duas alternativas atingiram o limiar mínimo; nenhuma foi priorizada.";bothNo.explain+=" As duas alternativas atingiram o limiar mínimo; nenhuma foi priorizada.";}
 const under=hMarket(h,a,x=>x.total<4,4,"Menos de 3,5 gols");
 
 // Somente estatísticas obtidas de partidas individuais entram no sinal montado.
 // Boletins em texto não são importados como amostras verificadas.
 const ct=d?.done?cornerPick(d.hCorners,d.aCorners,"total",[6.5,7.5,8.5,9.5,10.5]):null;
 const cf=d?.done?cornerPick(d.hHalves,d.aHalves,"first",[2.5,3.5,4.5]):null;
 const cornerRow=(label,x,s1,s2)=>{
  return toRow(label,x?"🟡 "+x.label:d?.done?"🔴 SEM DADO CONFIÁVEL — NÃO VALIDADO":"⏳ Consultando registros",
   x?x.info:d?.done?(s1<5||s2<5?"SEM DADO CONFIÁVEL — NÃO VALIDADO: "+s1+" e "+s2+" partidas com registros verificáveis, de no mínimo 5 necessárias por equipe. A fonte pode não publicar eventos por período; ausência de dado não é zero.":"Amostra de "+s1+" e "+s2+" jogos: nenhuma linha atingiu o filtro de 75% em cada equipe. NÃO VALIDADO."):"Verificando registros dos últimos jogos.",!!x);
 };
 const playerRow=(label,kind)=>{
  const p=pickPlayer(d,r,kind);
  return toRow(label,p?"🟡 "+p.name:"⚪ Sem jogador indicado",
   p?p[kind].hits+"/"+p[kind].n+" jogos com pelo menos 1 "+(kind==="shot"?"chute no alvo":kind==="goal"?"gol":"assistência")+"; "+p[kind].total+" no total da amostra. Frequência observada, não garantia. Jogador listado pela ESPN; escalação oficial e odd ainda exigem conferência.":
   r?.home?.starters?.length===11&&r?.away?.starters?.length===11?"A ESPN listou 11 jogadores de cada lado, mas não há 5+ fichas individuais com estatística suficiente para este mercado. Escalação ESPN não é confirmação oficial.":"A ESPN ainda não listou 11 titulares de cada lado, ou não há histórico individual verificável de 5+ jogos. Conferir fonte oficial; o app não importa escalações das notificações.",!!p);
 };
 const has=one.ok||two.ok||both.ok||!!ct||!!cf;
 const options=[
  {ok:one.ok,market:"Mais de 1,5 gols",detail:one.explain},
  {ok:two.ok,market:"Mais de 2,5 gols",detail:two.explain},
  {ok:both.ok,market:"Ambas marcam: SIM",detail:both.explain},
  {ok:!!cf,market:cf?.label+" (1º tempo)",detail:cf?.info},
  {ok:!!ct,market:ct?.label+" (jogo)",detail:ct?.info}
 ].filter(x=>x.ok);
 const selected=options[0]||null;
 const coverage=d?.done?'<div class="am-warning">📚 Cobertura de dados: histórico de gols '+esc(h.length)+' jogos (mandante) e '+esc(a.length)+' jogos (visitante); escanteios totais '+esc(d.hCorners?.length||0)+' e '+esc(d.aCorners?.length||0)+'; escanteios 1º tempo com registros verificáveis '+esc(d.hHalves?.length||0)+' e '+esc(d.aHalves?.length||0)+'. Quando não houver cobertura por período, nenhum sinal de 1º tempo será calculado. Estatísticas ausentes não são zero. Fonte: registros ESPN; conferir em fonte oficial.</div>':'';
 const review=selected?'<div class="am-warning"><strong>📋 CANDIDATO PARA CONFERÊNCIA — NÃO VALIDADO</strong><br>'+esc(selected.market)+'<br>'+esc(selected.detail)+'<br>Próximo passo: conferir titulares oficiais e odd atual na casa. Histórico de 5 jogos não comprova vantagem; sem cotação verificada, não há avaliação de valor.</div>':'';
 status.textContent=d?.done?"5 mercados estudados · 0 sinais validados":"Consultando 5 mercados";
 out.innerHTML='<div class="am-card"><small>📅 '+esc(dateTime(g.start))+' · '+esc(g.label)+'</small><h3>'+esc(g.home.name)+' × '+esc(g.away.name)+'</h3>'+
 '<div class="am-warning">⏱️ Partida e horário obtidos da agenda consultada. Confirme a programação e os titulares na fonte oficial antes de qualquer decisão. A ESPN não confirma escalação oficial. Estudos históricos não são sinais validados.</div>'+ 
  '<div class="am-warning">'+(has?"🟡 Mercados em observação estatística. Nenhuma aposta está validada.":"⚪ Ainda faltam dados para um sinal fundamentado.")+'</div>'+
 review+coverage+'<div class="am-rows">'+
 toRow("⚽ Gols: 1,5",one.value,one.explain,one.ok)+
 toRow("⚽ Gols: 2,5",two.value,two.explain,two.ok)+
 cornerRow("🚩 ESCANTEIOS 1º TEMPO · 2,5/3,5/4,5",cf,d?.hHalves?.length||0,d?.aHalves?.length||0)+
 cornerRow("🚩 ESCANTEIOS TOTAL · 6,5/7,5/8,5/9,5/10,5",ct,d?.hCorners?.length||0,d?.aCorners?.length||0)+
 toRow("🤝 Ambas marcam: SIM",both.value,both.explain,both.ok)+
 '</div><div class="am-footer">Cada mercado é avaliado separadamente. Não combinar automaticamente. Confirmar escalações oficiais e odds. Modo Essencial: mercados individuais pausados, sem apagar a lógica original. Escanteios por tempo exigem eventos reais.</div>'+
 '<button class="am-cta" id="assembledOpen">Ver análise completa e titulares</button></div>';
 document.getElementById("assembledOpen").onclick=()=>openDetail(key);
 const prior=rosters.get(key),remain=new Date(g.start).getTime()-Date.now();
 if(remain<=7200000&&remain>0&&(!prior||(!prior.pending&&Date.now()-prior.checkedAt>300000)))checkRoster(g);
}
async function loadStudy(g){
 const key=preKey(g);if(studies.has(key))return;
 studies.set(key,{pending:true});
 try{
  const [home,away]=await Promise.all([teamHistory(g,g.home),teamHistory(g,g.away)]);
  studies.set(key,{home,away,pending:true});render();
  const todo=[...home.map(m=>({m,side:"h",team:g.home})),...away.map(m=>({m,side:"a",team:g.away}))];
  const all=await mapWithLimit(todo,3,async x=>{
   try{
    const summary=await getEventSummary(g.code,x.m.id);
    const corners=summary?getCornerTotals(summary,x.team.id):null;
    const first=corners?firstCorners(summary,corners.total):null;
    const lineup=summary?teamLineup(summary,x.team):null;
    return {...x,corners,first,players:[...(lineup?.starters||[]),...(lineup?.reserves||[])]};
   }catch{return {...x,corners:null,first:null,players:[]}}
  });
  const sample=(side,field)=>all.filter(x=>x.side===side&&x[field]!==null).map(x=>field==="first"?{first:x.first}:x.corners);
  const players={};for(const x of all)for(const p of x.players)addStat(players,p,x.team.id);
  studies.set(key,{home,away,done:true,hCorners:sample("h","corners"),aCorners:sample("a","corners"),hHalves:sample("h","first"),aHalves:sample("a","first"),players});
 }catch{studies.set(key,{home:[],away:[],done:true,hCorners:[],aCorners:[],hHalves:[],aHalves:[],players:{}})}
 render();
}
async function checkRoster(g){
 const key=preKey(g);rosters.set(key,{pending:true,checkedAt:Date.now()});
 try{
  const summary=await api(matchSummaryUrl(g));
  rosters.set(key,{home:teamLineup(summary,g.home),away:teamLineup(summary,g.away),homeTeamId:g.home.id,awayTeamId:g.away.id,checkedAt:Date.now()});
 }catch{rosters.set(key,{home:null,away:null,checkedAt:Date.now()})}
 render();
}
const originalPreCards=renderPreCards;
renderPreCards=function(){const r=originalPreCards.apply(this,arguments);render();return r};
const originalMonitor=renderLineupMonitor;
renderLineupMonitor=function(){const r=originalMonitor.apply(this,arguments);render();return r};
render();
setInterval(()=>{if(!document.hidden)render()},60000);
})();
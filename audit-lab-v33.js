/* Green Lab PRO v33: painel de auditoria e laboratório local. */
(()=>{"use strict";
const root=document.createElement("section");root.className="signalhub";root.id="auditLab";
root.innerHTML='<div class="signalhead"><div><span class="eyebrow">🧪 AUDITORIA AUTOMÁTICA</span><h2>Coleta e laboratório de sinais</h2></div><span class="signalstatus" id="auditStatus">Verificando</span></div><div id="auditInfo" class="facts">Consultando o snapshot público…</div><p>Os registros do laboratório ficam neste navegador. Não são apostas executadas nem resultados verificados.</p><div class="facts" id="labStats"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button id="labAdd" class="sigbutton">+ Registrar estudo</button><button id="labExport" class="sigbutton">Exportar registros JSON</button></div><div id="labRows"></div>';
const anchor=document.getElementById("lineupHub")||document.getElementById("highlights");
if(anchor)anchor.parentNode.insertBefore(root,anchor);else document.body.appendChild(root);
const key="gl-lab-records-v33";
const el=id=>document.getElementById(id);
let records=[];try{const raw=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(raw))records=raw.filter(x=>x&&typeof x==="object").slice(-300)}catch{}
const escape=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const save=()=>{try{localStorage.setItem(key,JSON.stringify(records.slice(-300)))}catch{}};
function render(){
 const settled=records.filter(x=>x.outcome==="green"||x.outcome==="red");
 const green=settled.filter(x=>x.outcome==="green").length;
 el("labStats").textContent=records.length+" estudos registrados · "+settled.length+" resultados informados · "+green+" acertos informados · "+(settled.length?Math.round(100*green/settled.length)+"% de acerto informado":"sem taxa de acerto");
 el("labRows").innerHTML=records.slice().reverse().slice(0,20).map(x=>'<div class="signalitem"><b>'+escape(x.game)+'</b> · '+escape(x.market)+'<div class="facts">Odd anotada: '+(x.odd?escape(x.odd):"não informada")+' · '+escape(x.outcome==="green"?"Green informado":x.outcome==="red"?"Red informado":"Pendente")+'</div><button class="sigbutton" data-id="'+escape(x.id)+'" data-outcome="green">Marcar green</button> <button class="sigbutton" data-id="'+escape(x.id)+'" data-outcome="red">Marcar red</button> <button class="sigbutton" data-id="'+escape(x.id)+'" data-outcome="pending">Pendente</button></div>').join("")||'<div class="empty">Nenhum estudo registrado neste aparelho.</div>';
 root.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>{const r=records.find(x=>x.id===b.dataset.id);if(r){r.outcome=b.dataset.outcome;save();render()}});
}
el("labAdd").onclick=()=>{
 const game=prompt("Jogo (ex.: Time A x Time B)");if(!game||!game.trim())return;
 const market=prompt("Mercado estudado (ex.: mais de 1,5 gols)");if(!market||!market.trim())return;
 const oddRaw=prompt("Odd observada (opcional; deixe vazio se não souber)","");
 const odd=oddRaw?Number(oddRaw.replace(",",".")):null;
 if(oddRaw&&(!Number.isFinite(odd)||odd<=1)){alert("Odd inválida. O registro não foi salvo.");return}
 records.push({id:Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),game:game.trim().slice(0,140),market:market.trim().slice(0,140),odd,createdAt:new Date().toISOString(),outcome:"pending",source:"anotação manual"});save();render();
};
el("labExport").onclick=()=>{
 const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),records},null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="green-lab-registros.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
async function checkSnapshot(){
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
  let res;try{res=await fetch("./data/radar-snapshot.json?t="+Date.now(),{cache:"no-store",signal:controller.signal})}finally{clearTimeout(timer)}
  if(!res.ok)throw Error("HTTP "+res.status);
  const data=await res.json();
  if(!data.generated_at_utc){el("auditStatus").textContent="Primeira execução pendente";el("auditInfo").textContent="Workflow publicado; aguardando o primeiro snapshot gerado.";return}
  const time=new Date(data.generated_at_utc),age=Date.now()-time.getTime();
  const fresh=Number.isFinite(age)&&age>=0&&age<90*60000;
  el("auditStatus").textContent=fresh?"Coleta recente":"Coleta atrasada";
  el("auditInfo").textContent="Última coleta: "+time.toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})+" (Brasília) · "+(data.games?.length||0)+" partidas · "+(data.failed_requests?.length||0)+" falhas. Fonte ESPN não oficial. Sem odds verificadas e sem confirmação oficial dos titulares.";
 }catch{el("auditStatus").textContent="Fonte indisponível";el("auditInfo").textContent="Não foi possível consultar o snapshot automático. O radar principal continua independente."}
}
render();checkSnapshot();setInterval(()=>{if(!document.hidden)checkSnapshot()},300000);
})();
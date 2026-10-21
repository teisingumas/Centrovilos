/* Centro Vila – butų puslapis: aukšto pasirinkimas (planas ir butų kortelės) */
const T="—";
const FLOORS={
  1:{ name:"1 aukštas", apts:[
    { no:"01", area:"72,03 m²", floor:"1", rooms:"1–3", orient:"R / V / Š", status:"Rezervuotas" },
    { no:"02", area:"70,41 m²", floor:"1", rooms:"1–3", orient:"R / P / V", status:"Rezervuotas" } ] },
  2:{ name:"2 aukštas", apts:[
    { no:"03", area:"70,90 m²", floor:"2", rooms:"3", orient:"R / V / Š", status:"Laisvas" },
    { no:"04", area:"74,82 m²", floor:"2", rooms:"3", orient:"R / P / V", status:"Laisvas" } ] },
  3:{ name:"3 aukštas + mansarda", apts:[
    { no:"05", area:"126,36 m²", floor:"3 + mansarda", rooms:"5", orient:"R / Š / V", status:"Laisvas" },
    { no:"06", area:"131,65 m²", floor:"3 + mansarda", rooms:"5", orient:"R / P / V", status:"Laisvas" } ] }
};
const ARROW='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5"/></svg>';
const flBtns=[...document.querySelectorAll(".bt-floor")];
function showFloor(n,focus){
  const f=FLOORS[n]; if(!f) return;
  flBtns.forEach(b=>{ const on=b.dataset.floor==n; b.setAttribute("aria-selected",on); b.tabIndex=on?0:-1; if(on&&focus) b.focus(); });
  $("btPanel").setAttribute("aria-labelledby","fl"+n);
  $("btPlan").src="../img/planai/aukstas-"+n+".webp"; $("btPlan").alt=f.name+" – butų planas";
  $("btApts").innerHTML=f.apts.map(a=>`<article class="bt-apt" data-no="${a.no}">
    <div class="bt-apt-hd"><h2>Butas ${a.no}</h2>${a.status?`<span class="bt-badge${a.status==="Laisvas"?" bt-badge--free":""}">${a.status}</span>`:""}</div>
    <dl><div><dt>Plotas</dt><dd>${a.area}</dd></div><div><dt>Aukštas</dt><dd>${a.floor}</dd></div><div><dt>Kambariai</dt><dd>${a.rooms}</dd></div><div><dt>Orientacija</dt><dd>${a.orient}</dd></div></dl>
    <a class="cta ghost" href="/${+a.no}-butas/">Plačiau ${ARROW}</a></article>`).join("");
  drawShapes(n);
}
/* ---------- butų kontūrai plane (iš <template id="btK1..3">, kodas iš kontūrų redaktoriaus) ---------- */
const NS="http://www.w3.org/2000/svg";
function hotApt(no,on){
  document.querySelectorAll(`[data-no="${no}"]`).forEach(el=>el.classList.toggle("hot",on));
}
function drawShapes(n){
  const svg=$("btShapes"), tpl=$("btK"+n); svg.textContent=""; if(!tpl) return;
  tpl.content.querySelectorAll("a.bldg").forEach(src=>{
    const no=(src.getAttribute("href")||"").replace("#butas-","");
    const a=document.createElementNS(NS,"a"); a.setAttribute("href","/"+(+no)+"-butas/"); a.dataset.no=no;
    a.setAttribute("aria-label",src.getAttribute("aria-label")||("Butas "+no));
    src.querySelectorAll("path").forEach(p=>{ const q=document.createElementNS(NS,"path"); q.setAttribute("d",p.getAttribute("d")); a.appendChild(q); });
    a.addEventListener("pointerenter",()=>hotApt(no,true)); a.addEventListener("pointerleave",()=>hotApt(no,false));
    a.addEventListener("focus",()=>hotApt(no,true)); a.addEventListener("blur",()=>hotApt(no,false));
    svg.appendChild(a);
  });
}
$("btApts").addEventListener("pointerover",e=>{ const c=e.target.closest(".bt-apt"); if(c) hotApt(c.dataset.no,true); });
$("btApts").addEventListener("pointerout",e=>{ const c=e.target.closest(".bt-apt"); if(c && !c.contains(e.relatedTarget)) hotApt(c.dataset.no,false); });
flBtns.forEach((b,i)=>{
  b.addEventListener("click",()=>{ const n=b.dataset.floor; showFloor(n);
    if(curFloor()!=n) history.pushState({floor:n},"","/"+n+"-aukstas/");
    toTabs(true); });
  b.addEventListener("keydown",e=>{
    const d=e.key==="ArrowRight"||e.key==="ArrowDown"?1:e.key==="ArrowLeft"||e.key==="ArrowUp"?-1:0;
    if(!d) return; e.preventDefault(); showFloor(flBtns[(i+d+flBtns.length)%flBtns.length].dataset.floor,true);
  });
});
/* aukštas pagal adresą: /1-aukstas/, /2-aukstas/, /3-aukstas/ (senos #aukstas-N nuorodos irgi veikia) */
function curFloor(){
  const p=location.pathname.match(/\/([1-3])-aukstas\/?$/), h=location.hash.match(/^#aukstas-([1-3])$/);
  return h?h[1]:p?p[1]:"1";
}
function toTabs(smooth){ $("aukstai").scrollIntoView({block:"start",behavior:smooth?"smooth":"auto"}); }
const startFloor=curFloor();
showFloor(startFloor);
/* /2-aukstas/, /3-aukstas/ arba #aukstai – iškart nuslenkame iki aukšto pasirinkimo */
if(startFloor!=="1"||location.hash){ toTabs(); addEventListener("load",()=>toTabs(),{once:true}); }
addEventListener("popstate",()=>showFloor(curFloor()));

/* plano didinimas: atidaro pasirinkto aukšto planą per visą ekraną */
const dlg=$("planDlg");
$("btZoom").addEventListener("click",()=>{ $("planDlgImg").src=$("btPlan").src; $("planDlgImg").alt=$("btPlan").alt; dlg.showModal(); });
$("planDlgX").addEventListener("click",()=>dlg.close());
dlg.addEventListener("click",e=>{ if(e.target===dlg) dlg.close(); });

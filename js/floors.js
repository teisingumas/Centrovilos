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
    { no:"05", area:T, floor:"3 + mansarda", rooms:T, orient:T },
    { no:"06", area:T, floor:"3 + mansarda", rooms:T, orient:T } ] }
};
const ARROW='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5"/></svg>';
const flBtns=[...document.querySelectorAll(".bt-floor")];
function showFloor(n,focus){
  const f=FLOORS[n]; if(!f) return;
  flBtns.forEach(b=>{ const on=b.dataset.floor==n; b.setAttribute("aria-selected",on); b.tabIndex=on?0:-1; if(on&&focus) b.focus(); });
  $("btPanel").setAttribute("aria-labelledby","fl"+n);
  $("btPlan").src="../img/planai/aukstas-"+n+".webp"; $("btPlan").alt=f.name+" – butų planas";
  $("btApts").innerHTML=f.apts.map(a=>`<article class="bt-apt">
    <div class="bt-apt-hd"><h2>Butas ${a.no}</h2>${a.status?`<span class="bt-badge${a.status==="Laisvas"?" bt-badge--free":""}">${a.status}</span>`:""}</div>
    <dl><div><dt>Plotas</dt><dd>${a.area}</dd></div><div><dt>Aukštas</dt><dd>${a.floor}</dd></div><div><dt>Kambariai</dt><dd>${a.rooms}</dd></div><div><dt>Orientacija</dt><dd>${a.orient}</dd></div></dl>
    <a class="cta ghost" href="../kontaktai/index.html?butas=${a.no}">Plačiau ${ARROW}</a></article>`).join("");
}
flBtns.forEach((b,i)=>{
  b.addEventListener("click",()=>{ showFloor(b.dataset.floor); history.replaceState(null,"","#aukstas-"+b.dataset.floor); });
  b.addEventListener("keydown",e=>{
    const d=e.key==="ArrowRight"||e.key==="ArrowDown"?1:e.key==="ArrowLeft"||e.key==="ArrowUp"?-1:0;
    if(!d) return; e.preventDefault(); showFloor(flBtns[(i+d+flBtns.length)%flBtns.length].dataset.floor,true);
  });
});
/* nuoroda su #aukstas-2 / #aukstas-3 atidaro tą aukštą */
const m=location.hash.match(/^#aukstas-([1-3])$/); if(m) showFloor(m[1]);

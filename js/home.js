/* Centro Vila – pagrindinio puslapio skriptas */
const FLOORS = {
  "aukstas-3": { title:"3 aukštas", note:"su mansarda", apts:[{ no:"05", area:"126,36 m²", status:"Laisvas" },{ no:"06", area:"131,65 m²", status:"Laisvas" }] },
  "aukstas-2": { title:"2 aukštas", apts:[{ no:"03", area:"70,90 m²", status:"Laisvas" },{ no:"04", area:"74,82 m²", status:"Laisvas" }] },
  "aukstas-1": { title:"1 aukštas", apts:[{ no:"01", area:"72,03 m²", status:"Rezervuotas" },{ no:"02", area:"70,41 m²", status:"Rezervuotas" }] }
};
/* x,y – taškas žemėlapyje (1000×760) */
const PLACES = [
  { name:"Laisvės alėja",     min:5,  walk:true, x:560, y:410 },
  { name:"PC „Akropolis”",    min:6,  x:612, y:604 },
  { name:"Ąžuolynas",         min:8,  x:956, y:200 },
  { name:"Kauno senamiestis", min:10, x:120, y:444 },
  { name:"Nemuno sala",       min:12, x:500, y:630 },
  { name:"Žalgirio arena",    min:14, x:410, y:628 }
];
const NS="http://www.w3.org/2000/svg";
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- loader ---------- */
(function(){
  const paths=[...document.querySelectorAll("#loader .lp")];
  const heroSrc = innerWidth<900 ? "img/hero-1280.webp" : "img/hero.webp";
  document.querySelectorAll("#heroPic .hp").forEach(i=>i.setAttribute("href",heroSrc));
  const jobs=[heroSrc,"img/dron.webp"].map(src=>new Promise(r=>{const i=new Image(); i.onload=i.onerror=r; i.src=src;}));
  try{ jobs.push(document.fonts.ready); }catch(e){}
  let loaded=0; const total=jobs.length; jobs.forEach(p=>p.then(()=>loaded++));
  const MIN = reduce? 300 : 2100, t0=performance.now(); let shown=0, finished=false;
  function frame(now){
    const target=Math.min(loaded/total, (now-t0)/MIN);
    shown += (target-shown)*0.12; if(target-shown<0.002) shown=target;
    const p=Math.min(1,shown);
    const draw=Math.min(1,p/0.72), fill=Math.max(0,(p-0.62)/0.38);
    paths.forEach((el,i)=>{ const d=Math.min(1,Math.max(0,draw*1.25-i*0.018)); el.style.strokeDashoffset=1-d; el.style.fillOpacity=fill; });
    $("ldPct").textContent=Math.round(p*100); $("ldBar").style.transform=`scaleX(${p})`;
    if(p>=1 && !finished){ finished=true; setTimeout(done, reduce?0:380); return; }
    requestAnimationFrame(frame);
  }
  function done(){ $("loader").classList.add("done");
    if(!reduce) setTimeout(()=>{ $("heroSvg").classList.add("hint"); },900); }
  requestAnimationFrame(frame);
  setTimeout(()=>{ if(!finished){ finished=true; done(); } }, 8000);
})();

/* ---------- active menu item ---------- */
const secMap={pagrindinis:"#pagrindinis",apie:"#apie",vieta:"#apie"};
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ const h=secMap[e.target.id]; document.querySelectorAll(".nav a").forEach(a=>a.classList.toggle("on",a.getAttribute("href")===h)); } }),{rootMargin:"-45% 0px -50% 0px"});
Object.keys(secMap).forEach(id=>{ const el=$(id); if(el) io.observe(el); });

/* ---------- floors (from the contour editor code) ---------- */
const floorsG=$("floors"), tip=$("tip"), media=$("heroMedia"), ui=$("floorsUi"), panel=$("panel");
const groups=[...$("konturai").content.querySelectorAll("a.bldg")].map(a=>({
  key:(a.getAttribute("href")||"").replace("#",""),
  name:a.getAttribute("aria-label")||"",
  d:[...a.querySelectorAll("path")].map(p=>p.getAttribute("d")).join(" ")
})).sort((a,b)=>b.key.localeCompare(a.key));
let selKey=null;
groups.forEach(g=>{
  const info=FLOORS[g.key]||{title:g.name,apts:[]};
  const p=document.createElementNS(NS,"path");
  p.setAttribute("d",g.d); p.setAttribute("class","floor"); p.dataset.k=g.key;
  p.setAttribute("tabindex","0"); p.setAttribute("role","button"); p.setAttribute("aria-label",info.title+", "+info.apts.length+" butai");
  floorsG.appendChild(p);
  const b=document.createElement("button"); b.className="fbtn"; b.dataset.k=g.key; b.style.setProperty("--o",parseInt(info.title)||0);
  b.innerHTML=`<b>${info.title.split(" ")[0]}</b><span>aukštas · ${info.apts.length} butai${info.note?`<i>${info.note}</i>`:""}</span>`;
  ui.appendChild(b);
});
function hot(k,on){ document.querySelectorAll(`[data-k="${k}"]`).forEach(el=>el.classList.toggle("hot",on)); }
function select(k){
  selKey=k; document.querySelectorAll("[data-k]").forEach(el=>el.classList.toggle("sel",el.dataset.k===k));
  if(!k){ panel.classList.remove("on"); return; }
  const info=FLOORS[k]; $("pTitle").innerHTML=info.title+(info.note?`<small>${info.note}</small>`:"");
  $("pApts").innerHTML=info.apts.map(a=>`<div class="apt"><b>Butas ${a.no}<small>${a.area||"—"}</small></b>${a.status?`<span class="bt-badge${a.status==="Laisvas"?" bt-badge--free":""}">${a.status}</span>`:""}</div>`).join("");
  panel.querySelector(".cta").href="1-aukstas/index.html#"+k;
  panel.classList.add("on");
}
floorsG.addEventListener("pointermove",e=>{
  const t=e.target.closest(".floor"); if(!t||e.pointerType==="touch") return;
  const info=FLOORS[t.dataset.k]; const r=media.getBoundingClientRect();
  tip.querySelector("b").innerHTML=info.title+(info.note?`<small>${info.note}</small>`:""); tip.querySelector("span").textContent=info.apts.length+" butai · spauskite";
  tip.style.left=(e.clientX-r.left)+"px"; tip.style.top=(e.clientY-r.top)+"px"; tip.classList.add("on");
});
floorsG.addEventListener("pointerover",e=>{ const t=e.target.closest(".floor"); if(t) hot(t.dataset.k,true); });
floorsG.addEventListener("pointerout",e=>{ const t=e.target.closest(".floor"); if(t){ hot(t.dataset.k,false); tip.classList.remove("on"); } });
floorsG.addEventListener("click",e=>{ const t=e.target.closest(".floor"); if(t) select(t.dataset.k); });
floorsG.addEventListener("keydown",e=>{ if((e.key==="Enter"||e.key===" ")&&e.target.dataset.k){ e.preventDefault(); select(e.target.dataset.k); } });
ui.addEventListener("click",e=>{ const b=e.target.closest(".fbtn"); if(b) select(selKey===b.dataset.k?null:b.dataset.k); });
ui.addEventListener("pointerover",e=>{ const b=e.target.closest(".fbtn"); if(b) hot(b.dataset.k,true); });
ui.addEventListener("pointerout",e=>{ const b=e.target.closest(".fbtn"); if(b) hot(b.dataset.k,false); });
$("panelX").onclick=()=>select(null);
document.addEventListener("keydown",e=>{ if(e.key==="Escape") select(null); });
document.querySelectorAll("[data-pick]").forEach(a=>a.addEventListener("click",e=>{
  e.preventDefault(); scrollTo({top:0,behavior:reduce?"auto":"smooth"});
  const svg=$("heroSvg"); svg.classList.remove("hint"); void svg.getBBox(); setTimeout(()=>svg.classList.add("hint"),reduce?0:400);
  if(!selKey) setTimeout(()=>select(groups[0]&&groups[0].key),reduce?0:900);
}));

/* ---------- hero framing: fill the screen, crop sides first; on very wide screens trim sky (max 30px) before the pavement ---------- */
/* The whole height (chimney → pavement) always stays on screen.
   Narrower than 2:1 → trim the sides. Wider than 2:1 → the outer 320px of trees on each side
   are stretched sideways to fill the screen; the building itself is never distorted. */
function frameHero(){
  const IW=2576, IH=1288, S=320, svg=$("heroSvg");
  const r=media.clientWidth/Math.max(1,media.clientHeight);
  let E=0, x=0, w=IW, y=0, h=IH;
  if(r<=IW/IH){ w=IH*r; x=(IW-w)/2; }
  else {
    const maxE=S*0.9;                       // stretch trees at most ~1.9×
    E=Math.min((IH*r-IW)/2, maxE);
    w=IW+2*E; h=Math.min(IH, w/r);          // beyond that, trim max 30px of sky
    y=Math.min(IH-h,30); h=w/r;
  }
  const set=(el,a)=>{ for(const k in a) el.setAttribute(k,a[k]); };
  set($("hpL"),{x:0,y:0,width:S+E,height:IH,viewBox:`0 0 ${S} ${IH}`});
  set($("hpC"),{x:S+E-3,y:0,width:IW-2*S+6,height:IH,viewBox:`${S-3} 0 ${IW-2*S+6} ${IH}`}); /* 3px overlap hides seams */
  set($("hpR"),{x:IW-S+E,y:0,width:S+E,height:IH,viewBox:`${IW-S} 0 ${S} ${IH}`});
  floorsG.setAttribute("transform",`translate(${E.toFixed(1)} 0)`);
  svg.setAttribute("viewBox",`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
}
frameHero(); addEventListener("resize",frameHero);
if("ResizeObserver" in window) new ResizeObserver(frameHero).observe(media);

/* ---------- map: schematic bronze-line map (js/locmap.js) ---------- */
(function(){
  const svg=$("locMap"), list=$("places");
  locMap(svg,PLACES);
  const routes=[...svg.querySelectorAll(".lm-route")], pins=[...svg.querySelectorAll(".lm-pin")];
  PLACES.forEach((pl,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`<button type="button"><span class="n">${i+1}</span><span class="nm">${pl.name}${pl.walk?'<span class="walk">pėsčiomis</span>':""}</span><span class="mn">${pl.min}<small>min.</small></span></button>`;
    const on=v=>{ routes[i].classList.toggle("on",v); pins[i].classList.toggle("on",v); li.classList.toggle("on",v); };
    const btn=li.firstChild;
    btn.addEventListener("pointerenter",()=>on(true)); btn.addEventListener("pointerleave",()=>on(false));
    btn.addEventListener("focus",()=>on(true)); btn.addEventListener("blur",()=>on(false));
    pins[i].addEventListener("pointerenter",()=>on(true)); pins[i].addEventListener("pointerleave",()=>on(false));
    list.appendChild(li);
  });
  /* phone: the map scrolls sideways – start centred on the villa */
  const centreMap=()=>{ const sc=$("mapScroll"); if(sc.scrollWidth>sc.clientWidth) sc.scrollLeft=(LM_HX/LM_W)*sc.scrollWidth-sc.clientWidth/2; };
  addEventListener("load",centreMap); addEventListener("resize",centreMap);
})();

/* ---------- reveal (only below-the-fold blocks animate) ---------- */
if(!reduce && "IntersectionObserver" in window){
  const els=[...document.querySelectorAll(".reveal")].filter(el=>el.getBoundingClientRect().top>innerHeight);
  els.forEach(el=>el.classList.add("pre"));
  const ro=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.remove("pre"); ro.unobserve(e.target); } }),{rootMargin:"0px 0px -10% 0px"});
  els.forEach(el=>ro.observe(el));
}

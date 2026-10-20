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
  const b=document.createElement("button"); b.className="fbtn"; b.dataset.k=g.key;
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

/* ---------- map: schematic bronze-line map of Kaunas centre (1000×760) ---------- */
(function(){
  const W=1000,H=760,HX=792,HY=486, svg=$("locMap"), list=$("places");
  const C={bg:"#120f0c",major:"#7a5232",minor:"#3d2a1b",water:"#5a3d26",label:"#a37a55",area:"#6b4e35",waterLabel:"#8a6444",accent:"#e09a5e",house:"#f4e6d4"};
  let seed=11; const R=()=>(seed=(seed*9301+49297)%233280)/233280;
  const P=a=>"M"+a.map(p=>p.map(v=>+v.toFixed(1)).join(",")).join(" L");
  const NEMUNAS="M0,520 C200,532 380,552 500,598 C580,628 640,690 680,760 L548,760 C520,706 470,672 380,654 C262,632 150,622 0,612 Z";
  const ISLAND="M352,622 C392,604 470,606 520,626 C500,646 440,652 372,644 C352,640 342,630 352,622 Z";
  const NERIS="M318,0 C292,150 190,300 0,404 L0,470 C214,356 330,190 382,0 Z";
  const NBANK=[[0,520],[200,532],[380,552],[500,598],[580,628],[640,690],[680,760]];
  const bankY=x=>{for(let i=0;i<NBANK.length-1;i++){const a=NBANK[i],b=NBANK[i+1];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return 900};
  const AZ="M880,96 C940,84 1000,90 1000,90 L1000,420 C960,416 920,404 902,384 C884,330 870,180 880,96 Z";
  const RAMYBE="M736,556 L828,552 L842,636 L746,642 Z";
  const MAJOR=[
    {n:"Savanorių pr.",p:[[378,384],[560,250],[770,0]],lp:.62},
    {n:"Laisvės al.",p:[[190,432],[400,420],[600,404]],lp:.45},
    {n:"Karaliaus Mindaugo pr.",p:[[0,496],[200,508],[380,528],[490,568],[580,600],[650,668],[700,760]],lp:.2},
    {n:"Vytauto pr.",p:[[868,0],[872,200],[886,420],[936,760]],lp:.7},
    {n:"Kęstučio g.",p:[[300,330],[700,300],[1000,262]],lp:.35}
  ];
  const MINOR=[];
  [460,520,560].forEach(y=>MINOR.push([[230,y-20+R()*8],[860,y-28+R()*8]]));
  [350,380].forEach(y=>MINOR.push([[260,y+40],[880,y]]));
  for(let x=260;x<=860;x+=58){const yb=Math.min(bankY(x)-26,610);MINOR.push([[x+R()*6,300+(x>600?-20:0)],[x+14+R()*6,yb]])}
  for(let i=0;i<9;i++){const x=470+i*52;MINOR.push([[x,0],[x-150,250+R()*20]])}
  for(let i=0;i<6;i++){const y=40+i*44;MINOR.push([[420+i*20,y+60],[860,y-10]])}
  for(let i=0;i<6;i++){const y=660+i*22;MINOR.push([[0,y],[360-i*30,y+18]])}
  [[60,640],[140,650],[220,660]].forEach(([x,y])=>MINOR.push([[x,y],[x+20,760]]));
  for(let i=0;i<4;i++)MINOR.push([[40+i*50,470-i*24],[150+i*40,560]]);
  MINOR.push([[786,420],[798,560]]); /* Trakų g. */
  const AREAS=[{t:"Senamiestis",x:96,y:470},{t:"Centras",x:520,y:470},{t:"Žaliakalnis",x:700,y:150},{t:"Aleksotas",x:120,y:716},{t:"Ąžuolynas",x:934,y:340},{t:"Ramybės parkas",x:790,y:604},{t:"Nemunas",x:240,y:586,water:1},{t:"Neris",x:200,y:250,water:1,rot:-38}];
  const route=p=>{const mx=(HX+p.x)/2,my=(HY+p.y)/2,dx=p.x-HX,dy=p.y-HY;return `M${HX},${HY} Q${mx-dy*.12},${my+dx*.12} ${p.x},${p.y}`};
  let s=`<defs><pattern id="lmPk" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${C.bg}"/><circle cx="3" cy="3" r=".8" fill="${C.water}"/></pattern>
    <clipPath id="lmWc"><path d="${NEMUNAS}"/><path d="${NERIS}"/></clipPath></defs>
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    <path d="${AZ}" fill="url(#lmPk)"/><path d="${RAMYBE}" fill="url(#lmPk)"/><path d="${ISLAND}" fill="url(#lmPk)"/>
    <path d="${NEMUNAS}" fill="none" stroke="${C.water}" stroke-width="1.2"/><path d="${NERIS}" fill="none" stroke="${C.water}" stroke-width="1.2"/>
    <path d="${ISLAND}" fill="none" stroke="${C.water}" stroke-width="1.2"/>`;
  for(let y=530;y<760;y+=9) s+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${C.water}" stroke-width=".6" clip-path="url(#lmWc)"/>`;
  s+=`<ellipse cx="948" cy="256" rx="34" ry="22" fill="none" stroke="${C.minor}" stroke-width="2"/>`;
  MINOR.forEach(m=>s+=`<path d="${P(m)}" stroke="${C.minor}" stroke-width=".9" fill="none" stroke-linecap="round"/>`);
  MAJOR.forEach(m=>s+=`<path d="${P(m.p)}" stroke="${C.major}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  MAJOR.forEach(m=>{const k=Math.min(m.p.length-2,Math.floor(m.lp*(m.p.length-1))),a=m.p[k],b=m.p[k+1];let r=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;if(r>90||r<-90)r+=180;const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
    s+=`<text x="${x}" y="${y-9}" transform="rotate(${r} ${x} ${y})" text-anchor="middle" font-family="Red Hat Display,sans-serif" font-size="12.5" letter-spacing="1.6" fill="${C.label}">${m.n.toUpperCase()}</text>`});
  AREAS.forEach(a=>{const col=a.water?C.waterLabel:a.t==="Ąžuolynas"||a.t==="Ramybės parkas"?C.waterLabel:C.area;
    s+=`<text x="${a.x}" y="${a.y}" ${a.rot?`transform="rotate(${a.rot} ${a.x} ${a.y})"`:""} text-anchor="middle" font-family="${a.water?"Bodoni Moda,serif":"Red Hat Display,sans-serif"}" font-style="${a.water?"italic":"normal"}" font-size="${a.water?18:13}" letter-spacing="${a.water?0:2.2}" fill="${col}">${a.water?a.t:a.t.toUpperCase()}</text>`});
  PLACES.forEach((p,i)=>s+=`<path class="lm-route" data-i="${i}" d="${route(p)}"/>`);
  PLACES.forEach((p,i)=>s+=`<g class="lm-pin" data-i="${i}"><g class="s"><circle cx="${p.x}" cy="${p.y}" r="13" fill="${C.accent}"/><text x="${p.x}" y="${p.y+4.2}" text-anchor="middle" font-family="Red Hat Display,sans-serif" font-weight="700" font-size="12" fill="${C.bg}">${i+1}</text></g></g>`);
  s+=`<circle cx="${HX}" cy="${HY}" r="22" fill="none" stroke="${C.accent}" stroke-width="1"/><circle cx="${HX}" cy="${HY}" r="9" fill="${C.accent}"/>
    <text x="${HX+26}" y="${HY-2}" font-family="Bodoni Moda,serif" font-size="22" fill="${C.house}" paint-order="stroke" stroke="${C.bg}" stroke-width="5">Centro Vila</text>
    <text x="${HX+27}" y="${HY+16}" font-family="Red Hat Display,sans-serif" font-size="10.5" letter-spacing="2.2" fill="${C.accent}" paint-order="stroke" stroke="${C.bg}" stroke-width="4">TRAKŲ G. 16</text>`;
  svg.innerHTML=s;
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
  const centreMap=()=>{ const sc=$("mapScroll"); if(sc.scrollWidth>sc.clientWidth) sc.scrollLeft=(HX/W)*sc.scrollWidth-sc.clientWidth/2; };
  addEventListener("load",centreMap); addEventListener("resize",centreMap);
})();

/* ---------- reveal (only below-the-fold blocks animate) ---------- */
if(!reduce && "IntersectionObserver" in window){
  const els=[...document.querySelectorAll(".reveal")].filter(el=>el.getBoundingClientRect().top>innerHeight);
  els.forEach(el=>el.classList.add("pre"));
  const ro=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.remove("pre"); ro.unobserve(e.target); } }),{rootMargin:"0px 0px -10% 0px"});
  els.forEach(el=>ro.observe(el));
}

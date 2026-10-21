/* Centro Vila – bendras skriptas: antraštė ir meniu */
const $=id=>document.getElementById(id);
/* naujas puslapis visada atsidaro nuo viršaus (naršyklė neatkuria ankstesnės slinkties vietos),
   išskyrus nuorodas su #vieta – jas sutvarko pats puslapis */
if("scrollRestoration" in history) history.scrollRestoration="manual";
function toTop(){
  /* akimirksniu, be sklandaus slinkimo (CSS scroll-behavior:smooth laikinai išjungiamas) */
  const r=document.documentElement, prev=r.style.scrollBehavior;
  r.style.scrollBehavior="auto";
  try{ scrollTo({top:0,left:0,behavior:"instant"}); }catch(e){ scrollTo(0,0); }
  r.style.scrollBehavior=prev;
}
if(!location.hash && !/\/[23]-aukstas\/?$/.test(location.pathname)){
  toTop();
  addEventListener("DOMContentLoaded",toTop,{once:true});
  /* kai kurios aplinkos (pvz. peržiūros rėmelis) atkuria slinktį jau po užkrovimo – pakartojame */
  addEventListener("load",()=>{ toTop(); setTimeout(toTop,120); setTimeout(toTop,450); },{once:true});
  addEventListener("pageshow",e=>{ if(e.persisted) toTop(); });
}
/* ---------- header ---------- */
const hdr=$("hdr");
const keepSolid=hdr.classList.contains("solid"); /* vidiniuose puslapiuose antraštė visada šviesi */
/* mobiliajame „Rinkis butą“ rodomas tik praslinkus pirmą (hero) sekciją */
const heroSec=document.querySelector("main > section");
function onScroll(){
  hdr.classList.toggle("solid", keepSolid || scrollY > 10);
  hdr.classList.toggle("cta-on", !heroSec || scrollY > heroSec.offsetTop + heroSec.offsetHeight - hdr.offsetHeight);
}
addEventListener("scroll",onScroll,{passive:true}); addEventListener("resize",onScroll); onScroll();
/* mobilaus meniu telefonai ir CTA (rodomi tik „Popieriaus“ meniu apačioje) */
(function(){
  const nav=$("nav"), cta=hdr.querySelector(".hdr-end .cta"); if(!nav) return;
  const li=document.createElement("li"); li.className="nav-meta";
  const arrow='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5"/></svg>';
  li.innerHTML=
    '<div class="ppl"><div><b>Juras Sadauskas</b><a href="tel:+37060101066">+370 601 01066</a></div><div><b>Darius Uleckas</b><a href="tel:+37069938883">+370 699 38883</a></div></div>'+
    '<a class="cta" href="'+(cta?cta.getAttribute("href"):"#")+'">Rinkis butą '+arrow+'</a>';
  nav.appendChild(li);
})();
function setMenu(o){
  const b=$("burger").getBoundingClientRect(), nav=$("nav");
  if(nav){ nav.style.setProperty("--ox",(b.left+b.width/2)+"px"); nav.style.setProperty("--oy",(b.top+b.height/2)+"px"); }
  hdr.classList.toggle("open",o); document.documentElement.classList.toggle("menu-open",o);
  $("burger").setAttribute("aria-expanded",o); $("burger").setAttribute("aria-label",o?"Uždaryti meniu":"Meniu");
}
$("burger").onclick=()=>setMenu(!hdr.classList.contains("open"));
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
addEventListener("keydown",e=>{ if(e.key==="Escape" && hdr.classList.contains("open")) setMenu(false); });
matchMedia("(min-width:1021px)").addEventListener("change",e=>{ if(e.matches) setMenu(false); });

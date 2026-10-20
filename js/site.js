/* Centro Vila – bendras skriptas: antraštė ir meniu */
const $=id=>document.getElementById(id);
/* naujas puslapis visada atsidaro nuo viršaus (naršyklė neatkuria ankstesnės slinkties vietos),
   išskyrus nuorodas su #vieta – jas sutvarko pats puslapis */
if("scrollRestoration" in history) history.scrollRestoration="manual";
function toTop(){
  try{ scrollTo(0,0); (document.scrollingElement||document.documentElement).scrollTop=0; document.body&&(document.body.scrollTop=0); }catch(e){}
}
if(!location.hash){
  toTop();
  addEventListener("DOMContentLoaded",toTop,{once:true});
  /* kai kurios aplinkos (pvz. peržiūros rėmelis) atkuria slinktį jau po užkrovimo – pakartojame */
  addEventListener("load",()=>{ toTop(); setTimeout(toTop,120); setTimeout(toTop,450); },{once:true});
  addEventListener("pageshow",e=>{ if(e.persisted) toTop(); });
}
/* ---------- header ---------- */
const hdr=$("hdr");
const keepSolid=hdr.classList.contains("solid"); /* vidiniuose puslapiuose antraštė visada šviesi */
function onScroll(){ hdr.classList.toggle("solid", keepSolid || scrollY > 10); }
addEventListener("scroll",onScroll,{passive:true}); onScroll();
$("burger").onclick=()=>{ const o=hdr.classList.toggle("open"); $("burger").setAttribute("aria-expanded",o); };
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>{ hdr.classList.remove("open"); $("burger").setAttribute("aria-expanded","false"); }));

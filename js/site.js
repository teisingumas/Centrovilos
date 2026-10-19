/* Centro Vila – bendras skriptas: antraštė ir meniu */
const $=id=>document.getElementById(id);
/* ---------- header ---------- */
const hdr=$("hdr");
const keepSolid=hdr.classList.contains("solid"); /* vidiniuose puslapiuose antraštė visada šviesi */
function onScroll(){ hdr.classList.toggle("solid", keepSolid || scrollY > 10); }
addEventListener("scroll",onScroll,{passive:true}); onScroll();
$("burger").onclick=()=>{ const o=hdr.classList.toggle("open"); $("burger").setAttribute("aria-expanded",o); };
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>{ hdr.classList.remove("open"); $("burger").setAttribute("aria-expanded","false"); }));

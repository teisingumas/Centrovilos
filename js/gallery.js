/* Centro Vila – galerija: nuotraukų peržiūra (lightbox) */
const glItems=[...document.querySelectorAll(".gl-item")];
const lb=$("lb"); let lbI=0;
function lbShow(i){
  lbI=(i+glItems.length)%glItems.length;
  const img=glItems[lbI].querySelector("img");
  $("lbImg").src=img.src.replace("-m.webp",".webp"); $("lbImg").alt=img.alt;
  $("lbCap").textContent=img.alt; $("lbCount").textContent=(lbI+1)+" / "+glItems.length;
  /* kitą nuotrauką užkrauname iš anksto */
  const n=glItems[(lbI+1)%glItems.length].querySelector("img"); new Image().src=n.src.replace("-m.webp",".webp");
}
glItems.forEach((b,i)=>b.addEventListener("click",()=>{ lbShow(i); lb.showModal(); }));
$("lbX").onclick=()=>lb.close();
$("lbPrev").onclick=()=>lbShow(lbI-1);
$("lbNext").onclick=()=>lbShow(lbI+1);
lb.addEventListener("click",e=>{ if(e.target===lb||e.target.classList.contains("lb-fig")) lb.close(); });
lb.addEventListener("keydown",e=>{ if(e.key==="ArrowLeft") lbShow(lbI-1); if(e.key==="ArrowRight") lbShow(lbI+1); });
lb.addEventListener("close",()=>glItems[lbI].focus());
/* telefone – braukite į šonus */
let tx=null;
lb.addEventListener("touchstart",e=>{ tx=e.touches[0].clientX; },{passive:true});
lb.addEventListener("touchend",e=>{ if(tx===null) return; const dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>50) lbShow(lbI+(dx<0?1:-1)); tx=null; });

/* Centro Vila – buto puslapis: plano didinimas (kiekvienam planui) */
const dlg=$("planDlg");
document.querySelectorAll(".apt-plan").forEach(fig=>{
  const img=fig.querySelector("img");
  fig.querySelector(".bt-zoom").addEventListener("click",()=>{ $("planDlgImg").src=img.src; $("planDlgImg").alt=img.alt; dlg.showModal(); });
});
$("planDlgX").addEventListener("click",()=>dlg.close());
dlg.addEventListener("click",e=>{ if(e.target===dlg) dlg.close(); });

/* ---------- patalpų kontūrai plane: užvedus ant numerio sąraše paryškėja patalpa ir atvirkščiai ---------- */
(function(){
  const NS="http://www.w3.org/2000/svg";
  const figs=[...document.querySelectorAll(".apt-plan")], lists=[...document.querySelectorAll(".apt-rooms ol")];
  figs.forEach((fig,i)=>{
    const tpl=$("rmK"+i), ol=lists[i]; if(!tpl||!ol) return;
    const img=fig.querySelector("img");
    const wrap=document.createElement("div"); wrap.className="bt-planwrap"; img.before(wrap); wrap.appendChild(img);
    const svg=document.createElementNS(NS,"svg"); svg.setAttribute("class","bt-shapes rm-shapes");
    svg.setAttribute("viewBox",tpl.content.querySelector("svg").getAttribute("viewBox")); svg.setAttribute("preserveAspectRatio","none"); svg.setAttribute("aria-hidden","true");
    wrap.appendChild(svg);
    const items=[...ol.children];
    const hot=(n,on)=>{ svg.querySelectorAll(`[data-n="${n}"]`).forEach(e=>e.classList.toggle("hot",on)); items.forEach(li=>{ if(li.querySelector(".n")?.textContent.trim()===n) li.classList.toggle("hot",on); }); };
    tpl.content.querySelectorAll("a.bldg").forEach(src=>{
      const n=(src.getAttribute("href")||"").replace("#patalpa-","");
      const g=document.createElementNS(NS,"g"); g.dataset.n=n;
      src.querySelectorAll("path").forEach(p=>{ const q=document.createElementNS(NS,"path"); q.setAttribute("d",p.getAttribute("d")); g.appendChild(q); });
      g.addEventListener("pointerenter",()=>hot(n,true)); g.addEventListener("pointerleave",()=>hot(n,false));
      svg.appendChild(g);
    });
    items.forEach(li=>{ const n=li.querySelector(".n")?.textContent.trim(); if(!n) return;
      li.addEventListener("pointerenter",()=>hot(n,true)); li.addEventListener("pointerleave",()=>hot(n,false)); });
  });
})();

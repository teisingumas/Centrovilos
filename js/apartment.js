/* Centro Vila – buto puslapis: plano didinimas (kiekvienam planui) */
const dlg=$("planDlg");
document.querySelectorAll(".apt-plan").forEach(fig=>{
  const img=fig.querySelector("img");
  fig.querySelector(".bt-zoom").addEventListener("click",()=>{ $("planDlgImg").src=img.src; $("planDlgImg").alt=img.alt; dlg.showModal(); });
});
$("planDlgX").addEventListener("click",()=>dlg.close());
dlg.addEventListener("click",e=>{ if(e.target===dlg) dlg.close(); });

/* Centro Vila – buto puslapis: plano didinimas */
const dlg=$("planDlg");
$("btZoom").addEventListener("click",()=>{ $("planDlgImg").alt=$("btPlan").alt; dlg.showModal(); });
$("planDlgX").addEventListener("click",()=>dlg.close());
dlg.addEventListener("click",e=>{ if(e.target===dlg) dlg.close(); });

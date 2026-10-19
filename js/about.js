/* Centro Vila – Apie projektą: specifikacijos skirtukai */
const apTabs=[...document.querySelectorAll(".ap-tab")];
function apShow(tab){
  apTabs.forEach(t=>{ const on=t===tab; t.setAttribute("aria-selected",on); t.tabIndex=on?0:-1; $(t.getAttribute("aria-controls")).hidden=!on; });
}
apTabs.forEach((t,i)=>{
  t.addEventListener("click",()=>apShow(t));
  t.addEventListener("keydown",e=>{
    const d=e.key==="ArrowDown"||e.key==="ArrowRight"?1:e.key==="ArrowUp"||e.key==="ArrowLeft"?-1:0;
    if(!d) return; e.preventDefault(); const n=apTabs[(i+d+apTabs.length)%apTabs.length]; apShow(n); n.focus();
  });
});
